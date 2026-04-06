import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Panel — Favorit AI',
  description: 'Panel de control exclusivo para administradores de Favorit.',
};

// Layout propio para /admin: sin Navbar ni Bottombar del cliente
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0e0a0c] text-white font-sans">
      {children}
    </div>
  );
}
