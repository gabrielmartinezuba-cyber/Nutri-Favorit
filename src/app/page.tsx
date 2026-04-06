import HeroSection from '@/components/home/HeroSection';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function Home() {
  const supabase = await createClient();
  const { data: products } = await supabase.from('products').select('*').limit(6).order('created_at', { ascending: false });
  const featured = products || [];

  return (
    <div className="flex flex-col gap-8 pb-8 pt-6">
      <HeroSection />

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
