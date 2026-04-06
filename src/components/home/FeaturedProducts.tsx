"use client";

import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { Star, ArrowRight, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductDetailModal } from '@/components/home/ProductDetailModal';

export default function FeaturedProducts({ initialProducts }: { initialProducts: any[] }) {
  const [detailTarget, setDetailTarget] = useState<any | null>(null);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  const products = initialProducts.map(p => ({
    ...p,
    image_urls: p.image_urls || (p.image_url ? [p.image_url] : [])
  }));

  return (
    <section className="mt-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-heading font-bold flex items-center gap-2 text-brand-borravino">
          <Star className="w-6 h-6 text-brand-mostaza fill-brand-mostaza" />
          Favoritos
        </h2>
        <Link href="/productos" className="text-xs font-black text-brand-verde flex items-center uppercase tracking-widest bg-brand-verde/5 px-4 py-2 rounded-full border border-brand-verde/10 hover:bg-brand-verde/10 transition-all">
          Ver todo <ArrowRight className="w-4 h-4 ml-1.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {products.map((product) => {
          const thumb = product.image_urls?.[0];
          return (
            <motion.div 
              layout
              key={product.id} 
              className="glass rounded-[32px] p-4 flex flex-col items-start hover:shadow-xl transition-shadow cursor-pointer relative overflow-hidden group border border-white/40"
            >
              <div 
                onClick={() => setDetailTarget(product)}
                className="w-full h-32 bg-gray-100 rounded-[24px] mb-3 flex items-center justify-center overflow-hidden"
              >
                {thumb ? (
                  <img src={thumb} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-brand-verde/20 to-brand-mostaza/20 group-hover:scale-110 transition-transform duration-500" />
                )}
              </div>
              
              <div onClick={() => setDetailTarget(product)} className="w-full">
                <span className="text-[10px] font-bold text-brand-verde uppercase tracking-wider mb-1">
                  {product.category}
                </span>
                <h3 className="text-[15px] font-semibold font-heading leading-tight line-clamp-2 mb-2 text-foreground h-10">
                  {product.name}
                </h3>
              </div>

              <div className="mt-auto w-full flex items-center justify-between gap-1">
                <span className="text-sm font-black text-brand-borravino flex-shrink-0">
                  ${product.price}
                </span>
                <div className="scale-75 origin-right">
                  <QuantityControlSmall product={product} user={user} router={router} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {detailTarget && (
          <ProductDetailModal 
            product={detailTarget} 
            onClose={() => setDetailTarget(null)} 
          />
        )}
      </AnimatePresence>
    </section>
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
        className="w-9 h-9 rounded-full bg-brand-mostaza text-brand-borravino flex items-center justify-center flex-shrink-0 hover:scale-110 active:scale-95 transition-all shadow-md"
      >
        <Plus className="w-5 h-5 stroke-[3px]" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5 bg-gray-100 rounded-full px-1.5 py-1">
      <button 
        onClick={(e) => handleAction(e, () => updateQuantity(product.id, cartItem.quantity - 1))}
        className="w-6 h-6 flex items-center justify-center bg-white rounded-full shadow-sm text-brand-borravino hover:bg-gray-50 overflow-hidden outline-none"
      >
        <Minus className="w-3 h-3" />
      </button>
      <span className="text-xs font-bold text-brand-borravino min-w-[16px] text-center">
        {cartItem.quantity}
      </span>
      <button 
        onClick={(e) => handleAction(e, () => updateQuantity(product.id, cartItem.quantity + 1))}
        className="w-6 h-6 flex items-center justify-center bg-white rounded-full shadow-sm text-brand-borravino hover:bg-gray-50 overflow-hidden outline-none"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}
