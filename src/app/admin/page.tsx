import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminDashboardClient from '@/components/admin/AdminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  // ── Verificar sesión y rol con el cliente estándar (respeta RLS) ──
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, first_name')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') redirect('/');

  // ── Fetch con service role (bypasa RLS → lee todos los registros) ──
  const adminClient = createAdminClient();

  const [profilesRes, ordersRes, productsRes] = await Promise.all([
    adminClient.from('profiles').select('*').order('favorit_points', { ascending: false }),
    adminClient.from('orders').select('*').order('created_at', { ascending: false }).limit(50),
    adminClient.from('products').select('*').order('created_at', { ascending: false }),
  ]);

  // Logging errors to debug silent failures
  if (profilesRes.error) console.error('Error fetching profiles:', profilesRes.error);
  if (ordersRes.error)   console.error('Error fetching orders:', ordersRes.error);
  if (productsRes.error) console.error('Error fetching products:', productsRes.error);

  const profiles = profilesRes.data ?? [];
  const orders   = ordersRes.data   ?? [];
  const products = productsRes.data ?? [];

  // Stats
  const totalClientes       = profiles.filter(p => p.role === 'cliente').length;
  const totalPuntos         = profiles.reduce((acc, p) => acc + (p.favorit_points ?? 0), 0);
  const ordenesPendientes   = orders.filter(o => o.status === 'pending').length;

  return (
    <AdminDashboardClient
      adminName={profile.first_name ?? user.email ?? 'Admin'}
      profiles={profiles}
      orders={orders}
      products={products}
      stats={{
        totalClientes,
        totalPuntos,
        ordenesPendientes,
        totalOrdenes: orders.length,
        totalProductos: products.length,
      }}
    />
  );
}

