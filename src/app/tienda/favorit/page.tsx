import { Suspense } from 'react';
import { Filter, Star } from 'lucide-react';
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
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
        <div className="w-[120px]">
          <img src="/logofav.png" alt="Favorit Logo" className="w-full h-auto object-contain" />
        </div>
        <a href="/tienda/vitalfood" className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 transition-colors px-3 py-1.5 rounded-full border border-gray-100 active:scale-95">
          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Ir a VitalFood</span>
          <img src="/logovitalfood.png" alt="VitalFood Mini" className="w-6 h-6 object-cover rounded-full bg-white p-0.5" />
        </a>
      </div>

      <Suspense fallback={<ProductsLoading />}>
        <ProductGallery initialProducts={products} />
      </Suspense>
    </div>
  );
}
