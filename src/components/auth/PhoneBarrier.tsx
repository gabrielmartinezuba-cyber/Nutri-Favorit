"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Check, Loader2, Send } from 'lucide-react';

export default function PhoneBarrier() {
  const { user, setUser, updatePhone } = useAuthStore();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  // Escuchar cambios de auth para sincronizar perfil
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        setUser(profile || null);
      } else {
        setUser(null);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setUser(profile || null);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, setUser]);

  const handleUpdatePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 8) {
      setError('Por favor, ingresá un número válido.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (!user) throw new Error('No user session');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ phone: phone.trim() })
        .eq('id', user.id);

      if (updateError) throw updateError;

      updatePhone(phone.trim());
    } catch (err: any) {
      setError(err.message || 'Error al guardar el teléfono');
    } finally {
      setLoading(false);
    }
  };

  // Solo mostrar el modal si está autenticado pero no tiene teléfono
  // Si user es null (anónimo), needsPhone será false y dejará navegar.
  const needsPhone = user !== null && !user.phone;

  return (
    <AnimatePresence>
      {needsPhone && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        >
          {/* Backdrop con blur profundo */}
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="relative w-full max-w-md bg-white rounded-[32px] overflow-hidden shadow-2xl"
          >
            {/* Header / Accent */}
            <div className="h-32 bg-brand-borravino flex items-center justify-center relative">
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-xl transform rotate-3">
                <Phone className="w-10 h-10 text-brand-borravino" />
              </div>
            </div>

            <div className="p-8 text-center">
              <h2 className="text-2xl font-heading font-black text-gray-900 leading-tight">
                ¡Ya casi estamos!
              </h2>
              <p className="text-sm text-gray-500 mt-2 font-medium leading-relaxed">
                Para coordinar el envío de tus pedidos y brindarte soporte personalizado, necesitamos tu número de WhatsApp.
              </p>

              <form onSubmit={handleUpdatePhone} className="mt-8 space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                    Tu WhatsApp
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                      +
                    </div>
                    <input
                      type="tel"
                      placeholder="54 9 11 1234 5678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-mostaza/50 focus:bg-white rounded-2xl py-4 pl-8 pr-4 text-gray-900 font-bold outline-none transition-all shadow-inner"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-red-500 text-xs font-bold pl-1">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-mostaza text-white font-black py-4 rounded-2xl shadow-lg shadow-brand-mostaza/20 hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      Continuar <Send className="w-5 h-5 translate-x-0.5 -translate-y-0.5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400 font-medium">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Conexión segura con Supabase
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
