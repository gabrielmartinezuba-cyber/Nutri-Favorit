"use client";

import { ShoppingCart, User } from 'lucide-react';
import { useCart } from '@/store/useCart';
import { useAuthStore } from '@/store/authStore';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Navbar() {
  const { totalItems, items } = useCart();
  const user = useAuthStore((state) => state.user);
  const pathname = usePathname();

  const isStorePage = pathname === '/tienda/favorit' || pathname === '/tienda/vitalfood';

  return (
    <nav className="fixed top-0 inset-x-0 mx-auto max-w-2xl z-50 bg-brand-borravino shadow-md h-16 flex items-center justify-between px-6 border-b border-brand-mostaza/20">
      <div className="flex items-center h-full py-2.5 gap-3">
        {!isStorePage && (
          <>
            <Link href="/" className="h-full">
              <img 
                src="/logofav.png" 
                alt="Favorit" 
                className="h-full w-auto object-contain brightness-0 invert opacity-90 hover:opacity-100 transition-opacity" 
              />
            </Link>
            <div className="h-6 w-[1.5px] bg-brand-mostaza/40 rounded-full" />
            <div className="h-full flex items-center">
              <img 
                src="/logovitalfood.png" 
                alt="Vital Food" 
                className="h-[140%] w-auto object-contain brightness-0 invert opacity-90 hover:opacity-100 transition-opacity -ml-1" 
              />
            </div>
          </>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link href="/carrito" className="relative p-2 rounded-full hover:bg-white/10 transition-colors">
              <ShoppingCart className="w-6 h-6 text-white" />
              {totalItems > 0 && (
                <span className="absolute top-1 right-0 bg-brand-mostaza text-brand-borravino text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                  {totalItems}
                </span>
              )}
            </Link>
            <Link href="/perfil" className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
              <User className="w-5 h-5 text-white" />
            </Link>
          </>
        ) : (
          <Link 
            href="/login" 
            className="bg-brand-mostaza text-brand-borravino font-black px-6 py-2 rounded-full text-sm shadow-lg shadow-brand-mostaza/20 hover:scale-[1.02] active:scale-95 transition-all outline-none"
          >
            Ingresar
          </Link>
        )}
      </div>
    </nav>
  );
}
