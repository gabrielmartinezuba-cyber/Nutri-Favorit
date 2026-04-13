import { createClient } from '@/lib/supabase/server';
import VitalFoodClient from './VitalFoodClient';

export const dynamic = 'force-dynamic';

export default async function VitalFoodPage() {
  const supabase = await createClient();

  // Compute today's date in Argentina timezone server-side
  const now = new Date();
  const todayString = now.toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }); // YYYY-MM-DD

  const todayStr = now.toLocaleDateString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  // Fetch all VitalFood data in parallel — server-side, bypasses any RLS issues
  const [menusRes, fixedRes, promosRes] = await Promise.all([
    supabase.from('vitalfood_daily_menus').select('*').eq('menu_date', todayString).eq('status', 'published').maybeSingle(),
    supabase.from('vitalfood_fixed_items').select('*').eq('is_active', true),
    supabase.from('vitalfood_promos').select('*').eq('activo', true),
  ]);

  // --- Map daily menu ---
  let menuDia: any[] = [];
  let postres: any[] = [];

  if (menusRes.data) {
    postres = menusRes.data.desserts || [];
    const opts = menusRes.data.options || {};
    if (opts.general?.desc) menuDia.push({ id: 'vf-md-gral', name: 'Menú General (Hoy)', description: opts.general.desc, price: opts.general.price, image_url: opts.general.image_url });
    if (opts.keto?.desc) menuDia.push({ id: 'vf-md-keto', name: 'Menú Keto (Hoy)', description: opts.keto.desc, price: opts.keto.price, image_url: opts.keto.image_url });
    if (opts.veggie?.desc) menuDia.push({ id: 'vf-md-veggie', name: 'Menú Veggie (Hoy)', description: opts.veggie.desc, price: opts.veggie.price, image_url: opts.veggie.image_url });
    if (opts.proteica?.desc) menuDia.push({ id: 'vf-md-prot', name: 'Menú Proteico (Hoy)', description: opts.proteica.desc, price: opts.proteica.price, image_url: opts.proteica.image_url });
  }

  // --- Map fixed menu ---
  let menuFijo: { category: string; items: any[] }[] = [];
  if (fixedRes.data && fixedRes.data.length > 0) {
    const groups: Record<string, any[]> = {};
    for (const item of fixedRes.data) {
      const cat = item.category || 'Otros';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }
    menuFijo = Object.keys(groups).map(cat => ({ category: cat, items: groups[cat] }));
  }

  const promos = promosRes.data || [];

  return (
    <VitalFoodClient
      menuDia={menuDia}
      postres={postres}
      menuFijo={menuFijo}
      promos={promos}
      todayStr={todayStr}
    />
  );
}
