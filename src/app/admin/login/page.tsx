'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // ── Paso 1: Autenticar credenciales ──────────────────────
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError('Credenciales incorrectas. Verificá tu email y contraseña.');
      setLoading(false);
      return;
    }

    // ── Paso 2: Confirmar que la sesión está activa ───────────
    // getUser() valida el JWT contra Supabase y garantiza que
    // las queries siguientes usen el token correcto para RLS.
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      setError('No se pudo establecer la sesión. Intentá nuevamente.');
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    // ── Paso 3: Verificar role = 'admin' en profiles ──────────
    // maybeSingle() devuelve null (sin error) si no existe la fila,
    // a diferencia de single() que lanza PostgrestError en ese caso.
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      // Error real de RLS o de red
      console.error('[Admin Login] Profile query error:', profileError.message);
      await supabase.auth.signOut();
      setError('Error al verificar permisos. Contactá al soporte.');
      setLoading(false);
      return;
    }

    if (!profile || profile.role !== 'admin') {
      await supabase.auth.signOut();
      setError('Tu cuenta no tiene permisos de administrador.');
      setLoading(false);
      return;
    }

    // ── Login exitoso: redirigir al panel ─────────────────────
    router.push('/admin');
    router.refresh();
  };


  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0e0a0c] relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#6B2139]/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#E8B63E]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#6B2139]/30 border border-[#6B2139]/50 mb-4 shadow-lg shadow-[#6B2139]/20">
            <Lock className="w-7 h-7 text-[#E8B63E]" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-white">Panel Admin</h1>
          <p className="text-sm text-white/40 mt-1">Acceso exclusivo · Favorit AI</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email de administrador"
              required
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#ffffff' }}
              className="w-full border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-sm placeholder-white/30 focus:outline-none focus:border-[#6B2139]/70 transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              id="admin-password"
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              required
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#ffffff' }}
              className="w-full border border-white/10 rounded-xl pl-11 pr-12 py-3.5 text-sm placeholder-white/30 focus:outline-none focus:border-[#6B2139]/70 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            id="admin-login-btn"
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#6B2139] to-[#8B2D4A] text-white font-bold py-3.5 rounded-xl text-sm shadow-lg shadow-[#6B2139]/30 hover:shadow-[#6B2139]/50 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Verificando...</>
            ) : (
              'Ingresar al Panel'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
