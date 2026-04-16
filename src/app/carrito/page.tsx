'use client';

import { useState } from 'react';
import { useCart } from '@/store/useCart';
import { useAuthStore } from '@/store/authStore';
import { createClient } from '@/lib/supabase/client';
import { Trash2, Plus, Minus, ShoppingBag, CheckCircle2, Home } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FAVORIT_WHATSAPP } from '@/config/contacto';

export default function CartPage() {
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    clearCart, 
    totalPrice: total, 
    totalItems: count,
    isHydrated
  } = useCart();
  const user = useAuthStore(s => s.user);
  const setUser = useAuthStore(s => s.setUser);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  if (!isHydrated) return null; // Wait for hydration on cart page to avoid flicker

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setLoading(true);

    try {
      // ── Paso A: Armed carefully ───────────────────────────────
      const nombre = user?.first_name || 'Cliente';
      const telefono = user?.phone || 'No informado';

      const detalleItems = items
        .map(item => `- ${item.name} x${item.quantity} → $${(item.price * item.quantity).toLocaleString('es-AR')}`)
        .join('\n');

      const mensaje = `*Nuevo Pedido - Favorit*

Nombre: ${nombre}
Tel: ${telefono}

*Detalle del pedido:*
${detalleItems}

*TOTAL: $${total.toLocaleString('es-AR')}*

_Pedido generado desde Favorit AI_`;

      const whatsappUrl = `https://wa.me/${FAVORIT_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;

      // ── Paso B: Guardado en DB (CON await seguro) ───────────────────
      // Usamos await para evitar que iOS/Android cancelen la petición
      // al cambiar de app, pero lo envolvemos en un try/catch para NUNCA trabar el flujo.
      if (user?.id) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const { error: insertError } = await supabase.from('orders').insert({
              user_id: session.user.id,
              customer_name: user.first_name || 'Cliente',
              customer_phone: user.phone || '',
              total_price: total,
              items: items.map(i => ({
                id: i.id,
                name: i.name,
                quantity: i.quantity,
                price: i.price,
                category: i.category,
              })),
              status: 'pendiente',
            });

            if (insertError) console.error('[DB Save Error]', insertError);

            // Puntos (await seguro)
            const puntosGanados = Math.floor(total / 1000);
            if (puntosGanados > 0) {
              await supabase.rpc('increment_points', { row_id: session.user.id, amount: puntosGanados });
            }
          }
        } catch (dbError) {
          console.error('[DB Crash - Ignorado]', dbError);
        }
      }

      // ── Paso C: Limpieza INMEDIATA ────────────────────────────
      clearCart();

      // ── Paso D: Redirección INMEDIATA ──────────────────────────
      window.location.href = whatsappUrl;

    } catch (error) {
      console.error('[CRITICAL FLOW ERROR]', error);
      // Si algo falla catastróficamente, igual lo llevamos a WA.
      window.location.href = `https://wa.me/${FAVORIT_WHATSAPP}`;
    } finally {
      // Garantizamos que el botón se libere (aunque el redirect ya esté en marcha)
      setLoading(false);
    }
  };


  if (confirmed) {
    return (
      <div className="min-h-[calc(100vh-160px)] flex items-center justify-center px-4 bg-[#F5F0EB]">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-center gap-5 max-w-sm">
          <div className="w-20 h-20 bg-brand-verde/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-brand-verde" />
          </div>
          <h1 className="text-3xl font-black text-brand-borravino">¡Pedido Enviado!</h1>
          <p className="text-sm text-gray-500 font-medium leading-relaxed">
            Te contactaremos pronto para coordinar el <strong>pago y la entrega</strong>.
          </p>
          <Link href="/" className="mt-4 bg-brand-borravino text-white font-bold px-8 py-4 rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-wider text-sm flex items-center gap-2">
            <Home className="w-5 h-5" /> Volver al Inicio
          </Link>
        </motion.div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F5F0EB] flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-6 opacity-30 text-brand-borravino">
          <ShoppingBag size={64} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Tu carrito está vacío</h2>
        <p className="text-gray-400 mt-2 max-w-[280px]">
          Agregá productos desde la tienda o pedile una recomendación a Nutri AI
        </p>
        <Link href="/tienda/favorit" className="mt-8 bg-brand-borravino text-white font-bold px-10 py-4 rounded-2xl shadow-lg active:scale-95 transition-all uppercase tracking-widest text-sm">
          Ir a la Tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F0EB] pb-72">
      <div className="max-w-2xl mx-auto px-4 pt-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-heading font-bold text-brand-mostaza tracking-tight">Mi Pedido</h1>
          <p className="text-sm text-gray-400 font-medium mt-1">
            {count} {count === 1 ? 'producto' : 'productos'}
          </p>
          <div className="w-full h-px bg-gray-200 mt-4 opacity-50" />
        </div>

        {/* Product Cards */}
        <div className="flex flex-col gap-4">
          <AnimatePresence mode="popLayout" initial={false}>
            {items.map(item => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-[20px] py-3 px-4 flex gap-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)] relative group"
              >
                {/* Trash Button */}
                <button 
                  onClick={() => removeItem(item.id)}
                  className="absolute top-4 right-4 p-1 text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>

                {/* Product Image */}
                <div className="w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden bg-gradient-to-br from-brand-borravino to-[#a13354] flex items-center justify-center">
                   {/* @ts-ignore */}
                   {item.image_urls?.[0] ? (
                     <img src={item.image_urls[0]} alt={item.name} className="w-full h-full object-cover" />
                   ) : (
                     <ShoppingBag className="text-white/40 w-5 h-5" strokeWidth={1.5} />
                   )}
                </div>

                {/* Info & Controls */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-0.5">
                        {item.category}
                      </span>
                      <h3 className="text-sm font-semibold text-gray-800 leading-tight mb-1 whitespace-normal">
                        {item.name}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-gray-400 font-medium">
                      ${item.price.toLocaleString('es-AR')} c/u
                    </span>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-3 bg-[#F5F0EB] rounded-full px-3 py-1.5 border border-black/5">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="text-brand-borravino font-bold active:scale-75 transition-transform"
                        >
                          <Minus size={14} strokeWidth={3} />
                        </button>
                        <span className="text-xs font-bold text-gray-800 min-w-[1rem] text-center">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="text-brand-borravino font-bold active:scale-75 transition-transform"
                        >
                          <Plus size={14} strokeWidth={3} />
                        </button>
                      </div>
                      
                      <span className="text-base font-bold text-brand-borravino font-heading ml-1">
                        ${(item.price * item.quantity).toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-[80px] inset-x-0 mx-auto max-w-2xl z-40 bg-white border-t border-gray-100 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] rounded-t-[32px] px-6 pt-4 pb-6 pb-safe">
        <div className="flex flex-col gap-2.5">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Subtotal</span>
            <span className="text-xs font-bold text-gray-400">${total.toLocaleString('es-AR')}</span>
          </div>
          
          <div className="w-full h-px bg-gray-50" />

          <div className="flex justify-between items-baseline px-1">
            <span className="text-base font-black text-gray-900 uppercase tracking-tight">TOTAL</span>
            <span className="text-2xl font-black text-brand-borravino font-heading">
              ${total.toLocaleString('es-AR')}
            </span>
          </div>

          <div className="flex justify-between items-baseline px-1 text-[#2D6A4F]">
             <span className="text-[10px] font-bold text-gray-400 uppercase">Puntos a sumar</span>
             <span className="text-lg font-black">+{Math.floor(total / 1000)}</span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full h-12 bg-brand-borravino text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-[0_4px_15px_rgba(107,33,57,0.3)] active:scale-[0.98] transition-all hover:brightness-110 uppercase tracking-widest mt-1"
          >
            <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.067 2.877 1.215 3.076.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.658 1.43 5.632 1.43h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            {loading ? 'Procesando...' : 'CONFIRMAR POR WHATSAPP'}
          </button>
        </div>
      </div>
    </div>
  );
}
