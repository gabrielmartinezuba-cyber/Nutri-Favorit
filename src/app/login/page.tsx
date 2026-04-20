'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, ArrowRight, Loader2, Sparkles, ShieldCheck, Mail, Lock, User as UserIcon, Phone } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const router = useRouter();
  const supabase = createClient();
  const setUser = useAuthStore((state) => state.setUser);

  // Si ya tiene sesión, mandarlo a la tienda
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const checkSession = async () => {
      try {
        // Seguridad: si en 1.5s no respondió Supabase, destrabar la UI
        timeoutId = setTimeout(() => {
          setChecking(false);
        }, 1500);

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profile) {
            setUser(profile);
            router.push('/tienda/favorit');
            setChecking(false);
            clearTimeout(timeoutId);
            return;
          }
        }
      } catch (err) {
        console.error('Check session error:', err);
      } finally {
        setChecking(false);
        if (timeoutId) clearTimeout(timeoutId);
      }
    };
    checkSession();
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [supabase, router, setUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas antes de disparar el loading
    if (!email || !password) {
      setError('Por favor completa todos los campos obligatorios.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // LOGIN
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (signInError) throw signInError;
        
        // ÉXITO: Redirección inmediata y refresh para limpiar caché
        router.push('/');
        router.refresh();
      } else {
        // REGISTRO
        if (!fullName || !phone) {
          throw new Error('El nombre y teléfono son obligatorios para el registro.');
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: fullName,
              full_name: fullName,
              phone: phone,
              role: 'cliente',
              favorit_points: 0
            }
          }
        });

        if (signUpError) throw signUpError;
        
        if (data.session) {
            router.push('/');
            router.refresh();
        } else {
            setError('Registro exitoso. Si es necesario, revisa tu correo o intenta iniciar sesión.');
            setIsLogin(true);
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.message.includes('Invalid login credentials')) {
          setError('Correo o contraseña incorrectos.');
      } else if (err.message.includes('already registered') || err.message.includes('User already registered')) {
          setError('Este correo ya está registrado. Intenta iniciar sesión.');
      } else {
          setError(err.message || 'Hubo un error al procesar tu solicitud.');
      }
    } finally {
      // CRÍTICO: Siempre apagar el loading pase lo que pase
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
          <div className="text-center mb-10 flex flex-col items-center">
            <h1 className="text-3xl font-heading font-black text-gray-900 leading-tight">
              Bienvenido a <span className="text-brand-borravino">Favorit</span> y <span className="text-[#3C5040]">Vitalfood</span>
            </h1>
            <p className="text-gray-500 mt-2 font-medium">
              Tu comida saludable, inteligente y personalizada.
            </p>
          </div>

          {/* Auth Form Section */}
          <div className="bg-white p-8 rounded-[32px] shadow-2xl shadow-gray-200/50 border border-gray-100 flex flex-col gap-6">
            
            {/* Toggle */}
            <div className="flex bg-gray-100 p-1 rounded-xl">
               <button 
                 type="button"
                 onClick={() => { setIsLogin(true); setError(''); }}
                 className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isLogin ? 'bg-white text-brand-borravino shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
               >
                 Iniciar Sesión
               </button>
               <button 
                 type="button"
                 onClick={() => { setIsLogin(false); setError(''); }}
                 className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isLogin ? 'bg-white text-brand-borravino shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
               >
                 Crear Cuenta
               </button>
            </div>

            <div className="flex flex-col gap-1 mb-2 text-center">
               <h2 className="text-xl font-black text-gray-800">
                 {isLogin ? '¡Qué bueno verte de nuevo!' : 'Comienza tu viaje saludable'}
               </h2>
               <p className="text-xs text-gray-400 font-medium">
                 {isLogin ? 'Ingresá con tu email y contraseña.' : 'Completá tus datos para registrarte.'}
               </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
               {!isLogin && (
                 <>
                   <div className="relative">
                     <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                     <input 
                       type="text" 
                       placeholder="Nombre y Apellido"
                       value={fullName}
                       onChange={(e) => setFullName(e.target.value)}
                       className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-mostaza/50 focus:bg-white rounded-2xl py-3.5 pl-12 pr-4 text-gray-900 font-medium outline-none transition-all"
                       required={!isLogin}
                     />
                   </div>
                   <div className="relative">
                     <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                     <input 
                       type="tel" 
                       placeholder="WhatsApp (ej. 54911...)"
                       value={phone}
                       onChange={(e) => setPhone(e.target.value)}
                       className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-mostaza/50 focus:bg-white rounded-2xl py-3.5 pl-12 pr-4 text-gray-900 font-medium outline-none transition-all"
                       required={!isLogin}
                     />
                   </div>
                 </>
               )}
               
               <div className="relative">
                 <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                 <input 
                   type="email" 
                   placeholder="Correo electrónico"
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-mostaza/50 focus:bg-white rounded-2xl py-3.5 pl-12 pr-4 text-gray-900 font-medium outline-none transition-all"
                   required
                 />
               </div>
               
               <div className="relative">
                 <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                 <input 
                   type="password" 
                   placeholder="Contraseña (mín. 6 caracteres)"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-mostaza/50 focus:bg-white rounded-2xl py-3.5 pl-12 pr-4 text-gray-900 font-medium outline-none transition-all"
                   required
                 />
               </div>

               <AnimatePresence mode="popLayout">
                 {error && (
                   <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-red-500 text-[11px] font-bold text-center leading-tight">
                     {error}
                   </motion.p>
                 )}
               </AnimatePresence>

               <button
                 type="submit"
                 disabled={loading}
                 className="w-full bg-brand-borravino text-white py-4 px-6 rounded-2xl flex items-center justify-center gap-3 hover:bg-[#5a1b30] active:scale-95 transition-all shadow-md font-black tracking-wide mt-2 disabled:opacity-50"
               >
                 {loading ? (
                   <Loader2 className="w-5 h-5 animate-spin text-white" />
                 ) : (
                   isLogin ? 'INGRESAR' : 'REGISTRARME'
                 )}
               </button>
            </form>

            <div className="relative flex items-center gap-3 my-1">
               <div className="h-[1px] flex-1 bg-gray-100" />
               <span className="text-[10px] uppercase font-black text-gray-300 tracking-widest">O</span>
               <div className="h-[1px] flex-1 bg-gray-100" />
            </div>

            <button 
              type="button"
              onClick={() => router.push('/tienda/favorit')}
              className="w-full py-2 text-sm font-bold text-gray-400 hover:text-brand-borravino transition-colors flex items-center justify-center gap-2"
            >
               Explorar como invitado <ArrowRight className="w-4 h-4 text-gray-300" />
            </button>
          </div>

          {/* Trust Badges */}
          <div className="mt-8 grid grid-cols-2 gap-4">
             <div className="flex items-center gap-3 p-4 bg-white/50 rounded-2xl border border-white">
                <div className="w-10 h-10 bg-brand-verde/10 rounded-xl flex items-center justify-center text-brand-verde">
                   <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                   <span className="text-[11px] font-bold text-gray-900 leading-none">Seguro</span>
                   <span className="text-[9px] font-medium text-gray-500 mt-1">Datos Protegidos</span>
                </div>
             </div>
             <div className="flex items-center gap-3 p-4 bg-white/50 rounded-2xl border border-white">
                <div className="w-10 h-10 bg-brand-mostaza/10 rounded-xl flex items-center justify-center text-brand-mostaza">
                   <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                   <span className="text-[11px] font-bold text-gray-900 leading-none">Premium</span>
                   <span className="text-[9px] font-medium text-gray-500 mt-1">Calidad Vital</span>
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
