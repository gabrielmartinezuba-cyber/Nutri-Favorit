'use client';

import { useState, useMemo } from 'react';
import {
  Users, ShoppingBag, Star, Search, TrendingUp,
  LogOut, Clock, CheckCircle, XCircle, ChevronRight,
  Package, Phone, MessageSquare,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ProductsTab, { type Product as CatalogProduct } from './ProductsTab';

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
};

type Stats = {
  totalClientes: number;
  totalPuntos: number;
  ordenesPendientes: number;
  totalOrdenes: number;
  totalProductos: number;
};

// ── Helpers ────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:   { label: 'Pendiente',  color: 'text-[#E8B63E] bg-[#E8B63E]/10 border-[#E8B63E]/30',  icon: <Clock className="w-3 h-3" /> },
  confirmed: { label: 'Confirmado', color: 'text-[#2C5E4C] bg-[#2C5E4C]/10 border-[#2C5E4C]/30',  icon: <CheckCircle className="w-3 h-3" /> },
  delivered: { label: 'Entregado',  color: 'text-blue-400 bg-blue-400/10 border-blue-400/30',      icon: <CheckCircle className="w-3 h-3" /> },
  cancelled: { label: 'Cancelado',  color: 'text-red-400 bg-red-400/10 border-red-400/30',         icon: <XCircle className="w-3 h-3" /> },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatCurrency(n: number | null) {
  if (!n) return '$0';
  return `$${n.toLocaleString('es-AR')}`;
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
  adminName, profiles, orders, products, stats,
}: {
  adminName: string;
  profiles: Profile[];
  orders: Order[];
  products: CatalogProduct[];
  stats: Stats;
}) {
  const [activeTab, setActiveTab] = useState<'metricas' | 'pedidos' | 'clientes' | 'productos'>('metricas');
  const [search, setSearch] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  // Filtrado de clientes
  const filteredProfiles = useMemo(() => {
    const q = search.toLowerCase();
    return profiles.filter(p =>
      p.role === 'cliente' &&
      (p.first_name?.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))
    );
  }, [profiles, search]);

  // Filtrado de pedidos
  const filteredOrders = useMemo(() => {
    const q = search.toLowerCase();
    return orders.filter(o =>
      (o.customer_name?.toLowerCase().includes(q) || '') ||
      (o.customer_phone?.toLowerCase().includes(q) || '') ||
      o.id.toLowerCase().includes(q)
    );
  }, [orders, search]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24">
      {/* ── Header ── */}
      <div className="sticky top-0 z-40 bg-[#3C5040] shadow-md h-16 flex items-center justify-between px-6">
        <div className="flex-1 flex justify-start h-full py-2.5 gap-3 items-center">
          <img src="/logofav.png" alt="Favorit Logo" className="h-full w-auto object-contain brightness-0 invert" />
          <div className="h-6 w-[1.5px] bg-white/40 rounded-full" />
          <div className="h-full flex items-center">
            <img 
              src="/logovitalfood.png" 
              alt="Vital Food Logo" 
              className="h-[140%] w-auto object-contain brightness-0 invert -ml-1" 
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <h1 className="text-xs font-heading font-bold text-white/90 tracking-wide">
            Panel Admin
          </h1>
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
              <StatCard
                icon={<ShoppingBag className="w-5 h-5 text-[#E8B63E]" />}
                label="Pedidos totales"
                value={stats.totalOrdenes}
                accent="bg-[#E8B63E]/5 border-[#E8B63E]/15"
              />
              <StatCard
                icon={<Clock className="w-5 h-5 text-orange-400" />}
                label="Pendientes"
                value={stats.ordenesPendientes}
                accent="bg-orange-400/5 border-orange-400/15"
              />
              <StatCard
                icon={<Users className="w-5 h-5 text-[#2C5E4C]" />}
                label="Clientes"
                value={stats.totalClientes}
                accent="bg-[#2C5E4C]/10 border-[#2C5E4C]/20"
              />
              <StatCard
                icon={<Star className="w-5 h-5 text-[#6B2139]" />}
                label="Puntos otorgados"
                value={stats.totalPuntos.toLocaleString('es-AR')}
                accent="bg-[#6B2139]/10 border-[#6B2139]/20"
              />
            </motion.div>
          )}

          {/* ── Vista: Pedidos ── */}
          {activeTab === 'pedidos' && (
            <motion.div
              key="pedidos"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="admin-search"
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar pedido por cliente o ID…"
                  className="w-full bg-white border border-gray-200 shadow-sm rounded-2xl pl-11 pr-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3C5040] focus:ring-1 focus:ring-[#3C5040] transition-all"
                />
              </div>

              <div className="flex flex-col gap-3">
                {filteredOrders.length === 0 ? (
                  <EmptyState
                    icon={<ShoppingBag className="w-8 h-8 text-white/20" />}
                    message={search ? 'Sin resultados para tu búsqueda' : 'Todavía no hay pedidos registrados'}
                  />
                ) : (
                  filteredOrders.map(order => <OrderCard key={order.id} order={order} />)
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
                  <EmptyState
                    icon={<Users className="w-8 h-8 text-white/20" />}
                    message={search ? 'Sin resultados para tu búsqueda' : 'Todavía no hay clientes registrados'}
                  />
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
            >
              <ProductsTab initialProducts={products} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Bottombar Admin ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-2 py-3 pb-safe shadow-[0_-5px_15px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <BottomTab
            icon={<TrendingUp className="w-5 h-5" />}
            label="Métricas"
            active={activeTab === 'metricas'}
            onClick={() => { setSearch(''); setActiveTab('metricas'); }}
          />
          <BottomTab
            icon={<ShoppingBag className="w-5 h-5" />}
            label="Pedidos"
            active={activeTab === 'pedidos'}
            badge={stats.ordenesPendientes}
            onClick={() => { setSearch(''); setActiveTab('pedidos'); }}
          />
          <BottomTab
            icon={<Users className="w-5 h-5" />}
            label="Clientes"
            active={activeTab === 'clientes'}
            onClick={() => { setSearch(''); setActiveTab('clientes'); }}
          />
          <BottomTab
            icon={<Package className="w-5 h-5" />}
            label="Catálogo"
            active={activeTab === 'productos'}
            onClick={() => { setSearch(''); setActiveTab('productos'); }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Order Card ─────────────────────────────────────────────────
function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[order.status ?? 'pending'] ?? STATUS_CONFIG.pending;
  const items: OrderItem[] = Array.isArray(order.items) ? order.items : [];

  const waLink = order.customer_phone
    ? `https://wa.me/${order.customer_phone.replace(/\D/g, '')}`
    : null;

  return (
    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 text-[15px]">
              {order.customer_name ?? 'Cliente anónimo'}
            </span>
            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
              {cfg.icon} {cfg.label}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[12px] text-gray-400">
            <span className="font-mono">{order.id.slice(0, 8)}…</span>
            <span>{formatDate(order.created_at)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[#3C5040] font-bold font-heading">
            {formatCurrency(order.total_price)}
          </span>
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
  // Nivel basado en puntos
  const level = points >= 500 ? { label: 'Gold', color: 'text-[#E8B63E]' }
    : points >= 200 ? { label: 'Silver', color: 'text-slate-400' }
    : { label: 'Starter', color: 'text-gray-400' };

  return (
    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl px-4 py-4 flex items-center gap-4">
      {/* Avatar */}
      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#3C5040] to-[#2C5E4C] flex items-center justify-center font-heading font-bold text-white text-sm flex-shrink-0 shadow-md">
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-[15px] truncate">
          {profile.first_name ?? 'Sin nombre'}
        </p>
        <p className="text-[11px] text-gray-400 font-mono truncate mt-0.5">
          ID: {profile.id.slice(0, 12)}…
        </p>
        <p className="text-[11px] text-gray-400 mt-0.5 font-medium">
          Desde {formatDate(profile.created_at)}
        </p>
      </div>

      {/* Points */}
      <div className="flex flex-col items-end flex-shrink-0">
        <div className="flex items-center gap-1">
          <Star className="w-3.5 h-3.5 fill-[#E8B63E] text-[#E8B63E]" />
          <span className="font-heading font-bold text-gray-900">{points.toLocaleString('es-AR')}</span>
        </div>
        <span className={`text-[11px] font-semibold mt-0.5 ${level.color}`}>
          {level.label}
        </span>
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
function BottomTab({ 
  icon, label, active, onClick, badge 
}: { 
  icon: React.ReactNode; label: string; active: boolean; onClick: () => void; badge?: number 
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1.5 p-2 transition-colors ${
        active ? 'text-brand-borravino' : 'text-gray-400 hover:text-gray-600'
      }`}
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
