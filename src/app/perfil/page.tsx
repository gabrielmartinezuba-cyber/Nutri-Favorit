'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Settings, Package, Wallet, ChevronRight, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const menuItems = [
  {
    href: '/perfil/configuracion',
    icon: Settings,
    label: 'Configuración',
    desc: 'Datos personales y perfil de salud',
    color: 'text-brand-borravino',
    bg: 'bg-brand-borravino/5',
    border: 'border-brand-borravino/10',
  },
  {
    href: '/perfil/pedidos',
    icon: Package,
    label: 'Mis Pedidos',
    desc: 'Historial y repetir pedidos',
    color: 'text-brand-verde',
    bg: 'bg-brand-verde/5',
    border: 'border-brand-verde/10',
  },
  {
    href: '/perfil/billetera',
    icon: Wallet,
    label: 'Billetera Favorit',
    desc: '',
    color: 'text-brand-mostaza',
    bg: 'bg-brand-mostaza/5',
    border: 'border-brand-mostaza/10',
    dynamic: true,
  },
];

export default function ProfileHubPage() {
  const { user, setUser } = useAuthStore();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleLogout = async () => {
    try {
      // Limpiar estado local primero para feedback instantáneo
      setUser(null);
      
      // Intentar signout de supabase
      await supabase.auth.signOut();
      
      // Forzar recarga total para limpiar TODA la caché de Next.js y Supabase
      window.location.href = '/login';
    } catch (error) {
      console.error('Error logout:', error);
      // Fallback de emergencia
      window.location.href = '/login';
    }
  };

  if (!user) {
    return null;
  }

  const points = user.favorit_points || 0;

  return (
    <div className="pb-32 pt-4 max-w-xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-6"
      >
        {/* Header — limpio y minimalista (sin avatar) */}
        <div className="flex items-start justify-between pt-2">
          <div>
            <h1 className="text-3xl font-heading font-black text-brand-borravino leading-tight">
              {user.first_name || 'Mi Cuenta'}
            </h1>
            {user.email && (
              <p className="text-xs text-gray-400 font-medium mt-0.5">{user.email}</p>
            )}
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-brand-mostaza">💛</span>
              <span className="text-sm font-black text-brand-borravino">{points} Puntos Favorit</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="p-3 rounded-2xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all border border-gray-100 active:scale-95 mt-1"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Cards */}
        <div className="flex flex-col gap-3 mt-2">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            const desc = item.dynamic
              ? `${points} puntos disponibles · Canjear beneficios`
              : item.desc;

            return (
              <motion.button
                key={item.href}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.07 }}
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center gap-4 p-5 bg-white rounded-[24px] border ${item.border} shadow-sm hover:shadow-md active:scale-[0.98] transition-all text-left group`}
              >
                <div className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`font-black text-base ${item.color} block leading-tight`}>
                    {item.label}
                  </span>
                  <span className="text-xs text-gray-400 font-medium mt-0.5 block truncate">
                    {desc}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </motion.button>
            );
          })}
        </div>

        {/* Footer Brand */}
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
            Favorit AI · Nutrición Premium
          </span>
        </div>
      </motion.div>
    </div>
  );
}
