'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Package, ShoppingBag, RefreshCw,
  Loader2, ChevronDown, Clock, CheckCircle, XCircle,
} from 'lucide-react';

type OrderItem = { name: string; quantity: number; price: number; id?: string; category?: string };
type Order = {
  id: string;
  items: OrderItem[];
  total_price: number;
  status: string;
  created_at: string;
};

// ── Shared status config (clone from admin for parity) ─────────
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pendiente:      { label: 'Pendiente',      color: 'text-amber-600 bg-amber-50 border-amber-200',       icon: <Clock className="w-3.5 h-3.5" /> },
  pending:        { label: 'Pendiente',      color: 'text-amber-600 bg-amber-50 border-amber-200',       icon: <Clock className="w-3.5 h-3.5" /> },
  en_preparacion: { label: 'En Preparación', color: 'text-orange-600 bg-orange-50 border-orange-200',    icon: <Package className="w-3.5 h-3.5" /> },
  entregado:      { label: 'Entregado',      color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  delivered:      { label: 'Entregado',      color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  cancelado:      { label: 'Cancelado',      color: 'text-red-500 bg-red-50 border-red-200',            icon: <XCircle className="w-3.5 h-3.5" /> },
  cancelled:      { label: 'Cancelado',      color: 'text-red-500 bg-red-50 border-red-200',            icon: <XCircle className="w-3.5 h-3.5" /> },
};

const ACTIVE_STATUSES = new Set(['pendiente', 'pending', 'en_preparacion']);
const DONE_STATUSES   = new Set(['entregado', 'delivered', 'cancelado', 'cancelled']);

function isActive(status: string) { return ACTIVE_STATUSES.has(status); }
function isDone(status: string)   { return DONE_STATUSES.has(status); }

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ── Single order card ──────────────────────────────────────────
function OrderCard({ order, repeatOrder }: { order: Order; repeatOrder: (o: Order) => void }) {
  const status = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pendiente;
  const preview = order.items.slice(0, 2).map(i => `${i.quantity}× ${i.name}`).join(', ');
  const more = order.items.length > 2 ? ` +${order.items.length - 2} más` : '';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-100 flex flex-col gap-3"
    >
      {/* Top row: date + status badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <PackageIcon className="w-4 h-4 text-brand-verde flex-shrink-0 mt-0.5" />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            {formatDate(order.created_at)}
          </span>
        </div>
        <span className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full border ${status.color} uppercase tracking-widest flex-shrink-0`}>
          {status.icon}
          {status.label}
        </span>
      </div>

      {/* Summary */}
      <p className="text-sm font-semibold text-gray-700 leading-snug">
        {preview}{more}
      </p>

      {/* Bottom row: total + repeat */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-50">
        <span className="text-lg font-black text-brand-borravino font-heading">
          ${(order.total_price || 0).toLocaleString('es-AR')}
        </span>
        <button
          onClick={() => repeatOrder(order)}
          className="flex items-center gap-1.5 bg-brand-verde/5 text-brand-verde border border-brand-verde/15 font-black text-xs px-4 py-2 rounded-xl uppercase tracking-wider active:scale-95 transition-all hover:bg-brand-verde hover:text-white"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Repetir
        </button>
      </div>
    </motion.div>
  );
}

// Alias to avoid shadowing
function PackageIcon(props: React.ComponentProps<typeof Package>) {
  return <Package {...props} />;
}

// ── Accordion section ──────────────────────────────────────────
function AccordionSection({
  title, orders, open, onToggle, repeatOrder, accentColor, emptyMsg,
}: {
  title: string;
  orders: Order[];
  open: boolean;
  onToggle: () => void;
  repeatOrder: (o: Order) => void;
  accentColor: string;
  emptyMsg: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between bg-white border border-gray-100 shadow-sm rounded-2xl px-5 py-4 active:scale-[0.99] transition-all"
      >
        <div className="flex items-center gap-3">
          <span className={`text-sm font-black uppercase tracking-wider ${accentColor}`}>{title}</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${accentColor} bg-current/10`} style={{ color: 'inherit' }}>
            <span className={accentColor}>{orders.length}</span>
          </span>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className={`w-5 h-5 ${accentColor}`} />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 pt-1">
              {orders.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6 italic">{emptyMsg}</p>
              ) : (
                orders.map(order => (
                  <OrderCard key={order.id} order={order} repeatOrder={repeatOrder} />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function PedidosPage() {
  const user = useAuthStore(s => s.user);
  const { addItem } = useCartStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOpen, setActiveOpen] = useState(true);
  const [doneOpen, setDoneOpen] = useState(false);
  const router = useRouter();

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
      const { getUserOrders } = await import('./actions');
      const data = await getUserOrders(user.id);
      setOrders(data || []);
    } catch (err) {
      console.error('[Pedidos]', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const repeatOrder = (order: Order) => {
    order.items.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        addItem({
          id: item.id || item.name,
          name: item.name,
          price: item.price,
          category: item.category || 'Repetido',
          image_urls: [],
        });
      }
    });
    router.push('/carrito');
  };

  const activeOrders = orders.filter(o => isActive(o.status));
  const doneOrders   = orders.filter(o => isDone(o.status));

  return (
    <div className="max-w-xl mx-auto pb-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-4 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/perfil')}
            className="p-2 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-100 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-heading font-black text-brand-verde">Mis Pedidos</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand-verde animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center gap-4 py-20"
          >
            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center">
              <ShoppingBag className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-xl font-heading font-black text-gray-700">Sin pedidos aún</h2>
            <p className="text-sm text-gray-400 max-w-[240px]">
              Todavía no hiciste ningún pedido. ¡Empezá explorando la tienda!
            </p>
            <button
              onClick={() => router.push('/tienda/favorit')}
              className="mt-2 bg-brand-verde text-white font-black px-8 py-3.5 rounded-2xl shadow-lg active:scale-95 transition-all text-sm uppercase tracking-wider"
            >
              Ir a la Tienda
            </button>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Active orders accordion */}
            <AccordionSection
              title={`Pedidos activos`}
              orders={activeOrders}
              open={activeOpen}
              onToggle={() => setActiveOpen(!activeOpen)}
              repeatOrder={repeatOrder}
              accentColor="text-orange-500"
              emptyMsg="No tenés pedidos activos en este momento."
            />

            {/* Done orders accordion */}
            <AccordionSection
              title={`Pedidos finalizados`}
              orders={doneOrders}
              open={doneOpen}
              onToggle={() => setDoneOpen(!doneOpen)}
              repeatOrder={repeatOrder}
              accentColor="text-gray-400"
              emptyMsg="Acá van a aparecer tus pedidos entregados o cancelados."
            />
          </div>
        )}
      </motion.div>
    </div>
  );
}
