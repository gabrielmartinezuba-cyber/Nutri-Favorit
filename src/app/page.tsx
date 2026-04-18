import HeroSection from '@/components/home/HeroSection';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Clock, Package, ChevronRight } from 'lucide-react';
import TurnosNutricionales from '@/components/shared/TurnosNutricionales';
import ActiveOrderTracker from '@/components/home/ActiveOrderTracker';

export default async function Home() {
  const supabase = await createClient();
  
  // ── 1. Obtener productos destacados ──
  const { data: products } = await supabase.from('products').select('*').limit(6).order('created_at', { ascending: false });
  const featured = products || [];

  // ── 2. Obtener pedidos activos (Seguimiento) ──
  const { data: { user } } = await supabase.auth.getUser();
  let activeOrders: any[] = [];

  if (user) {
    const { data: orders } = await supabase
      .from('orders')
      .select('id, created_at, status, total_price, items')
      .eq('user_id', user.id)
      .in('status', ['pendiente', 'pending', 'en_preparacion'])
      .order('created_at', { ascending: false });
      
    activeOrders = orders || [];
  }

  return (
    <div className="flex flex-col gap-8 pb-8 pt-6">
      <HeroSection />

      {/* ── SEGUIMIENTO DE PEDIDOS ACTIVOS ── */}
      {user && (
        <ActiveOrderTracker initialOrders={activeOrders} userId={user.id} />
      )}

      <FeaturedProducts initialProducts={featured} />

      {/* Promocional Banner */}
      <section className="glass-dark rounded-3xl p-6 flex flex-col gap-1 text-white overflow-hidden relative">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-mostaza/30 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-brand-verde/40 rounded-full blur-[80px] pointer-events-none" />
        
        <h3 className="text-2xl font-heading font-black text-white z-10">Puntos Favorit</h3>
        <p className="text-sm text-gray-200 z-10 max-w-[80%] mb-3">
          Gana puntos con cada compra y canjealos en nuevos pedidos.
        </p>
        <Link 
          href="/perfil/billetera" 
          className="mt-2 self-start glass px-6 py-2.5 rounded-full text-sm font-bold text-white z-10 hover:bg-white/40 transition-colors"
        >
          Mis Puntos
        </Link>
      </section>

      {/* Turnos Nutricionales Component */}
      <div className="mx-1">
        <TurnosNutricionales />
      </div>
    </div>
  );
}
