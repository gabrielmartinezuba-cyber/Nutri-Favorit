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
      {/* Header Fijo */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-heading font-black text-brand-mostaza tracking-tight italic">Nuestro Menú</h1>
        </div>
      </div>

      <Suspense fallback={<ProductsLoading />}>
        <ProductGallery initialProducts={products} />
      </Suspense>
    </div>
  );
}
