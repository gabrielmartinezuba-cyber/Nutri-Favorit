"use client";

import { Home, ShoppingBag, Sparkles, HeartPulse } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Bottombar() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Inicio', icon: Home, href: '/' },
    { label: 'Tienda', icon: ShoppingBag, href: '/productos' },
    { label: 'Nutri AI', icon: Sparkles, href: '/chat' },
    { label: 'Salud', icon: HeartPulse, href: '/salud' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-white pb-safe border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
      <ul className="flex justify-around items-center h-20 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href === '/productos' && pathname.startsWith('/tienda'));
          
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-1.5 min-w-[64px] transition-all duration-300 ${
                  isActive ? 'text-brand-borravino scale-110' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-brand-borravino/10' : ''}`}>
                  <Icon className={`w-6 h-6 ${isActive ? 'stroke-2' : 'stroke-[1.5]'}`} />
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
