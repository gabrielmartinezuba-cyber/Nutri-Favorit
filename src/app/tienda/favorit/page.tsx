import { Suspense } from 'react';
import { Filter, Star } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ProductGallery } from '@/components/products/ProductGallery';
import ProductsLoading from './loading';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const supabase = await createClient();
  
  // Fetch products on server
  const { data: rawProducts } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  const products = (rawProducts || []).map(p => ({
    ...p,
    image_urls: p.image_urls || (p.image_url ? [p.image_url] : [])
  }));

  return (
    <div className="pb-32 pt-4 flex flex-col gap-6">
      {/* Header Favorit */}
      <div className="flex items-center justify-between bg-[#6B2139] rounded-2xl px-6 h-20 shadow-sm border-none flex-shrink-0">
        <div className="w-[120px] flex items-center justify-center h-full">
          <img src="/logofav.png" alt="Favorit Logo" className="w-full h-auto max-h-12 object-contain brightness-0 invert" />
        </div>
        <Link href="/tienda/vitalfood" className="flex items-center gap-2 bg-[#f0f7f0] hover:bg-[#e4efe4] transition-colors pl-1 pr-3 py-1 rounded-full border border-[#c8d8c8] active:scale-95 shadow-sm">
          <img src="/logovitalfood.png" alt="VitalFood Mini" className="h-7 w-auto object-contain drop-shadow-sm bg-white rounded-full p-0.5" />
          <span className="text-[10px] font-bold text-[#3c5040] uppercase tracking-wider">Ir a VitalFood</span>
        </Link>
      </div>

      <Suspense fallback={<ProductsLoading />}>
        <ProductGallery initialProducts={products} />
      </Suspense>
    </div>
  );
}
