import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refrescar sesión — NO encadenar llamadas antes de esto
  const { data: { user } } = await supabase.auth.getUser();

  // ── Guard /admin ────────────────────────────────────────────
  // EXCEPCIÓN: /admin/login es pública — nunca redirigir desde aquí
  // (evita el bucle ERR_TOO_MANY_REDIRECTS)
  const isAdminLogin = request.nextUrl.pathname.startsWith('/admin/login');

  if (!isAdminLogin && request.nextUrl.pathname.startsWith('/admin')) {
    // Sin sesión → ir a login
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/admin/login';
      return NextResponse.redirect(loginUrl);
    }

    // Verificar role = 'admin' en profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      // Autenticado pero NO admin → home del cliente
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = '/';
      return NextResponse.redirect(homeUrl);
    }
  }

  // Si ya está logueado como admin e intenta abrir /admin/login → redirigir al panel
  if (isAdminLogin && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role === 'admin') {
      const dashUrl = request.nextUrl.clone();
      dashUrl.pathname = '/admin';
      return NextResponse.redirect(dashUrl);
    }
  }

  return supabaseResponse;
}
