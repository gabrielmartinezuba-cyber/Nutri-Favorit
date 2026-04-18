'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Clock, Package, ChevronRight } from 'lucide-react';

const supabase = createClient();

export default function ActiveOrderTracker({ initialOrders, userId }: { initialOrders: any[], userId: string }) {
  const [orders, setOrders] = useState(initialOrders);

  useEffect(() => {
    if (!userId) return;

    // Suscribirse a cambios en la tabla orders para este usuario
    const channel = supabase
      .channel('order-updates-home')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuchar INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Order change detected:', payload);
          
          if (payload.eventType === 'INSERT') {
            // Solo agregar si el estado es de los que mostramos aquí
            const newOrder = payload.new;
            if (['pendiente', 'pending', 'en_preparacion'].includes(newOrder.status)) {
              setOrders(prev => [newOrder, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedOrder = payload.new;
            
            // Si el estado ya no es "activo", lo sacamos de la lista
            if (!['pendiente', 'pending', 'en_preparacion'].includes(updatedOrder.status)) {
              setOrders(prev => prev.filter(o => o.id !== updatedOrder.id));
            } else {
              // Actualizar el pedido en la lista
              setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
            }
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(o => o.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  if (orders.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 px-1">
      {orders.map((order) => (
        <Link key={order.id} href="/perfil/pedidos" className="block w-full">
          <div className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-100 flex flex-col gap-3 hover:shadow-md transition-shadow active:scale-[0.98]">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Pedido en curso</span>
                <span className="text-sm font-semibold text-gray-800">
                  {new Date(order.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <span className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full border uppercase tracking-widest flex-shrink-0 ${
                ['pendiente', 'pending'].includes(order.status) 
                  ? 'text-amber-600 bg-amber-50 border-amber-200' 
                  : 'text-orange-600 bg-orange-50 border-orange-200'
              }`}>
                {['pendiente', 'pending'].includes(order.status) ? <Clock className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
                {['pendiente', 'pending'].includes(order.status) ? 'Pendiente' : 'En Preparación'}
              </span>
            </div>
            
            <div className="flex items-center justify-between pt-1 border-t border-gray-50">
              <span className="text-lg font-black text-[#3C5040] font-heading">
                ${order.total_price?.toLocaleString('es-AR') ?? 0}
              </span>
              <span className="text-xs font-bold text-brand-verde flex items-center gap-1">
                Ver estado <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
