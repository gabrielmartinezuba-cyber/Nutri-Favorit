"use client";

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Zap, Wheat, Flame, Minus, Plus } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export function ProductDetailModal({ product, initialIndex = 0, onClose }: { product: any, initialIndex?: number, onClose: () => void }) {
  const [index, setIndex] = React.useState(initialIndex);
  const images = (product.image_urls && product.image_urls.length > 0) 
    ? product.image_urls 
    : (product.image_url ? [product.image_url] : []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/98 flex flex-col items-center justify-start overflow-y-auto p-4 md:p-8 backdrop-blur-md"
    >
      <div className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl relative mt-4 md:mt-10 overflow-y-auto pb-10">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2.5 rounded-full bg-black/70 text-white hover:bg-black/90 transition-all z-50 backdrop-blur-md shadow-lg border border-white/10 active:scale-90"
          title="Cerrar"
        >
          <X className="w-5 h-5 stroke-[2.5px]" />
        </button>

        {/* Carousel Section */}
        <div className="relative w-full aspect-square bg-gray-50 flex items-center justify-center overflow-hidden border-b border-gray-100">
          <motion.div 
            key={index}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full h-full"
          >
            {images.length > 0 ? (
              <img 
                src={images[index]} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-brand-mostaza/20 to-brand-verde/20" />
            )}
          </motion.div>

          {images.length > 1 && (
            <>
              <button 
                onClick={() => setIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                className="absolute left-4 p-3 rounded-xl bg-black/40 text-white hover:bg-black/60 transition-all active:scale-90"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={() => setIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                className="absolute right-4 p-3 rounded-xl bg-black/40 text-white hover:bg-black/60 transition-all active:scale-90"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Dots */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
              {images.map((_: string, i: number) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? 'bg-brand-mostaza w-6' : 'bg-white/50 w-1.5'}`} 
                />
              ))}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="p-6 md:p-8 flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-brand-verde uppercase tracking-widest">{product.category}</span>
            <h2 className="text-2xl font-heading font-black text-gray-900 leading-tight">{product.name}</h2>
            <p className="text-xl font-bold text-brand-borravino mt-1">${product.price}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {product.is_keto && (
              <span className="flex items-center gap-1 px-3 py-1 bg-[#E8B63E] text-white text-[10px] font-bold rounded-full">
                <Zap className="w-3 h-3 fill-white" /> KETO
              </span>
            )}
            {product.is_gluten_free && (
              <span className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white text-[10px] font-bold rounded-full">
                <Wheat className="w-3 h-3" /> SIN TACC
              </span>
            )}
            {product.is_high_protein && (
              <span className="flex items-center gap-1 px-3 py-1 bg-brand-verde text-white text-[10px] font-bold rounded-full">
                <Flame className="w-3 h-3 fill-white" /> PROTEICO
              </span>
            )}
          </div>

          <div className="space-y-4 pt-2">
            {product.description && (
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Descripción</h4>
                <p className="text-sm text-gray-600 leading-relaxed font-medium">{product.description}</p>
              </div>
            )}
            {product.ingredients && (
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Ingredientes</h4>
                <p className="text-sm text-gray-600 leading-relaxed font-medium">{product.ingredients}</p>
              </div>
            )}
            {product.presentation && (
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Presentación</h4>
                <p className="text-sm text-gray-600 leading-relaxed font-medium">{product.presentation}</p>
              </div>
            )}
          </div>

          <div className="pt-4">
            <QuantityControl product={product} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function QuantityControl({ product }: { product: any }) {
  const { items, addItem, updateQuantity } = useCartStore();
  const cartItem = items.find((i) => i.id === product.id);

  if (!cartItem) {
    return (
      <button 
        onClick={() => addItem(product)}
        className="w-full bg-brand-mostaza text-white text-[15px] font-bold py-3.5 rounded-2xl shadow-lg hover:shadow-xl hover:bg-[#d4a030] active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" /> Agregar al carrito
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-2xl p-2 w-full">
      <button 
        onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
        className="w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-sm text-brand-borravino hover:bg-gray-100 transition-colors"
      >
        <Minus className="w-5 h-5" />
      </button>
      <span className="text-lg font-black text-brand-borravino">
        {cartItem.quantity} unidades
      </span>
      <button 
        onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
        className="w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-sm text-brand-borravino hover:bg-gray-100 transition-colors"
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
}
