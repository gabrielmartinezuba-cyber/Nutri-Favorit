'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, ArrowRight, Loader2, Sparkles, User, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const supabase = createClient();
  const setUser = useAuthStore((state) => state.setUser);

  // Si ya tiene sesión, mandarlo a la tienda
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Traer perfil para actualizar store
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setUser(profile);
          router.push('/productos');
        }
        setChecking(false);
      } else {
        setChecking(false);
      }
    };
    checkSession();
  }, [supabase, router, setUser]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error login:', error);
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-borravino" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] relative overflow-hidden flex flex-col">
      {/* Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] aspect-square bg-brand-mostaza/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] aspect-square bg-brand-borravino/5 rounded-full blur-[100px] pointer-events-none" />

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full max-w-md mx-auto">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="w-full"
        >
          {/* Logo Area */}
          <div className="text-center mb-12 flex flex-col items-center">
            <h1 className="text-3xl font-heading font-black text-gray-900 leading-tight">
              Bienvenido a <span className="text-brand-borravino">Favorit</span>
            </h1>
            <p className="text-gray-500 mt-3 font-medium">
              Tu comida saludable, inteligente y personalizada.
            </p>
          </div>

          {/* Social Login Section */}
          <div className="bg-white p-8 rounded-[32px] shadow-2xl shadow-gray-200/50 border border-gray-100 flex flex-col gap-6">
            <div className="flex flex-col gap-2 mb-2">
               <h2 className="text-lg font-bold text-gray-800">Iniciá sesión para continuar</h2>
               <p className="text-xs text-gray-400 font-medium">Usá tu cuenta de Google para una experiencia más rápida.</p>
            </div>

            <button
              id="google-login-btn"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white border-2 border-gray-100 py-4 px-6 rounded-2xl flex items-center justify-center gap-3 hover:border-brand-mostaza/30 hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-brand-borravino" />
              ) : (
                <>
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                  <span className="font-bold text-gray-700">Continuar con Google</span>
                </>
              )}
            </button>

            <div className="relative flex items-center gap-3 my-2">
               <div className="h-[1px] flex-1 bg-gray-100" />
               <span className="text-[10px] uppercase font-black text-gray-300 tracking-widest">O</span>
               <div className="h-[1px] flex-1 bg-gray-100" />
            </div>

            <button 
              onClick={() => router.push('/productos')}
              className="w-full py-4 text-sm font-bold text-gray-400 hover:text-brand-borravino transition-colors flex items-center justify-center gap-2"
            >
               Explorar como invitado <ArrowRight className="w-4 h-4 text-gray-300" />
            </button>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 grid grid-cols-2 gap-4">
             <div className="flex items-center gap-3 p-4 bg-white/50 rounded-2xl border border-white">
                <div className="w-10 h-10 bg-brand-verde/10 rounded-xl flex items-center justify-center text-brand-verde">
                   <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                   <span className="text-[11px] font-bold text-gray-900 leading-none">Seguro</span>
                   <span className="text-[9px] font-medium text-gray-500 mt-1">SSL Encrypted</span>
                </div>
             </div>
             <div className="flex items-center gap-3 p-4 bg-white/50 rounded-2xl border border-white">
                <div className="w-10 h-10 bg-brand-mostaza/10 rounded-xl flex items-center justify-center text-brand-mostaza">
                   <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                   <span className="text-[11px] font-bold text-gray-900 leading-none">Premium</span>
                   <span className="text-[9px] font-medium text-gray-500 mt-1">Vital Food</span>
                </div>
             </div>
          </div>
        </motion.div>
      </main>

      <footer className="p-8 text-center">
         <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Favorit AI · Intelligent Nutrition</p>
      </footer>
    </div>
  );
}
