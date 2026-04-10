'use client';

import { useState } from 'react';
import { 
  Calendar, Plus, Trash2, Copy, Save, 
  ChevronRight, Edit2, ToggleLeft, ToggleRight, 
  Clock, CheckCircle, Package, Tag, Loader2, AlertCircle,
  Leaf, Flame, Zap, Utensils
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { ImageUploader } from './ProductsTab';

export type DailyMenu = {
  id: string;
  menu_date: string;
  options: {
    general: { desc: string; price: number; image_url?: string | null };
    keto: { desc: string; price: number; image_url?: string | null };
    veggie: { desc: string; price: number; image_url?: string | null };
    proteica: { desc: string; price: number; image_url?: string | null };
  };
  desserts: { name: string; price: number }[];
  status: 'published' | 'scheduled';
};

export type FixedItem = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  price: number;
  is_active: boolean;
  image_url: string | null;
};

export type Promo = {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  activo: boolean;
  dias?: number;
  tipo?: string;
};

interface Props {
  data: {
    dailyMenus: DailyMenu[];
    fixedItems: FixedItem[];
    promos: Promo[];
  };
}

const CATEGORIES = ['Pastas', 'Ensaladas', 'Otros'];

export default function VitalFoodTab({ data }: Props) {
  const [activeSubTab, setActiveSubTab] = useState<'menu-dia' | 'menu-fijo' | 'promos'>('menu-dia');
  const [dailyMenus, setDailyMenus] = useState(data.dailyMenus);
  const [fixedItems, setFixedItems] = useState(data.fixedItems);
  const [promos, setPromos] = useState(data.promos);

  return (
    <div className="flex flex-col gap-6">
      {/* Sub-navigation */}
      <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 mb-2 overflow-x-auto scrollbar-hide">
        {(['menu-dia', 'menu-fijo', 'promos'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`
              flex-1 whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all
              ${activeSubTab === tab 
                ? 'bg-[#3C5040] text-white shadow-md' 
                : 'text-gray-400 hover:bg-gray-50'}
            `}
          >
            {tab === 'menu-dia' ? 'Menú del Día' : tab === 'menu-fijo' ? 'Menú Fijo' : 'Promos'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'menu-dia' && (
          <MenuDiaView key="menu-dia" initialMenus={dailyMenus} />
        )}
        {activeSubTab === 'menu-fijo' && (
          <FixedItemsView key="menu-fijo" initialItems={fixedItems} />
        )}
        {activeSubTab === 'promos' && (
          <PromosView key="promos" initialPromos={promos} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Views ────────────────────────────────────────────────────────

function MenuDiaView({ initialMenus }: { initialMenus: DailyMenu[] }) {
  const supabase = createClient();
  const [menus, setMenus] = useState(initialMenus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  
  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [options, setOptions] = useState({
    general: { desc: '', price: 0, image_url: null as string | null },
    keto: { desc: '', price: 0, image_url: null as string | null },
    veggie: { desc: '', price: 0, image_url: null as string | null },
    proteica: { desc: '', price: 0, image_url: null as string | null }
  });
  const [desserts, setDesserts] = useState<{name: string, price: number}[]>([]);

  const handlePostreAdd = () => setDesserts([...desserts, { name: '', price: 0 }]);
  const handlePostreRemove = (idx: number) => setDesserts(desserts.filter((_, i) => i !== idx));
  const updatePostre = (idx: number, field: 'name' | 'price', value: string | number) => {
    const next = [...desserts];
    next[idx] = { ...next[idx], [field]: value };
    setDesserts(next);
  };

  const handleSave = async (status: 'published' | 'scheduled') => {
    setLoading(true);
    setError('');
    try {
      // Check if menu for this date already exists to update it instead of insert duplicate
      const { data: existing } = await supabase
        .from('vitalfood_daily_menus')
        .select('id')
        .eq('menu_date', date)
        .maybeSingle();
        
      const processedOptions: any = { ...options };
      for (const key of Object.keys(processedOptions)) {
        let finalImageUrl = processedOptions[key].image_url;
        if (finalImageUrl && finalImageUrl.startsWith('blob:')) {
          const blob = await fetch(finalImageUrl).then(r => r.blob());
          const fileExt = blob.type.split('/')[1] || 'webp';
          const fileName = `vfd_${Date.now()}_${Math.floor(Math.random()*1000)}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, blob);
          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
            finalImageUrl = publicUrl;
          }
        }
        processedOptions[key].image_url = finalImageUrl;
      }

      const payload: any = {
        menu_date: date,
        options: processedOptions,
        desserts,
        status
      };
      
      if (existing) {
        payload.id = existing.id;
      }

      const { data, error } = await supabase
        .from('vitalfood_daily_menus')
        .upsert(payload)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update local history if not already there, replace if same date
      setMenus(prev => {
        const filtered = prev.filter(m => m.menu_date !== date);
        return [data, ...filtered].sort((a,b) => b.menu_date.localeCompare(a.menu_date)).slice(0, 7);
      });
      setSuccessMsg(status === 'published' ? 'Menú publicado correctamente' : 'Menú programado correctamente');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e: any) {
      setError('Error guardando el menú, revisá tu conexión o intentá nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = (menu: DailyMenu) => {
    // Backwards compatibility for older menus missing image_url
    const duplicatedOptions = {
        general: { desc: menu.options?.general?.desc || '', price: menu.options?.general?.price || 0, image_url: menu.options?.general?.image_url || null },
        keto: { desc: menu.options?.keto?.desc || '', price: menu.options?.keto?.price || 0, image_url: menu.options?.keto?.image_url || null },
        veggie: { desc: menu.options?.veggie?.desc || '', price: menu.options?.veggie?.price || 0, image_url: menu.options?.veggie?.image_url || null },
        proteica: { desc: menu.options?.proteica?.desc || '', price: menu.options?.proteica?.price || 0, image_url: menu.options?.proteica?.image_url || null },
    };
    setOptions(duplicatedOptions);
    setDesserts(menu.desserts);
    setDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
      {/* Form Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
          <Calendar className="w-5 h-5 text-[#3C5040]" />
          <h3 className="font-heading font-bold text-gray-900">Configurar Menú del Día</h3>
          <input 
            type="date" 
            value={date} 
            onChange={e => setDate(e.target.value)}
            className="ml-auto bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3C5040]/20 transition-all"
          />
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(['general', 'keto', 'veggie', 'proteica'] as const).map(opt => {
            let Icon = Utensils;
            if (opt === 'keto') Icon = Zap;
            if (opt === 'veggie') Icon = Leaf;
            if (opt === 'proteica') Icon = Flame;
            
            return (
              <div key={opt} className="flex flex-col gap-2 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <label className="text-xs font-black uppercase text-[#3C5040] tracking-widest flex items-center gap-1.5 mb-1">
                  <Icon className="w-4 h-4" /> {opt}
                </label>
                <textarea 
                  placeholder="Descripción del plato..."
                  value={options[opt].desc}
                  onChange={e => setOptions({...options, [opt]: {...options[opt], desc: e.target.value}})}
                  rows={2}
                  className="bg-[#f0f4f0] border border-[#c8d8c8] text-gray-900 rounded-xl p-3 text-sm resize-none focus:ring-2 focus:ring-[#3C5040]/20 outline-none placeholder:text-gray-400"
                />
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#E27E36] font-bold text-sm">$</span>
                  <input 
                    type="number" 
                    placeholder="Precio"
                    value={options[opt].price || ''}
                    onChange={e => setOptions({...options, [opt]: {...options[opt], price: parseFloat(e.target.value) || 0}})}
                    className="w-full bg-[#f0f4f0] border border-[#c8d8c8] text-[#E27E36] rounded-xl pl-7 pr-3 py-2.5 text-sm font-bold focus:ring-2 focus:ring-[#3C5040]/20 outline-none placeholder:text-[#E27E36]/50"
                  />
                </div>
                <div className="mt-2">
                  <ImageUploader 
                    currentUrls={options[opt].image_url ? [options[opt].image_url as string] : []} 
                    onUrlsChanged={urls => setOptions({...options, [opt]: {...options[opt], image_url: urls[0] || null}})} 
                    maxImages={1} 
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Desserts Section */}
        <div className="flex flex-col gap-4 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Tag className="w-4 h-4 text-orange-400" /> Postres y Otros
            </h4>
            <button 
              onClick={handlePostreAdd}
              className="text-[11px] font-black uppercase text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Agregar ítem
            </button>
          </div>
          
          <div className="flex flex-col gap-2">
            {desserts.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <input 
                  placeholder="Nombre postre..."
                  value={d.name}
                  onChange={e => updatePostre(i, 'name', e.target.value)}
                  className="flex-1 bg-[#f0f4f0] border border-[#c8d8c8] rounded-xl px-3 py-2 text-sm outline-none"
                />
                <input 
                  type="number" 
                  placeholder="Precio"
                  value={d.price || ''}
                  onChange={e => updatePostre(i, 'price', parseFloat(e.target.value) || 0)}
                  className="w-24 bg-[#f0f4f0] border border-[#c8d8c8] rounded-xl px-3 py-2 text-sm font-bold outline-none"
                />
                <button onClick={() => handlePostreRemove(i)} className="text-red-300 hover:text-red-500 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {desserts.length === 0 && <p className="text-[11px] text-gray-400 italic">No hay postres agregados</p>}
          </div>
        </div>

        {/* Actions & Feedback */}
        {successMsg && (
          <div className="bg-green-100 border border-green-200 text-green-800 rounded-xl px-4 py-3 text-sm font-bold flex items-center justify-center gap-2 animate-pulse mt-2">
            <CheckCircle className="w-5 h-5" /> {successMsg}
          </div>
        )}
        
        <div className="flex flex-col md:flex-row gap-3 pt-4 border-t border-gray-50">
          <button 
            onClick={() => handleSave('published')}
            disabled={loading}
            className="flex-1 bg-[#3C5040] text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-[#3C5040]/20 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
            Publicar Ahora
          </button>
          <button 
            onClick={() => handleSave('scheduled')}
            disabled={loading}
            className="flex-1 bg-white border border-[#3C5040] text-[#3C5040] font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Clock className="w-5 h-5" />
            Programar
          </button>
        </div>
        {error && <p className="text-xs text-red-500 mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {error}</p>}
      </div>

      {/* History History */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4" /> Historial de Menús
        </h3>
        <div className="flex flex-col gap-3">
          {menus.map(menu => (
            <div key={menu.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="flex flex-col">
                <span className="font-bold text-gray-900">{new Date(menu.menu_date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
                <span className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${menu.status === 'published' ? 'text-green-500' : 'text-orange-400'}`}>
                  {menu.status === 'published' ? 'Publicado' : 'Programado'}
                </span>
              </div>
              <button 
                onClick={() => handleDuplicate(menu)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors shadow-sm"
              >
                <Copy className="w-3.5 h-3.5" /> Duplicar
              </button>
            </div>
          ))}
          {menus.length === 0 && <p className="text-center text-sm text-gray-400 py-4 italic">No hay registros previos</p>}
        </div>
      </div>
    </motion.div>
  );
}

function FixedItemsView({ initialItems }: { initialItems: FixedItem[] }) {
  const supabase = createClient();
  const [items, setItems] = useState(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const toggleStatus = async (item: FixedItem) => {
    const { error } = await supabase.from('vitalfood_fixed_items').update({ is_active: !item.is_active }).eq('id', item.id);
    if (!error) setItems(items.map(i => i.id === item.id ? { ...i, is_active: !i.is_active } : i));
  };

  const handleUpdate = async (id: string, updates: Partial<FixedItem>) => {
    let finalImageUrl = updates.image_url !== undefined ? updates.image_url : null;
    if (finalImageUrl && finalImageUrl.startsWith('blob:')) {
      const blob = await fetch(finalImageUrl).then(r => r.blob());
      const fileExt = blob.type.split('/')[1] || 'webp';
      const fileName = `vf_${Date.now()}_${Math.floor(Math.random()*1000)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, blob);
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
        finalImageUrl = publicUrl;
      }
    }

    const payload = { ...updates };
    if (finalImageUrl !== undefined && finalImageUrl !== null) {
        payload.image_url = finalImageUrl;
    }

    const { error } = await supabase.from('vitalfood_fixed_items').update(payload).eq('id', id);
    if (!error) {
      setItems(items.map(i => i.id === id ? { ...i, ...updates, image_url: finalImageUrl ?? i.image_url } : i));
      setEditingId(null);
    }
  };

  const handleAdd = async (payload: Omit<FixedItem, 'id' | 'is_active'>) => {
    let finalImageUrl = payload.image_url;
    if (finalImageUrl && finalImageUrl.startsWith('blob:')) {
      const blob = await fetch(finalImageUrl).then(r => r.blob());
      const fileExt = blob.type.split('/')[1] || 'webp';
      const fileName = `vf_${Date.now()}_${Math.floor(Math.random()*1000)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, blob);
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
        finalImageUrl = publicUrl;
      }
    }

    const { data, error } = await supabase.from('vitalfood_fixed_items').insert({ ...payload, image_url: finalImageUrl }).select().single();
    if (!error && data) {
      setItems([data, ...items]);
      setShowAdd(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="font-heading font-bold text-gray-900">Carta de Platos Fijos</h3>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-[#3C5040] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shadow-md shadow-[#3C5040]/10"
        >
          <Plus className="w-4 h-4" /> Agregar Item
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {items.map(item => (
          <div key={item.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{item.category}</span>
                <span className="font-bold text-gray-900 text-lg leading-tight mt-0.5">{item.name}</span>
              </div>
              <button onClick={() => toggleStatus(item)} className="transition-colors">
                {item.is_active ? <ToggleRight className="w-8 h-8 text-[#3C5040]" /> : <ToggleLeft className="w-8 h-8 text-gray-300" />}
              </button>
            </div>
            
            <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
            
            {item.image_url && (
              <div className="w-full h-32 rounded-xl overflow-hidden mt-2 border border-gray-100">
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
              </div>
            )}
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
              <span className="text-xl font-black text-[#3C5040]">${item.price}</span>
              <button 
                onClick={() => setEditingId(item.id)}
                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            </div>

            {editingId === item.id && (
              <EditModal 
                item={item} 
                onClose={() => setEditingId(null)} 
                onSave={updates => handleUpdate(item.id, updates)} 
              />
            )}
          </div>
        ))}
      </div>

      {showAdd && (
        <AddModal 
          onClose={() => setShowAdd(false)} 
          onSave={handleAdd} 
          categories={CATEGORIES}
        />
      )}
    </motion.div>
  );
}

function PromosView({ initialPromos }: { initialPromos: Promo[] }) {
  const supabase = createClient();
  const [promos, setPromos] = useState(initialPromos);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const toggleStatus = async (promo: Promo) => {
    const { error } = await supabase.from('vitalfood_promos').update({ activo: !promo.activo }).eq('id', promo.id);
    if (!error) setPromos(promos.map(p => p.id === promo.id ? { ...p, activo: !p.activo } : p));
  };

  const handleUpdate = async (id: string, precio: number) => {
    const { error } = await supabase.from('vitalfood_promos').update({ precio }).eq('id', id);
    if (!error) {
      setPromos(promos.map(p => p.id === id ? { ...p, precio } : p));
      setEditingId(null);
    }
  };

  const handleAdd = async (payload: Omit<Promo, 'id' | 'activo'>) => {
    const { data, error } = await supabase.from('vitalfood_promos').insert(payload).select().single();
    if (!error && data) {
      setPromos([data, ...promos]);
      setShowAdd(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="font-heading font-bold text-gray-900">Promociones Vigentes</h3>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-[#3C5040] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shadow-md shadow-[#3C5040]/10"
        >
          <Plus className="w-4 h-4" /> Nueva Promo
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {promos.map(promo => (
          <div key={promo.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4 relative overflow-hidden">
             {!promo.activo && <div className="absolute inset-0 bg-white/60 z-10" />}
             <div className="flex items-start justify-between z-20">
                <div className="flex flex-col gap-1">
                  <h4 className="font-bold text-gray-900 text-xl">{promo.nombre}</h4>
                  <p className="text-sm text-gray-500">{promo.descripcion}</p>
                </div>
                <button onClick={() => toggleStatus(promo)}>
                  {promo.activo ? <ToggleRight className="w-8 h-8 text-[#3C5040]" /> : <ToggleLeft className="w-8 h-8 text-gray-300" />}
                </button>
             </div>
             <div className="flex items-center justify-between pt-2 z-20">
                <span className="text-2xl font-black text-[#3C5040]">${promo.precio}</span>
                <button 
                  onClick={() => setEditingId(promo.id)}
                  className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors"
                >
                  Editar Precio
                </button>
             </div>

             {editingId === promo.id && (
               <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
                  <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl flex flex-col gap-4">
                    <h3 className="font-bold text-gray-900">Actualizar Precio</h3>
                    <input 
                      type="number" 
                      defaultValue={promo.precio}
                      id="edit-promo-price"
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center text-2xl font-black outline-none"
                    />
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => setEditingId(null)} className="flex-1 bg-gray-100 py-3 rounded-2xl font-bold text-gray-500">Cancelar</button>
                      <button 
                        onClick={() => {
                          const val = (document.getElementById('edit-promo-price') as HTMLInputElement).value;
                          handleUpdate(promo.id, parseFloat(val));
                        }}
                        className="flex-1 bg-[#3C5040] py-3 rounded-2xl font-bold text-white shadow-lg"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
               </div>
             )}
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-5">
            <h3 className="text-xl font-bold text-gray-900">Nueva Promoción VitalFood</h3>
            <div className="flex flex-col gap-4">
              <input id="add-promo-name" placeholder="Nombre de la promo (ej: Pack Mensual)" className="p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" />
              <textarea id="add-promo-desc" placeholder="Detalle de lo que incluye..." rows={3} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none resize-none" />
              <input id="add-promo-price" type="number" placeholder="Precio final" className="p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAdd(false)} className="flex-1 bg-gray-50 py-4 rounded-2xl font-bold text-gray-400">Descartar</button>
              <button 
                onClick={() => {
                  const nombre = (document.getElementById('add-promo-name') as HTMLInputElement).value;
                  const descripcion = (document.getElementById('add-promo-desc') as HTMLTextAreaElement).value;
                  const precio = (document.getElementById('add-promo-price') as HTMLInputElement).value;
                  handleAdd({ nombre, descripcion, precio: parseFloat(precio), tipo: 'semanal', dias: 5 });
                }}
                className="flex-1 bg-[#3C5040] py-4 rounded-2xl font-bold text-white shadow-xl"
              >
                Crear Promo
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Modals Helper ────────────────────────────────────────────────

function EditModal({ item, onClose, onSave }: { item: FixedItem, onClose: () => void, onSave: (u: any) => void }) {
  const [imageUrls, setImageUrls] = useState<string[]>(item.image_url ? [item.image_url] : []);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4">
        <h3 className="font-bold text-gray-900">Editar Plato Fijo</h3>
        <div className="flex flex-col gap-3">
           <textarea id="edit-f-desc" defaultValue={item.description || ''} className="p-3 bg-gray-50 border rounded-xl text-sm" rows={2} />
           <input id="edit-f-price" type="number" defaultValue={item.price} className="p-3 bg-gray-50 border rounded-xl text-sm font-bold" />
           <div className="mt-2">
             <ImageUploader currentUrls={imageUrls} onUrlsChanged={setImageUrls} maxImages={1} />
           </div>
        </div>
        <div className="flex gap-2 mt-2">
           <button onClick={onClose} className="flex-1 py-3 font-bold text-gray-400">Cancelar</button>
           <button 
             onClick={() => onSave({ 
               description: (document.getElementById('edit-f-desc') as any).value,
               price: parseFloat((document.getElementById('edit-f-price') as any).value),
               image_url: imageUrls[0] || null
             })}
             className="flex-1 py-3 bg-[#3C5040] text-white rounded-2xl font-bold shadow-lg"
           >
             Guardar
           </button>
        </div>
      </div>
    </div>
  );
}

function AddModal({ onClose, onSave, categories }: { onClose: () => void, onSave: (u: any) => void, categories: string[] }) {
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-gray-900 animate-pulse mt-2">Nuevo Ítem Fijo</h3>
        <div className="flex flex-col gap-4">
           <select id="add-f-cat" className="p-4 bg-gray-50 border-gray-100 border rounded-2xl text-sm appearance-none outline-none">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
           </select>
           <input id="add-f-name" placeholder="Nombre del plato..." className="p-4 bg-gray-50 border-gray-100 border rounded-2xl text-sm outline-none" />
           <textarea id="add-f-desc" placeholder="Descripción..." className="p-4 bg-gray-50 border-gray-100 border rounded-2xl text-sm outline-none" rows={2} />
           <input id="add-f-price" type="number" placeholder="Precio" className="p-4 bg-gray-50 border-gray-100 border rounded-2xl text-sm font-bold outline-none" />
           <div className="mt-2">
             <ImageUploader currentUrls={imageUrls} onUrlsChanged={setImageUrls} maxImages={1} />
           </div>
        </div>
        <div className="flex gap-3 mt-4 mb-2">
           <button onClick={onClose} className="flex-1 py-4 font-bold text-gray-400">Cancelar</button>
           <button 
             onClick={() => onSave({ 
               name: (document.getElementById('add-f-name') as any).value,
               category: (document.getElementById('add-f-cat') as any).value,
               description: (document.getElementById('add-f-desc') as any).value,
               price: parseFloat((document.getElementById('add-f-price') as any).value),
               image_url: imageUrls[0] || null
             })}
             className="flex-1 py-4 bg-[#3C5040] text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-all"
           >
             Crear Plato
           </button>
        </div>
      </div>
    </div>
  );
}
