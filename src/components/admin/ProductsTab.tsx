'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Plus, X, Upload, Loader2, Check, Pencil, Trash2,
  ImageIcon, Package, AlertCircle, ChevronDown,
  Zap, Leaf, Wheat, Flame,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import Papa from 'papaparse';

// ── Types ────────────────────────────────────────────────────────
export type Product = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  price: number;
  presentation: string | null;
  ingredients: string | null;
  is_keto: boolean;
  is_gluten_free: boolean;
  is_high_protein: boolean;
  stock_status: boolean;
  image_urls: string[] | null;
  created_at: string;
};

type FormData = {
  name: string;
  category: string;
  price: string;
  description: string;
  presentation: string;
  ingredients: string;
  is_keto: boolean;
  is_gluten_free: boolean;
  is_high_protein: boolean;
  stock_status: boolean;
};

const CATEGORIES = ['Viandas', 'Tartas', 'Wraps', 'Pizzas', 'Hamburguesas', 'Desayunos', 'Otros'];

const EMPTY_FORM: FormData = {
  name: '', category: 'Tartas', price: '',
  description: '', presentation: '', ingredients: '',
  is_keto: false, is_gluten_free: false, is_high_protein: false,
  stock_status: true,
};

// ── Image Compressor (Canvas → WebP) ────────────────────────────
type CompressResult = { blob: Blob; sizeKB: number; qualityPct: number; url: string };

async function compressToWebP(
  file: File,
  maxKB = 180,       // Target < 200KB con margen
  maxDim = 1200,     // Max dimensión HD
): Promise<CompressResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);

      // ── Escalar preservando aspect ratio ──
      let { naturalWidth: w, naturalHeight: h } = img;
      if (w > maxDim || h > maxDim) {
        const ratio = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);

      // ── Búsqueda binaria de la mayor calidad que quepa en maxKB ──
      const toBlob = (q: number): Promise<Blob> =>
        new Promise(res => canvas.toBlob(b => res(b!), 'image/webp', q));

      let lo = 0.05, hi = 0.95;
      let best = await toBlob(0.5);
      let bestQ = 0.5;

      for (let i = 0; i < 10; i++) {
        const mid = (lo + hi) / 2;
        const candidate = await toBlob(mid);
        if (candidate.size <= maxKB * 1024) {
          best = candidate;
          bestQ = mid;
          lo = mid;   // Podemos mejorar calidad
        } else {
          hi = mid;   // Debemos bajar calidad
        }
      }

      resolve({
        blob: best,
        sizeKB: Math.round(best.size / 1024),
        qualityPct: Math.round(bestQ * 100),
        url: URL.createObjectURL(best),
      });
    };

    img.onerror = () => reject(new Error('No se pudo leer la imagen'));
    img.src = objectUrl;
  });
}

// ── Image Uploader Component ─────────────────────────────────────
function ImageUploader({
  currentUrls,
  onUrlsChanged,
}: {
  currentUrls: string[] | null;
  onUrlsChanged: (urls: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [compressing, setCompressing] = useState(false);
  const [previews, setPreviews] = useState<string[]>(currentUrls || []);
  const [error, setError] = useState('');

  const handleFiles = useCallback(async (files: FileList) => {
    if (files.length + previews.length > 3) {
      setError('Máximo 3 imágenes por producto.');
      return;
    }

    const fileArray = Array.from(files);
    if (!fileArray.every(f => f.type.startsWith('image/'))) {
      setError('Solo se aceptan imágenes (JPG, PNG, WebP)');
      return;
    }

    setError('');
    setCompressing(true);
    try {
      const results = await Promise.all(fileArray.map(f => compressToWebP(f)));
      const newUrls = results.map(r => r.url);
      const updatedPreviews = [...previews, ...newUrls];
      setPreviews(updatedPreviews);
      
      // Pass the blobs back to the parent for uploading
      // We need to keep track of which are blobs and which are already uploaded URLs
      onUrlsChanged(results.map(r => r.url)); 
    } catch {
      setError('Error al comprimir una o más imágenes.');
    } finally {
      setCompressing(false);
    }
  }, [previews, onUrlsChanged]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
        Imagen del producto
      </label>

      <div
        onClick={() => !compressing && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        className={`
          relative w-full h-44 rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden bg-gray-50
          ${previews.length > 0 ? 'border-gray-200' : 'border-gray-300 hover:border-[#3C5040]/40'}
        `}
      >
        {previews.length > 0 ? (
          <div className="grid grid-cols-3 h-full">
            {previews.map((preview, i) => (
              <div key={i} className="relative group/img h-full border-r border-gray-100 last:border-0">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const next = previews.filter((_, idx) => idx !== i);
                    setPreviews(next);
                  }}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {previews.length < 3 && (
               <div className="flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                  <Plus className="w-6 h-6 text-gray-300" />
               </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400">
            {compressing ? (
              <Loader2 className="w-8 h-8 animate-spin text-brand-borravino" />
            ) : (
              <ImageIcon className="w-8 h-8 text-gray-300" />
            )}
            <span className="text-sm font-medium">
              {compressing ? 'Comprimiendo a WebP HD…' : 'Arrastrá o tocá para subir (Máx 3)'}
            </span>
          </div>
        )}

        {/* Compressing overlay */}
        {compressing && previews.length > 0 && (
          <div className="absolute inset-0 bg-white/60 flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
            <Loader2 className="w-6 h-6 animate-spin text-brand-borravino" />
            <span className="text-gray-900 text-sm font-semibold">Comprimiendo…</span>
          </div>
        )}
      </div>

      {previews.length > 0 && !compressing && (
        <div className="flex items-center gap-2 text-[12px]">
          <span className="flex items-center gap-1 text-green-500 font-semibold">
            <Check className="w-3 h-3" />
            {previews.length} {previews.length === 1 ? 'imagen' : 'imágenes'} lista/s
          </span>
          <span className="text-gray-400">✓ WebP HD Optimizado</span>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-xs flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={e => { if (e.target.files) handleFiles(e.target.files); }}
      />
    </div>
  );
}

// ── Product Form (Slide-up panel) ────────────────────────────────
function ProductForm({
  editProduct,
  onClose,
  onSaved,
}: {
  editProduct: Product | null;
  onClose: () => void;
  onSaved: (product: Product) => void;
}) {
  const supabase = createClient();
  const [form, setForm] = useState<FormData>(
    editProduct
      ? {
          name: editProduct.name,
          category: editProduct.category,
          price: String(editProduct.price),
          description: editProduct.description ?? '',
          presentation: editProduct.presentation ?? '',
          ingredients: editProduct.ingredients ?? '',
          is_keto: editProduct.is_keto,
          is_gluten_free: editProduct.is_gluten_free,
          is_high_protein: editProduct.is_high_protein,
          stock_status: editProduct.stock_status,
        }
      : EMPTY_FORM
  );
  const [images, setImages] = useState<{ blob?: Blob; url: string; isExisting: boolean }[]>(
    editProduct?.image_urls?.map(url => ({ url, isExisting: true })) || []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof FormData, v: string | boolean) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const handleFiles = useCallback(async (files: FileList) => {
    if (files.length + images.length > 3) {
      setError('Máximo 3 imágenes por producto.');
      return;
    }
    const fileArray = Array.from(files);
    setError('');
    setSaving(true);
    try {
      const results = await Promise.all(fileArray.map(f => compressToWebP(f)));
      const newEntries = results.map(r => ({ blob: r.blob, url: r.url, isExisting: false }));
      setImages(prev => [...prev, ...newEntries]);
    } catch {
      setError('Error al comprimir imágenes.');
    } finally {
      setSaving(false);
    }
  }, [images]);

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price) {
      setError('El nombre y el precio son obligatorios.');
      return;
    }
    setSaving(true);
    setError('');

    try {
      const finalUrls: string[] = [];
      
      for (const img of images) {
        if (img.isExisting) {
          finalUrls.push(img.url);
        } else if (img.blob) {
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
          const filePath = `products/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('products')
            .upload(filePath, img.blob);
            
          if (uploadError) throw uploadError;
          
          const { data: { publicUrl } } = supabase.storage
            .from('products')
            .getPublicUrl(filePath);
            
          finalUrls.push(publicUrl);
        }
      }

      // ── INSERT o UPDATE en la tabla products ──
      const payload = {
        name: form.name.trim(),
        category: form.category,
        price: parseFloat(form.price),
        description: form.description.trim() || null,
        presentation: form.presentation.trim() || null,
        ingredients: form.ingredients.trim() || null,
        is_keto: form.is_keto,
        is_gluten_free: form.is_gluten_free,
        is_high_protein: form.is_high_protein,
        stock_status: form.stock_status,
        image_urls: finalUrls,
      };

      let saved: Product;

      if (editProduct) {
        const { data, error: updErr } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editProduct.id)
          .select()
          .single();
        if (updErr) throw updErr;
        saved = data as Product;
      } else {
        const { data, error: insErr } = await supabase
          .from('products')
          .insert(payload)
          .select()
          .single();
        if (insErr) throw insErr;
        saved = data as Product;
      }

      onSaved(saved);
      onClose();
    } catch (e: unknown) {
      console.error('Error in handleSave:', e);
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      setError(`Error al guardar: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={e => { if (e.target.files) handleFiles(e.target.files); }}
      />
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Slide-up panel */}
      <div className="relative mt-auto max-h-[92vh] bg-white rounded-t-3xl border-t border-gray-200 flex flex-col overflow-hidden shadow-2xl">
        {/* Handle bar */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
          <div>
            <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">
              {editProduct ? 'Editando producto' : 'Nuevo producto'}
            </p>
            <h2 className="text-lg font-heading font-bold text-gray-900 leading-tight mt-0.5">
              {editProduct ? editProduct.name : 'Agregar al catálogo'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable form body */}
        <div className="overflow-y-auto flex-1 px-5 pt-5 pb-32 flex flex-col gap-6">

          {/* Image uploader UI (integrated) */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Fotos del producto
            </label>
            <div
              onClick={() => !saving && inputRef.current?.click()}
              className={`
                relative w-full h-44 rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden bg-gray-50
                ${images.length > 0 ? 'border-gray-200' : 'border-gray-300 hover:border-brand-borravino/40'}
              `}
            >
              {images.length > 0 ? (
                <div className="grid grid-cols-3 h-full">
                  {images.map((img, i) => (
                    <div key={i} className="relative group/img h-full border-r border-gray-100 last:border-0">
                      <img src={img.url} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(i);
                        }}
                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg transform active:scale-90 transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {images.length < 3 && (
                    <div className="flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                      <Plus className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400">
                  <ImageIcon className="w-8 h-8 text-gray-300" />
                  <span className="text-sm font-medium">Arrastrá o tocá para subir (Máx 3)</span>
                </div>
              )}
              {saving && images.some(i => !i.isExisting) && (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-sm">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-borravino" />
                </div>
              )}
            </div>
          </div>

          {/* Name */}
          <Field label="Nombre del producto *">
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className="w-full bg-white border border-gray-200 shadow-sm rounded-lg p-3 text-sm text-gray-900 focus:border-brand-borravino focus:ring-1 focus:ring-brand-borravino outline-none transition-all"
            />
          </Field>

          {/* Category + Price */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoría">
              <div className="relative">
                <select
                  value={form.category}
                  onChange={e => set('category', e.target.value)}
                  className="w-full bg-white border border-gray-200 shadow-sm rounded-lg p-3 text-sm text-gray-900 focus:border-brand-borravino focus:ring-1 focus:ring-brand-borravino outline-none transition-all appearance-none pr-8"
                >
                  {CATEGORIES.map(c => <option key={c} value={c} className="bg-white text-gray-900">{c}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </Field>
            <Field label="Precio ($) *">
              <input
                type="number"
                value={form.price}
                onChange={e => set('price', e.target.value)}
                min="0"
                className="w-full bg-white border border-gray-200 shadow-sm rounded-lg p-3 text-sm text-gray-900 focus:border-brand-borravino focus:ring-1 focus:ring-brand-borravino outline-none transition-all"
              />
            </Field>
          </div>

          {/* Presentation */}
          <Field label="Presentación">
            <input
              type="text"
              value={form.presentation}
              onChange={e => set('presentation', e.target.value)}
              className="w-full bg-white border border-gray-200 shadow-sm rounded-lg p-3 text-sm text-gray-900 focus:border-brand-borravino focus:ring-1 focus:ring-brand-borravino outline-none transition-all"
            />
          </Field>

          {/* Ingredients */}
          <Field label="Ingredientes">
            <textarea
              value={form.ingredients}
              onChange={e => set('ingredients', e.target.value)}
              rows={3}
              className="w-full bg-white border border-gray-200 shadow-sm rounded-lg p-3 text-sm text-gray-900 focus:border-brand-borravino focus:ring-1 focus:ring-brand-borravino outline-none resize-none transition-all"
            />
          </Field>

          {/* Description */}
          <Field label="Descripción corta">
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={2}
              className="w-full bg-white border border-gray-200 shadow-sm rounded-lg p-3 text-sm text-gray-900 focus:border-brand-borravino focus:ring-1 focus:ring-brand-borravino outline-none resize-none transition-all"
            />
          </Field>

          {/* Tags / Macros */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Tags nutricionales
            </label>
            <div className="flex flex-wrap gap-2">
              <TagToggle
                active={form.is_keto}
                onChange={v => set('is_keto', v)}
                icon={<Zap className="w-3.5 h-3.5" />}
                label="Keto"
                color="text-gray-500 border-gray-200 bg-white shadow-sm"
                activeColor="bg-[#E8B63E] text-white border-[#E8B63E] shadow-sm"
              />
              <TagToggle
                active={form.is_gluten_free}
                onChange={v => set('is_gluten_free', v)}
                icon={<Wheat className="w-3.5 h-3.5" />}
                label="Sin Gluten"
                color="text-gray-500 border-gray-200 bg-white shadow-sm"
                activeColor="bg-blue-500 text-white border-blue-500 shadow-sm"
              />
              <TagToggle
                active={form.is_high_protein}
                onChange={v => set('is_high_protein', v)}
                icon={<Flame className="w-3.5 h-3.5" />}
                label="Alta Proteína"
                color="text-gray-500 border-gray-200 bg-white shadow-sm"
                activeColor="bg-[#2C5E4C] text-white border-[#2C5E4C] shadow-sm"
              />
              <TagToggle
                active={form.is_gluten_free && form.is_keto}
                onChange={v => { set('is_gluten_free', v); set('is_keto', v); }}
                icon={<Leaf className="w-3.5 h-3.5" />}
                label="Sin TACC"
                color="text-gray-500 border-gray-200 bg-white shadow-sm"
                activeColor="bg-green-500 text-white border-green-500 shadow-sm"
              />
            </div>
          </div>

          {/* Stock toggle */}
          <div className="flex w-full justify-between items-center bg-white border border-gray-200 shadow-sm rounded-lg p-3">
            <div className="flex flex-col">
              <p className="text-sm font-semibold text-gray-900">Disponible en stock</p>
              <p className="text-xs text-gray-500">Visible en el catálogo</p>
            </div>
            <button
              type="button"
              onClick={() => set('stock_status', !form.stock_status)}
              className={`flex items-center w-12 h-6 rounded-full transition-colors flex-shrink-0 px-0.5 ${
                form.stock_status
                  ? 'bg-gradient-to-r from-[#3C5040] to-[#2C5E4C]'
                  : 'bg-gray-300'
              }`}
            >
              <div 
                className={`w-5 h-5 bg-white rounded-full transition-transform shadow-md ${
                  form.stock_status ? 'translate-x-[24px]' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 flex gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div className="pt-6 mt-4">
            <button
              id="save-product-btn"
              onClick={handleSave}
              disabled={saving}
              className="flex w-full justify-center items-center gap-2 bg-brand-borravino text-white font-bold py-4 rounded-xl text-sm shadow-md hover:bg-[#5a1c30] active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Guardando…</>
              ) : (
                <><Check className="w-5 h-5" /> Guardar Producto</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Mini UI helpers ───────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function TagToggle({
  active, onChange, icon, label, color, activeColor,
}: {
  active: boolean;
  onChange: (v: boolean) => void;
  icon: React.ReactNode;
  label: string;
  color: string;
  activeColor: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!active)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
        active ? activeColor : color
      }`}
    >
      {icon} {label}
    </button>
  );
}

// ── Bulk Import Modal ───────────────────────────────────────────
function BulkImportModal({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: (products: Product[]) => void;
}) {
  const supabase = createClient();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<{ success: number; failed: number } | null>(null);

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setError('');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data as any[];
          const productsToInsert = rows.map(row => {
            // Build image URLs from filenames
            const filenames = row.image_filenames ? row.image_filenames.split(',').map((s: string) => s.trim()) : [];
            const image_urls = filenames.map((name: string) => {
              if (name.startsWith('http')) return name;
              const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(`products/${name}`);
              return publicUrl;
            });

            return {
              name: row.name?.trim(),
              category: row.category?.trim() || 'Otros',
              price: parseFloat(row.price) || 0,
              presentation: row.presentation?.trim() || null,
              ingredients: row.ingredients?.trim() || null,
              description: row.short_description?.trim() || null,
              stock_status: String(row.in_stock).toLowerCase() === 'true' || row.in_stock === '1',
              image_urls,
              // Macros can be derived from short_description if they contain strings like "Keto"
              is_keto: row.short_description?.toLowerCase().includes('keto') || false,
              is_gluten_free: row.short_description?.toLowerCase().includes('sin gluten') || row.short_description?.toLowerCase().includes('tacc') || false,
              is_high_protein: row.short_description?.toLowerCase().includes('proteina') || false,
            };
          }).filter(p => p.name);

          const { data, error: insErr } = await supabase
            .from('products')
            .insert(productsToInsert)
            .select();

          if (insErr) throw insErr;
          
          setResults({ success: data.length, failed: productsToInsert.length - data.length });
          onImported(data as Product[]);
          setTimeout(onClose, 2000);
        } catch (e: any) {
          setError(e.message || 'Error al importar productos');
        } finally {
          setImporting(false);
        }
      },
      error: (err) => {
        setError(`Error al leer el archivo: ${err.message}`);
        setImporting(false);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Carga Masiva (CSV)</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!results ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-500">
              Sube un archivo .csv con las columnas: <br/>
              <code className="bg-gray-100 px-1 rounded text-[11px]">name, category, price, presentation, ingredients, short_description, in_stock, image_filenames</code>
            </p>
            
            <div 
              onClick={() => document.getElementById('csv-input')?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-borravino transition-colors bg-gray-50"
            >
              <Upload className="w-8 h-8 text-gray-300" />
              <span className="text-sm font-medium text-gray-600">
                {file ? file.name : 'Seleccionar archivo CSV'}
              </span>
              <input 
                id="csv-input" 
                type="file" 
                accept=".csv" 
                className="hidden" 
                onChange={(e) => setFile(e.target.files?.[0] || null)} 
              />
            </div>

            {error && (
              <div className="text-xs text-red-500 bg-red-50 p-3 rounded-lg border border-red-100 flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <button
              onClick={handleImport}
              disabled={!file || importing}
              className="w-full bg-brand-borravino text-white font-bold py-3 rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {importing ? 'Procesando...' : 'Iniciar Carga'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 gap-4 text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center animate-bounce">
              <Check className="w-8 h-8 font-bold" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">¡Carga completa!</p>
              <p className="text-sm text-gray-500 mt-1">
                Se importaron {results.success} productos con éxito.
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ── Products Tab (main export) ───────────────────────────────────
export default function ProductsTab({ initialProducts }: { initialProducts: Product[] }) {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>(initialProducts);

  // Sync state with props when switching tabs
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => { setEditTarget(null); setShowForm(true); };
  const openEdit = (p: Product) => { setEditTarget(p); setShowForm(true); };

  const handleSaved = (saved: Product) => {
    setProducts(prev => {
      const idx = prev.findIndex(p => p.id === saved.id);
      return idx >= 0
        ? prev.map(p => p.id === saved.id ? saved : p)
        : [saved, ...prev];
    });
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(product.id);
    try {
      await supabase.from('products').delete().eq('id', product.id);
      setProducts(prev => prev.filter(p => p.id !== product.id));
      // Si tenía imagen en Storage, borrarla también
      if (product.image_urls && product.image_urls.length > 0) {
        const paths = product.image_urls.map(url => url.split('/products/')[1]).filter(Boolean) as string[];
        if (paths.length > 0) await supabase.storage.from('products').remove(paths);
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        {/* Buttons Row */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
          >
            <Upload className="w-4 h-4" /> CSV
          </button>
          <button
            id="add-product-btn"
            onClick={openNew}
            className="flex items-center gap-2 bg-brand-borravino text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md hover:bg-[#5a1c30] active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </div>

        {/* Search Row */}
        <div className="relative w-full">
          <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar producto…"
            className="w-full bg-white border border-gray-200 shadow-sm rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-borravino focus:ring-1 focus:ring-brand-borravino transition-all"
          />
        </div>
      </div>

      {/* Product list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <Package className="w-8 h-8 text-gray-300" />
          <p className="text-sm text-gray-400 max-w-[200px]">
            {search ? 'Sin resultados' : 'No hay productos en el catálogo aún'}
          </p>
          {!search && (
            <button onClick={openNew} className="text-sm text-[#3C5040] font-semibold mt-1 hover:underline">
              + Agregar el primero
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2 pb-10">
          {filtered.map(product => {
            const thumb = product.image_urls?.[0] || (product as any).image_url;
            return (
              <div
                key={product.id}
                className="bg-white border border-gray-100 shadow-sm rounded-2xl flex items-center gap-3 px-3 py-3 group hover:shadow-md transition-shadow"
              >
                {/* Image thumb */}
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0 flex items-center justify-center">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-gray-300" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 text-[14px] truncate">{product.name}</p>
                    {!product.stock_status && (
                      <span className="text-[10px] text-red-500 border border-red-200 bg-red-50 rounded-full px-2 py-0.5 font-bold">
                        Sin stock
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-gray-500">{product.category}</span>
                    <div className="flex gap-1.5 ml-1">
                      {product.is_keto && <Zap className="w-3 h-3 text-[#E8B63E] fill-[#E8B63E]" />}
                      {product.is_high_protein && <Flame className="w-3 h-3 text-brand-verde fill-brand-verde" />}
                      {product.is_gluten_free && <Wheat className="w-3 h-3 text-blue-400" />}
                    </div>
                  </div>
                  <p className="text-brand-borravino font-bold text-sm mt-0.5">
                    ${Number(product.price).toLocaleString('es-AR')}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEdit(product)}
                    className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(product)}
                    disabled={deletingId === product.id}
                    className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-100 transition-colors disabled:opacity-40"
                  >
                    {deletingId === product.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <ProductForm
          editProduct={editTarget}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
          onSaved={handleSaved}
        />
      )}

      {/* Import modal */}
      {showImport && (
        <BulkImportModal
          onClose={() => setShowImport(false)}
          onImported={(newItems) => setProducts(prev => [...prev, ...newItems])}
        />
      )}
    </div>
  );
}
