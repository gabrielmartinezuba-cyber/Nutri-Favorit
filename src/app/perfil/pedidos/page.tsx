'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, ShoppingBag, RefreshCw, Loader2 } from 'lucide-react';

type Order = {
  id: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  status: string;
  created_at: string;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pendiente: { label: 'Pendiente', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  pending: { label: 'Pendiente', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  paid: { label: 'Pagado', color: 'text-brand-verde bg-green-50 border-green-200' },
  delivered: { label: 'Entregado', color: 'text-brand-borravino bg-red-50 border-red-200' },
  cancelled: { label: 'Cancelado', color: 'text-gray-500 bg-gray-50 border-gray-200' },
};

export default function PedidosPage() {
  const user = useAuthStore(s => s.user);
  const { addItem } = useCartStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!user?.id) {
      if (typeof window !== 'undefined' && !user) router.push('/login');
      return;
    }
    fetchOrders();
  }, [user?.id]);

  const fetchOrders = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      console.log('[Pedidos] Consultando vía Server Action para:', user.id);
      
      const { getUserOrders } = await import('./actions');
      const data = await getUserOrders(user.id);
      
      console.log('[Pedidos] Respuesta Server Action:', data?.length, 'pedidos');
      setOrders(data || []);
    } catch (err: any) {
      console.error('[Pedidos] Error Server Action:', err);
      // Fallback a vacio si falla
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const repeatOrder = (order: Order) => {
    order.items.forEach(item => {
      for (let i = 1; i <= item.quantity; i++) {
        addItem({ id: item.name, name: item.name, price: item.price } as any);
      }
    });
    router.push('/carrito');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  return (
    <div className="max-w-xl mx-auto pb-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-4 flex flex-col gap-6">

        {/* Back Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/perfil')} className="p-2 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-100 active:scale-95 transition-all">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-heading font-black text-brand-verde">Mis Pedidos</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand-verde animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center gap-4 py-20">
            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center">
              <ShoppingBag className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-xl font-heading font-black text-gray-700">Sin pedidos aún</h2>
            <p className="text-sm text-gray-400 max-w-[240px]">
              Todavía no hiciste ningún pedido. ¡Empezá explorando la tienda!
            </p>
            <button onClick={() => router.push('/productos')}
              className="mt-2 bg-brand-verde text-white font-black px-8 py-3.5 rounded-2xl shadow-lg active:scale-95 transition-all text-sm uppercase tracking-wider">
              Ir a la Tienda
            </button>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((order, idx) => {
              const status = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
              const preview = order.items.slice(0, 2).map(i => `${i.quantity}x ${i.name}`).join(', ');
              const more = order.items.length > 2 ? ` +${order.items.length - 2} más` : '';
              const orderTotal = (order as any).total_price || order.total || 0;

              return (
                <motion.div key={order.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-brand-verde flex-shrink-0 mt-0.5" />
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        {formatDate(order.created_at)}
                      </span>
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${status.color} uppercase tracking-widest`}>
                      {status.label}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-gray-700 leading-snug">
                    {preview}{more}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                    <span className="text-lg font-black text-brand-borravino font-heading">
                      ${orderTotal.toLocaleString('es-AR')}
                    </span>
                    <button onClick={() => repeatOrder(order)}
                      className="flex items-center gap-1.5 bg-brand-verde/5 text-brand-verde border border-brand-verde/15 font-black text-xs px-4 py-2 rounded-xl uppercase tracking-wider active:scale-95 transition-all hover:bg-brand-verde hover:text-white">
                      <RefreshCw className="w-3.5 h-3.5" /> Repetir
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
