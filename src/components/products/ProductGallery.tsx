'use client';

import * as React from 'react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { Minus, Plus, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductDetailModal } from '@/components/home/ProductDetailModal';

const CATEGORIES = ['Todos', 'Tartas', 'Wraps', 'Pizzas', 'Hamburguesas', 'Desayunos'];

export function ProductGallery({ initialProducts }: { initialProducts: any[] }) {
  const [activeCategory, setActiveCategory] = React.useState('Todos');
  const [detailTarget, setDetailTarget] = React.useState<any | null>(null);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  const filteredProducts = activeCategory === 'Todos' 
    ? initialProducts 
    : initialProducts.filter(p => p.category === activeCategory);

  return (
    <>
      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`snap-start px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap shadow-sm
              ${activeCategory === cat ? 'bg-brand-verde text-white' : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProducts.map((product) => (
          <motion.div 
            layout
            key={product.id} 
            className="glass rounded-2xl p-4 flex gap-4 hover:shadow-xl transition-shadow relative overflow-hidden group border border-white/40"
          >
            <div 
              onClick={() => setDetailTarget(product)}
              className="w-24 h-24 rounded-xl flex-shrink-0 bg-gray-100 flex items-center justify-center overflow-hidden cursor-pointer active:scale-95 transition-transform"
            >
                {product.image_urls && product.image_urls[0] ? (
                  <img src={product.image_urls[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-brand-mostaza/20 to-brand-verde/20 group-hover:scale-110 transition-transform duration-500" />
                )}
            </div>
            
            <div className="flex flex-col flex-grow py-1 min-w-0">
              <span className="text-[10px] font-bold text-brand-verde uppercase tracking-wider mb-1">
                {product.category}
              </span>
              <h3 className="text-[15px] font-semibold font-heading leading-tight mb-1 text-foreground truncate">
                {product.name}
              </h3>
              
              <div 
                onClick={() => setDetailTarget(product)}
                className="cursor-pointer group/detail"
              >
                <p className="text-xs text-gray-500 line-clamp-2 mb-1 font-medium leading-relaxed">
                  {product.ingredients || product.description}
                </p>
                <span className="text-[10px] text-brand-mostaza font-bold flex items-center gap-0.5 group-hover/detail:underline">
                  <Info className="w-3 h-3" /> VER DETALLE
                </span>
              </div>
              
              <div className="flex items-center justify-between w-full mt-3">
                 <span className="text-lg font-bold text-brand-borravino">
                  ${product.price}
                </span>
                <div className="scale-90 origin-right">
                  <QuantityControlSmall product={product} user={user} router={router} />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {detailTarget && (
          <ProductDetailModal 
            product={detailTarget} 
            initialIndex={0} 
            onClose={() => setDetailTarget(null)} 
          />
        )}
      </AnimatePresence>
    </>
  );
}

function QuantityControlSmall({ product, user, router }: { product: any, user: any, router: any }) {
  const { items, addItem, updateQuantity } = useCartStore();
  const cartItem = items.find((i) => i.id === product.id);

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    if (!user) {
      router.push('/login');
      return;
    }
    action();
  };

  if (!cartItem) {
    return (
      <button 
        onClick={(e) => handleAction(e, () => addItem(product))}
        className="bg-brand-mostaza text-brand-borravino text-xs font-bold px-4 py-1.5 rounded-full shadow-md hover:bg-[#d4a030] active:scale-95 transition-all outline-none"
      >
        Agregar
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-gray-100 rounded-full px-2 py-1">
      <button 
        onClick={(e) => handleAction(e, () => updateQuantity(product.id, cartItem.quantity - 1))}
        className="w-7 h-7 flex items-center justify-center bg-white rounded-full shadow-sm text-brand-borravino hover:bg-gray-50 overflow-hidden outline-none"
      >
        <Minus className="w-4 h-4" />
      </button>
      <span className="text-sm font-bold text-brand-borravino min-w-[20px] text-center">
        {cartItem.quantity}
      </span>
      <button 
        onClick={(e) => handleAction(e, () => updateQuantity(product.id, cartItem.quantity + 1))}
        className="w-7 h-7 flex items-center justify-center bg-white rounded-full shadow-sm text-brand-borravino hover:bg-gray-50 overflow-hidden outline-none"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
