import HeroSection from '@/components/home/HeroSection';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Clock, Package, ChevronRight } from 'lucide-react';

export default async function Home() {
  const supabase = await createClient();
  
  // ── 1. Obtener productos destacados ──
  const { data: products } = await supabase.from('products').select('*').limit(6).order('created_at', { ascending: false });
  const featured = products || [];

  // ── 2. Obtener pedido activo (Seguimiento) ──
  const { data: { user } } = await supabase.auth.getUser();
  let activeOrder = null;

  if (user) {
    const { data: order } = await supabase
      .from('orders')
      .select('id, created_at, status, total_price, items')
      .eq('user_id', user.id)
      .in('status', ['pendiente', 'pending', 'en_preparacion'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    activeOrder = order;
  }

  return (
    <div className="flex flex-col gap-8 pb-8 pt-6">
      <HeroSection />

      {/* ── SEGUIMIENTO DE PEDIDO ACTIVO ── */}
      {activeOrder && (
        <Link href="/perfil/pedidos" className="block w-full px-1">
          <div className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-100 flex flex-col gap-3 hover:shadow-md transition-shadow active:scale-[0.98]">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Tienes un pedido en curso</span>
                <span className="text-sm font-semibold text-gray-800">
                  {new Date(activeOrder.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <span className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full border uppercase tracking-widest flex-shrink-0 ${
                ['pendiente', 'pending'].includes(activeOrder.status) 
                  ? 'text-amber-600 bg-amber-50 border-amber-200' 
                  : 'text-orange-600 bg-orange-50 border-orange-200'
              }`}>
                {['pendiente', 'pending'].includes(activeOrder.status) ? <Clock className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
                {['pendiente', 'pending'].includes(activeOrder.status) ? 'Pendiente' : 'En Preparación'}
              </span>
            </div>
            
            <div className="flex items-center justify-between pt-1 border-t border-gray-50">
              <span className="text-lg font-black text-[#3C5040] font-heading">
                ${activeOrder.total_price?.toLocaleString('es-AR') ?? 0}
              </span>
              <span className="text-xs font-bold text-brand-verde flex items-center gap-1">
                Ver estado <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </Link>
      )}

      <FeaturedProducts initialProducts={featured} />

      {/* Promocional Banner */}
      <section className="glass-dark rounded-3xl p-6 flex flex-col gap-1 text-white overflow-hidden relative">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-mostaza/30 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-brand-verde/40 rounded-full blur-[80px] pointer-events-none" />
        
        <h3 className="text-2xl font-heading font-black text-white z-10">Puntos Favorit</h3>
        <p className="text-sm text-gray-200 z-10 max-w-[80%] mb-3">
          Gana puntos con cada compra y canjealos por desayunos gratis o consultas nutricionales.
        </p>
        <Link 
          href="/perfil/billetera" 
          className="mt-2 self-start glass px-6 py-2.5 rounded-full text-sm font-bold text-white z-10 hover:bg-white/40 transition-colors"
        >
          Mis Puntos
        </Link>
      </section>
    </div>
  );
}
