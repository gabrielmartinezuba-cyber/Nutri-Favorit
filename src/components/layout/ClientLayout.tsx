'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Bottombar from './Bottombar';
import PhoneBarrier from '../auth/PhoneBarrier';

/**
 * ClientLayout — decide si renderizar Navbar + Bottombar (tienda)
 * o pasar los children directamente sin chrome (admin).
 *
 * Ambas rutas están envueltas en el App Container centrado (max-w-2xl)
 * para verse como una app tablet elegante en pantallas de escritorio.
 */
export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  if (isAdminRoute) {
    // Admin: sin decoraciones de la tienda, pero dentro del contenedor centrado
    return (
      <div className="w-full max-w-2xl mx-auto min-h-screen bg-white shadow-2xl relative overflow-x-hidden">
        {children}
      </div>
    );
  }

  // Tienda: layout estándar con Navbar fijo y Bottombar
  return (
    <div className="w-full max-w-2xl mx-auto min-h-screen bg-white shadow-2xl relative overflow-x-hidden">
      <PhoneBarrier />
      <Navbar />
      {/* pb-24 compensa el Bottombar fijo para que el contenido no quede tapado */}
      <main className="flex-grow pt-16 px-4 pb-24">
        {children}
      </main>
      <Bottombar />
    </div>
  );
}
