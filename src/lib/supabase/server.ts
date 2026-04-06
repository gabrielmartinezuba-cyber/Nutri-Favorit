import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * createClient — cliente estándar con sesión del usuario.
 * Respeta RLS: cada usuario ve solo sus propios datos.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — ignorar errores de set
          }
        },
      },
    }
  );
}

/**
 * createAdminClient — cliente con service role key.
 * Bypasa RLS completamente. Usar SOLO en Server Components
 * y API Routes del módulo admin, nunca en el cliente browser.
 */
export function createAdminClient() {
  // La service role key NUNCA debe tener prefijo NEXT_PUBLIC_
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY no está definida. ' +
      'Agregala en .env.local (sin prefijo NEXT_PUBLIC_).'
    );
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      cookies: {
        // Admin client no necesita manejar cookies de sesión
        getAll: () => [],
        setAll: () => {},
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
