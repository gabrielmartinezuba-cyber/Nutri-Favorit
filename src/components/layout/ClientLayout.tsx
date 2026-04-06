'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Bottombar from './Bottombar';
import PhoneBarrier from '../auth/PhoneBarrier';

/**
 * ClientLayout — decide si renderizar Navbar + Bottombar (tienda)
 * o pasar los children directamente sin chrome (admin).
 *
 * Se usa en el root layout para que /admin tenga UI 100% independiente
 * sin necesidad de reorganizar la estructura de carpetas de rutas.
 */
export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  if (isAdminRoute) {
    // Admin: sin decoraciones de la tienda, ocupa todo el viewport
    return <>{children}</>;
  }

  // Tienda: layout estándar con Navbar fijo y Bottombar
  return (
    <>
      <PhoneBarrier />
      <Navbar />
      {/* pb-24 compensa el Bottombar fijo para que el contenido no quede tapado */}
      <main className="flex-grow pt-16 px-4 pb-24">
        {children}
      </main>
      <Bottombar />
    </>
  );
}
