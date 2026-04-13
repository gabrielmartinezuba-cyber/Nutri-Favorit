'use client';

import { useState, useMemo, useTransition } from 'react';
import {
  Users, ShoppingBag, Star, Search, TrendingUp,
  LogOut, Clock, CheckCircle, XCircle, ChevronRight,
  Package, Phone, MessageSquare, ChevronDown, Loader2,
  CircleDollarSign, Calendar,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ProductsTab, { type Product as CatalogProduct } from './ProductsTab';
import VitalFoodTab, { type DailyMenu, type FixedItem, type Promo } from './VitalFoodTab';
import { updateOrderStatus, type OrderStatus } from '@/app/admin/actions/orderActions';

// ── Types ──────────────────────────────────────────────────────
type Profile = {
  id: string;
  first_name: string | null;
  favorit_points: number | null;
  role: string;
  created_at: string;
};

type OrderItem = { name: string; quantity: number; price: number };

type Order = {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  total_price: number | null;
  items: OrderItem[] | null;
  status: string | null;
  created_at: string;
  user_id: string | null;
  points_awarded?: boolean;
};

type Stats = {
  totalClientes: number;
  totalPuntos: number;
  ordenesPendientes: number;
  totalOrdenes: number;
  totalProductos: number;
};

type VitalFoodData = {
  dailyMenus: DailyMenu[];
  fixedItems: FixedItem[];
  promos: Promo[];
};

// ── Status Config ──────────────────────────────────────────────
export const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pendiente:       { label: 'Pendiente',      color: 'text-[#E8B63E] bg-[#E8B63E]/10 border-[#E8B63E]/30',  icon: <Clock className="w-3 h-3" /> },
  pending:         { label: 'Pendiente',      color: 'text-[#E8B63E] bg-[#E8B63E]/10 border-[#E8B63E]/30',  icon: <Clock className="w-3 h-3" /> },
  en_preparacion:  { label: 'En Preparación', color: 'text-orange-500 bg-orange-500/10 border-orange-500/30', icon: <Package className="w-3 h-3" /> },
  entregado:       { label: 'Entregado',      color: 'text-emerald-600 bg-emerald-600/10 border-emerald-600/30', icon: <CheckCircle className="w-3 h-3" /> },
  delivered:       { label: 'Entregado',      color: 'text-emerald-600 bg-emerald-600/10 border-emerald-600/30', icon: <CheckCircle className="w-3 h-3" /> },
  cancelado:       { label: 'Cancelado',      color: 'text-red-500 bg-red-500/10 border-red-500/30',         icon: <XCircle className="w-3 h-3" /> },
  cancelled:       { label: 'Cancelado',      color: 'text-red-500 bg-red-500/10 border-red-500/30',         icon: <XCircle className="w-3 h-3" /> },
};

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'pendiente',      label: 'Pendiente'      },
  { value: 'en_preparacion', label: 'En Preparación' },
  { value: 'entregado',      label: 'Entregado'      },
  { value: 'cancelado',      label: 'Cancelado'      },
];

type TimeFilter = 'todos' | 'hoy' | 'semana' | 'mes';
const TIME_FILTERS: { value: TimeFilter; label: string }[] = [
  { value: 'todos',  label: 'Todos'  },
  { value: 'hoy',    label: 'Hoy'    },
  { value: 'semana', label: 'Semana' },
  { value: 'mes',    label: 'Mes'    },
];

function isWithin(dateStr: string, filter: TimeFilter): boolean {
  if (filter === 'todos') return true;
  const d = new Date(dateStr);
  const now = new Date();
  if (filter === 'hoy') {
    return d.toDateString() === now.toDateString();
  }
  const ms = (filter === 'semana' ? 7 : 30) * 24 * 60 * 60 * 1000;
  return now.getTime() - d.getTime() <= ms;
}

const ACTIVE_STATUSES_ADMIN = new Set(['pendiente', 'pending', 'en_preparacion']);
const DONE_STATUSES_ADMIN   = new Set(['entregado', 'delivered', 'cancelado', 'cancelled']);

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatCurrency(n: number | null) {
  if (!n) return '$0';
  return `$${n.toLocaleString('es-AR')}`;
}

// ── Toast ──────────────────────────────────────────────────────
function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-2xl shadow-xl font-bold text-sm text-white flex items-center gap-2 ${
        type === 'success' ? 'bg-emerald-600' : 'bg-red-500'
      }`}
    >
      {type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      {message}
    </motion.div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────
function StatCard({ icon, label, value, accent }: {
  icon: React.ReactNode; label: string; value: string | number; accent: string;
}) {
  return (
    <div className={`rounded-2xl border bg-white shadow-sm p-4 flex items-start gap-3 ${accent}`}>
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-heading font-bold text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────
export default function AdminDashboardClient({
  adminName, profiles, orders: initialOrders, products, stats, vitalFoodData,
}: {
  adminName: string;
  profiles: Profile[];
  orders: Order[];
  products: CatalogProduct[];
  stats: Stats;
  vitalFoodData: VitalFoodData;
}) {
  const [activeTab, setActiveTab] = useState<'metricas' | 'pedidos' | 'ventas' | 'clientes' | 'productos'>('pedidos');
  const [catalogSubTab, setCatalogSubTab] = useState<'favorit' | 'vitalfood'>('favorit');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('todos');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeAccordionOpen, setActiveAccordionOpen] = useState(true);
  const [doneAccordionOpen, setDoneAccordionOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const handleStatusChange = async (order: Order, newStatus: OrderStatus) => {
    // Optimistically update local state
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o));

    const result = await updateOrderStatus(
      order.id,
      newStatus,
      order.total_price ?? 0,
      order.user_id,
      order.points_awarded ?? false
    );

    if (result.success) {
      const pointsMsg = newStatus === 'entregado' && !order.points_awarded && (order.total_price ?? 0) >= 1000
        ? ` • +${Math.floor((order.total_price ?? 0) / 1000)} pts otorgados`
        : '';
      showToast(`Estado actualizado${pointsMsg}`, 'success');
      router.refresh();
    } else {
      // Revert on error
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: order.status } : o));
      showToast('Error al actualizar el estado', 'error');
    }
  };

  // Filtered lists
  const filteredProfiles = useMemo(() => {
    const q = search.toLowerCase();
    return profiles.filter(p =>
      p.role === 'cliente' &&
      (p.first_name?.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))
    );
  }, [profiles, search]);

  const filteredOrders = useMemo(() => {
    const q = search.toLowerCase();
    return orders.filter(o =>
      !q ||
      (o.customer_name?.toLowerCase().includes(q) || false) ||
      (o.customer_phone?.toLowerCase().includes(q) || false)
    );
  }, [orders, search]);

  const activeOrders = useMemo(() => 
    filteredOrders.filter(o => ACTIVE_STATUSES_ADMIN.has(o.status ?? '')),
    [filteredOrders]
  );

  const salesOrders = useMemo(() => {
    return orders.filter(o => {
      // Basic match for status and search
      const q = search.toLowerCase();
      const statusMatch = DONE_STATUSES_ADMIN.has(o.status ?? '');
      const searchMatch = !q || 
        (o.customer_name?.toLowerCase().includes(q) || false) ||
        (o.customer_phone?.toLowerCase().includes(q) || false);
      
      if (!statusMatch || !searchMatch) return false;

      // Date filtering
      if (startDate || endDate) {
        const d = new Date(o.created_at);
        d.setHours(0, 0, 0, 0);
        
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (d < start) return false;
        }
        
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(0, 0, 0, 0);
          if (d > end) return false;
        }
        
        return true;
      }

      return isWithin(o.created_at, timeFilter);
    });
  }, [orders, search, timeFilter, startDate, endDate]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24">
      {/* ── Header ── */}
      <div className="sticky top-0 z-40 bg-[#3C5040] shadow-md h-16 flex items-center justify-between px-6">
        <div className="flex-1 flex justify-start h-full py-2.5 gap-3 items-center">
          <img src="/logofav.png" alt="Favorit Logo" className="h-full w-auto object-contain brightness-0 invert" />
          <div className="h-6 w-[1.5px] bg-white/40 rounded-full" />
          <div className="h-full flex items-center">
            <img src="/logovitalfood.png" alt="Vital Food Logo" className="h-[140%] w-auto object-contain brightness-0 invert -ml-1" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <h1 className="text-xs font-heading font-bold text-white/90 tracking-wide">Panel Admin</h1>
          <button
            id="admin-logout-btn"
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white transition-colors bg-white/10 border border-white/20 rounded-xl px-3 py-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            Salir
          </button>
        </div>
      </div>

      <div className="px-5 pt-6 pb-24 flex flex-col gap-6">
        <AnimatePresence mode="popLayout">
          {/* ── Vista: Métricas ── */}
          {activeTab === 'metricas' && (
            <motion.div
              key="metricas"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-2 gap-3"
            >
              <StatCard icon={<ShoppingBag className="w-5 h-5 text-[#E8B63E]" />} label="Pedidos totales" value={stats.totalOrdenes} accent="bg-[#E8B63E]/5 border-[#E8B63E]/15" />
              <StatCard icon={<Clock className="w-5 h-5 text-orange-400" />} label="Pendientes" value={stats.ordenesPendientes} accent="bg-orange-400/5 border-orange-400/15" />
              <StatCard icon={<Users className="w-5 h-5 text-[#2C5E4C]" />} label="Clientes" value={stats.totalClientes} accent="bg-[#2C5E4C]/10 border-[#2C5E4C]/20" />
              <StatCard icon={<Star className="w-5 h-5 text-[#6B2139]" />} label="Puntos otorgados" value={stats.totalPuntos.toLocaleString('es-AR')} accent="bg-[#6B2139]/10 border-[#6B2139]/20" />
            </motion.div>
          )}

          {/* ── Vista: Pedidos Activos (Operativa) ── */}
          {activeTab === 'pedidos' && (
            <motion.div
              key="pedidos"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-5"
            >
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-heading font-black text-[#3C5040]">Pedidos Activos</h2>
                <p className="text-xs text-gray-500 font-medium">Gestión de cocina y entregas pendientes</p>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="admin-search"
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por nombre o teléfono…"
                  className="w-full bg-white border border-gray-200 shadow-sm rounded-2xl pl-11 pr-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3C5040] focus:ring-1 focus:ring-[#3C5040] transition-all"
                />
              </div>

              <div className="flex flex-col gap-3">
                {activeOrders.length === 0 ? (
                  <EmptyState icon={<ShoppingBag className="w-8 h-8 text-white/20" />} message={search ? 'Sin resultados para tu búsqueda' : 'No hay pedidos activos en este momento'} />
                ) : (
                  activeOrders.map(order => (
                    <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* ── Vista: Ventas (Historial) ── */}
          {activeTab === 'ventas' && (
            <motion.div
              key="ventas"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-5"
            >
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-heading font-black text-[#3C5040]">Historial de Ventas</h2>
                <p className="text-xs text-gray-500 font-medium">Registro de entregas y cancelaciones</p>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="admin-search-ventas"
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar venta por cliente o ID…"
                  className="w-full bg-white border border-gray-200 shadow-sm rounded-2xl pl-11 pr-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3C5040] focus:ring-1 focus:ring-[#3C5040] transition-all"
                />
              </div>

              {/* Filters Box */}
              <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 flex flex-col gap-4">
                {/* Time filter pills */}
                <div className="flex gap-2">
                  {TIME_FILTERS.map(f => (
                    <button
                      key={f.value}
                      onClick={() => {
                        setTimeFilter(f.value);
                        setStartDate('');
                        setEndDate('');
                      }}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        timeFilter === f.value && !startDate && !endDate
                          ? 'bg-[#3C5040] text-white border-[#3C5040] shadow-sm'
                          : 'bg-gray-50 text-gray-500 border-gray-100 hover:border-gray-300'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Date range picker */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                    <Calendar className="w-3 h-3" /> Rango Personalizado
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 pointer-events-none">DESDE</span>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          setTimeFilter('todos');
                        }}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-12 pr-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#3C5040] hover:bg-white transition-all"
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 pointer-events-none">HASTA</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          setTimeFilter('todos');
                        }}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-12 pr-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#3C5040] hover:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sales List (Flat) */}
              <div className="flex flex-col gap-3">
                {salesOrders.length === 0 ? (
                  <EmptyState icon={<TrendingUp className="w-8 h-8 text-white/20" />} message="No se encontraron ventas para este período" />
                ) : (
                  salesOrders.map(order => (
                    <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* ── Vista: Clientes ── */}
          {activeTab === 'clientes' && (
            <motion.div
              key="clientes"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="admin-search-clientes"
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar cliente por nombre o ID…"
                  className="w-full bg-white border border-gray-200 shadow-sm rounded-2xl pl-11 pr-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3C5040] focus:ring-1 focus:ring-[#3C5040] transition-all"
                />
              </div>
              <div className="flex flex-col gap-3">
                {filteredProfiles.length === 0 ? (
                  <EmptyState icon={<Users className="w-8 h-8 text-white/20" />} message={search ? 'Sin resultados para tu búsqueda' : 'Todavía no hay clientes registrados'} />
                ) : (
                  filteredProfiles.map(profile => <ClientCard key={profile.id} profile={profile} />)
                )}
              </div>
            </motion.div>
          )}

          {/* ── Vista: Catálogo ── */}
          {activeTab === 'productos' && (
            <motion.div
              key="productos"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4"
            >
              <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
                <button
                  onClick={() => setCatalogSubTab('favorit')}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition-all ${catalogSubTab === 'favorit' ? 'bg-[#8F3A44] text-white shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}
                >
                  <img src="/logofav.png" className={`h-4 object-contain ${catalogSubTab !== 'favorit' && 'grayscale filter opacity-50'}`} alt="" />
                  Favorit
                </button>
                <button
                  onClick={() => setCatalogSubTab('vitalfood')}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition-all ${catalogSubTab === 'vitalfood' ? 'bg-[#3C5040] text-white shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}
                >
                  <img src="/logovitalfood.png" className={`h-4 object-contain ${catalogSubTab !== 'vitalfood' && 'grayscale filter opacity-50'}`} alt="" />
                  VitalFood
                </button>
              </div>

              {catalogSubTab === 'favorit' ? (
                <ProductsTab initialProducts={products} />
              ) : (
                <VitalFoodTab data={vitalFoodData} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && <Toast key="toast" message={toast.message} type={toast.type} />}
      </AnimatePresence>

      {/* ── Bottombar Admin ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-2 py-3 pb-safe shadow-[0_-5px_15px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          <BottomTab icon={<ShoppingBag className="w-5 h-5" />} label="Pedidos" active={activeTab === 'pedidos'} badge={stats.ordenesPendientes} onClick={() => { setSearch(''); setActiveTab('pedidos'); }} />
          <BottomTab icon={<CircleDollarSign className="w-5 h-5" />} label="Ventas" active={activeTab === 'ventas'} onClick={() => { setSearch(''); setActiveTab('ventas'); }} />
          <BottomTab icon={<TrendingUp className="w-5 h-5" />} label="Métricas" active={activeTab === 'metricas'} onClick={() => { setSearch(''); setActiveTab('metricas'); }} />
          <BottomTab icon={<Users className="w-5 h-5" />} label="Clientes" active={activeTab === 'clientes'} onClick={() => { setSearch(''); setActiveTab('clientes'); }} />
          <BottomTab icon={<Package className="w-5 h-5" />} label="Catálogo" active={activeTab === 'productos'} onClick={() => { setSearch(''); setActiveTab('productos'); }} />
        </div>
      </div>
    </div>
  );
}

// ── Admin Accordion ────────────────────────────────────────────
function AdminAccordion({
  title, orders, open, onToggle, accentColor, emptyMsg, onStatusChange,
}: {
  title: string;
  orders: Order[];
  open: boolean;
  onToggle: () => void;
  accentColor: string;
  emptyMsg: string;
  onStatusChange: (order: Order, status: OrderStatus) => Promise<void>;
}) {
  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between bg-white border border-gray-100 shadow-sm rounded-2xl px-5 py-3.5 active:scale-[0.99] transition-all"
      >
        <div className="flex items-center gap-2.5">
          <span className={`text-sm font-black uppercase tracking-wider ${accentColor}`}>{title}</span>
          <span className={`text-xs font-black px-2 py-0.5 rounded-full bg-gray-100 text-gray-500`}>
            {orders.length}
          </span>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className={`w-5 h-5 ${accentColor}`} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2.5 pt-1">
              {orders.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-5 italic">{emptyMsg}</p>
              ) : (
                orders.map(order => (
                  <OrderCard key={order.id} order={order} onStatusChange={onStatusChange} />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Order Card ─────────────────────────────────────────────────
function OrderCard({ order, onStatusChange }: {
  order: Order;
  onStatusChange: (order: Order, status: OrderStatus) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const cfg = STATUS_CONFIG[order.status ?? 'pendiente'] ?? STATUS_CONFIG.pendiente;
  const items: OrderItem[] = Array.isArray(order.items) ? order.items : [];
  const waLink = order.customer_phone ? `https://wa.me/${order.customer_phone.replace(/\D/g, '')}` : null;

  const handleChange = async (newStatus: OrderStatus) => {
    setUpdating(true);
    await onStatusChange(order, newStatus);
    setUpdating(false);
  };

  return (
    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-[15px]">
              {order.customer_name ?? 'Cliente anónimo'}
            </span>
            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
              {cfg.icon} {cfg.label}
            </span>
            {order.points_awarded && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8B63E]/10 text-[#E8B63E] border border-[#E8B63E]/30">
                <Star className="w-2.5 h-2.5 fill-current" /> Pts
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[12px] text-gray-400">
            <span>{formatDate(order.created_at)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[#3C5040] font-bold font-heading">{formatCurrency(order.total_price)}</span>
          <ChevronRight className={`w-4 h-4 text-gray-300 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-4 flex flex-col gap-3 bg-gray-50/50">
          {/* Items */}
          {items.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Package className="w-3 h-3" /> Productos
              </p>
              {items.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 font-medium">{item.quantity}× {item.name}</span>
                  <span className="text-gray-500 font-medium">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Status Changer */}
          <div className="flex flex-col gap-1.5">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Cambiar estado</p>
            <div className="relative">
              {updating && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              )}
              <select
                value={order.status ?? 'pendiente'}
                onChange={e => handleChange(e.target.value as OrderStatus)}
                disabled={updating}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#3C5040] disabled:opacity-60 shadow-sm appearance-none cursor-pointer"
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          {order.customer_phone && (
            <div className="flex gap-2 pt-1">
              <a
                href={waLink!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] text-sm font-semibold py-2.5 rounded-xl hover:bg-[#25D366]/20 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                WhatsApp
              </a>
              <a
                href={`tel:${order.customer_phone}`}
                className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 shadow-sm text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Phone className="w-4 h-4" />
                Llamar
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Client Card ────────────────────────────────────────────────
function ClientCard({ profile }: { profile: Profile }) {
  const initials = profile.first_name
    ? profile.first_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';
  const points = profile.favorit_points ?? 0;
  const level = points >= 500 ? { label: 'Gold', color: 'text-[#E8B63E]' }
    : points >= 200 ? { label: 'Silver', color: 'text-slate-400' }
    : { label: 'Starter', color: 'text-gray-400' };

  return (
    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl px-4 py-4 flex items-center gap-4">
      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#3C5040] to-[#2C5E4C] flex items-center justify-center font-heading font-bold text-white text-sm flex-shrink-0 shadow-md">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-[15px] truncate">{profile.first_name ?? 'Sin nombre'}</p>
        <p className="text-[11px] text-gray-400 font-mono truncate mt-0.5">ID: {profile.id.slice(0, 12)}…</p>
        <p className="text-[11px] text-gray-400 mt-0.5 font-medium">Desde {formatDate(profile.created_at)}</p>
      </div>
      <div className="flex flex-col items-end flex-shrink-0">
        <div className="flex items-center gap-1">
          <Star className="w-3.5 h-3.5 fill-[#E8B63E] text-[#E8B63E]" />
          <span className="font-heading font-bold text-gray-900">{points.toLocaleString('es-AR')}</span>
        </div>
        <span className={`text-[11px] font-semibold mt-0.5 ${level.color}`}>{level.label}</span>
      </div>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────
function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      {icon}
      <p className="text-sm text-gray-400 max-w-[200px]">{message}</p>
    </div>
  );
}

// ── Bottom Tab Helper ──────────────────────────────────────────
function BottomTab({ icon, label, active, onClick, badge }: {
  icon: React.ReactNode; label: string; active: boolean; onClick: () => void; badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1.5 p-2 transition-colors ${active ? 'text-brand-borravino' : 'text-gray-400 hover:text-gray-600'}`}
    >
      <div className="relative">
        {icon}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-bold px-1 min-w-[16px] h-[16px] rounded-full flex items-center justify-center border border-white">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
      {active && (
        <motion.div
          layoutId="adminBottomNavIndicator"
          className="absolute -top-[12px] left-1/2 -translate-x-1/2 w-8 h-[3px] bg-brand-borravino rounded-b-full shadow-sm"
        />
      )}
    </button>
  );
}
