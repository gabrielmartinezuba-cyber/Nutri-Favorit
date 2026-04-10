'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Mail, Calendar, Target, Activity, Loader2, Save, CheckCircle2, Ruler, Weight } from 'lucide-react';

export default function ConfiguracionPage() {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    first_name: '',
    phone: '',
    birth_date: '',
    metabolism: '',
    objective: '',
    height: '',
    weight: '',
    activity_days: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        phone: user.phone || '',
        birth_date: user.birth_date || '',
        metabolism: user.metabolism || '',
        objective: user.objective || '',
        height: user.height ? String(user.height) : '',
        weight: user.weight ? String(user.weight) : '',
        activity_days: user.activity_days !== undefined && user.activity_days !== null ? String(user.activity_days) : '',
      });
    } else {
      router.push('/login');
    }
  }, [user]);

  const calculateAge = (date: string) => {
    if (!date) return null;
    const birth = new Date(date);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      if (!user?.id) {
        alert('No hay sesión activa.');
        router.push('/login');
        setLoading(false);
        return;
      }

      const payload: Record<string, any> = {
        first_name: formData.first_name,
        phone: formData.phone,
        birth_date: formData.birth_date || null,
        metabolism: formData.metabolism,
        objective: formData.objective,
        height: formData.height !== '' ? parseFloat(formData.height) : null,
        weight: formData.weight !== '' ? parseFloat(formData.weight) : null,
        activity_days: formData.activity_days !== '' ? parseInt(formData.activity_days, 10) : null,
      };

      console.log('[Config] Payload:', payload);

      // Direct REST fetch — bypass the hanging Supabase JS client
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      // Get access token from local storage (set by Supabase SSR)
      let accessToken = supabaseAnonKey;
      try {
        const { data } = await Promise.race([
          supabase.auth.getSession(),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
        ]) as any;
        if (data?.session?.access_token) accessToken = data.session.access_token;
      } catch (_) {
        // If getSession() times out, use anon key — RLS will deny if not authed
        // but we'll try anyway and catch the error
      }

      const res = await fetch(
        `${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${accessToken}`,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify(payload),
        }
      );

      console.log('[Config] Respuesta HTTP:', res.status);

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }

      setUser({ ...user, ...payload });
      setSuccess(true);
      console.log('[Config] ✅ Guardado exitoso');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('[Config] Error:', err);
      alert(`Error al guardar: ${err.message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const age = calculateAge(formData.birth_date);

  return (
    <div className="max-w-xl mx-auto pb-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-4 flex flex-col gap-6">

        {/* Back Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/perfil')} className="p-2 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-100 active:scale-95 transition-all">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-heading font-black text-brand-borravino">Configuración</h1>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-5">

          {/* Datos Personales */}
          <div className="bg-white rounded-[28px] p-5 shadow-sm border border-brand-verde/15 flex flex-col gap-4">
            <h2 className="text-[11px] font-black text-brand-borravino uppercase tracking-widest flex items-center gap-2">
              <User className="w-3.5 h-3.5" /> Datos Personales
            </h2>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Nombre</label>
              <input type="text" value={formData.first_name}
                onChange={e => setFormData({...formData, first_name: e.target.value})}
                className="w-full bg-gray-50 border-2 border-brand-verde/10 focus:border-brand-mostaza/30 focus:bg-white rounded-2xl py-3.5 px-4 text-sm font-bold outline-none transition-all"
                placeholder="Tu nombre" required />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">WhatsApp</label>
              <input type="tel" value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-gray-50 border-2 border-brand-verde/10 focus:border-brand-mostaza/30 focus:bg-white rounded-2xl py-3.5 px-4 text-sm font-bold outline-none transition-all"
                placeholder="+54911..." required />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Email (Protegido)</label>
              <div className="relative opacity-50">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="email" value={user?.email || ''} disabled
                  className="w-full bg-gray-100 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold text-gray-500 cursor-not-allowed" />
              </div>
            </div>
          </div>

          {/* Perfil de Salud */}
          <div className="bg-white rounded-[28px] p-5 shadow-sm border border-brand-verde/15 flex flex-col gap-4">
            <h2 className="text-[11px] font-black text-brand-verde uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" /> Perfil de Salud
            </h2>

            {/* Fecha de Nacimiento */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center pr-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Fecha de Nacimiento</label>
                {age !== null && <span className="text-[10px] font-black text-brand-verde bg-brand-verde/10 px-2 py-0.5 rounded-full">{age} años</span>}
              </div>
              <div className="relative">
                <input type="date" value={formData.birth_date}
                  onChange={e => setFormData({...formData, birth_date: e.target.value})}
                  className="w-full bg-gray-50 border-2 border-brand-verde/10 focus:border-brand-mostaza/30 focus:bg-white rounded-2xl py-3.5 px-4 text-sm font-bold outline-none transition-all" required />
              </div>
            </div>

            {/* Objetivo + Metabolismo */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 flex items-center gap-1">
                  <Target className="w-3 h-3" /> Objetivo
                </label>
                <select value={formData.objective} onChange={e => setFormData({...formData, objective: e.target.value})}
                  className="w-full bg-gray-50 border-2 border-brand-verde/10 focus:border-brand-mostaza/30 rounded-2xl py-3.5 px-4 text-xs font-bold outline-none transition-all appearance-none border-r-8 border-transparent" required>
                  <option value="" disabled>Elegir meta</option>
                  <option value="Pérdida de Grasa">Pérdida de Grasa</option>
                  <option value="Volumen">Volumen</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 flex items-center gap-1">
                  <Activity className="w-3 h-3" /> Metabolismo
                </label>
                <select value={formData.metabolism} onChange={e => setFormData({...formData, metabolism: e.target.value})}
                  className="w-full bg-gray-50 border-2 border-brand-verde/10 focus:border-brand-mostaza/30 rounded-2xl py-3.5 px-4 text-xs font-bold outline-none transition-all appearance-none border-r-8 border-transparent" required>
                  <option value="" disabled>Elegir tipo</option>
                  <option value="Lento">Lento</option>
                  <option value="Rápido">Rápido</option>
                  <option value="Activo (Keto)">Activo (Keto)</option>
                </select>
              </div>
            </div>

            {/* Altura + Peso */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 flex items-center gap-1">
                  <Ruler className="w-3 h-3" /> Altura (cm)
                </label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={e => setFormData({...formData, height: e.target.value})}
                  className="w-full bg-gray-50 border-2 border-brand-verde/10 focus:border-brand-mostaza/30 focus:bg-white rounded-2xl py-3.5 px-4 text-sm font-bold outline-none transition-all"
                  placeholder="Ej: 170"
                  min="100" max="250" step="1"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 flex items-center gap-1">
                  <Weight className="w-3 h-3" /> Peso (kg)
                </label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={e => setFormData({...formData, weight: e.target.value})}
                  className="w-full bg-gray-50 border-2 border-brand-verde/10 focus:border-brand-mostaza/30 focus:bg-white rounded-2xl py-3.5 px-4 text-sm font-bold outline-none transition-all"
                  placeholder="Ej: 70"
                  min="30" max="300" step="0.1"
                />
              </div>
            </div>

            {/* Actividad física inline */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 flex items-center gap-1">
                <Activity className="w-3 h-3" /> Actividad física
              </label>
              <div className="flex items-center gap-3 bg-gray-50 border-2 border-brand-verde/10 focus-within:border-brand-mostaza/30 rounded-2xl py-3.5 px-4 transition-all">
                <span className="text-sm font-bold text-gray-700">Actividad física</span>
                <input
                  type="number"
                  value={formData.activity_days}
                  onChange={e => {
                    const v = parseInt(e.target.value);
                    if (isNaN(v)) { setFormData({...formData, activity_days: ''}); return; }
                    if (v >= 0 && v <= 7) setFormData({...formData, activity_days: String(v)});
                  }}
                  className="w-12 bg-white border-2 border-brand-verde/20 rounded-xl py-1 px-2 text-center text-sm font-black outline-none focus:border-brand-mostaza/40 transition-all"
                  placeholder="0"
                  min="0" max="7" step="1"
                />
                <span className="text-sm font-bold text-gray-700">días a la semana</span>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading}
            className={`w-full h-14 rounded-[20px] font-black text-[15px] shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 uppercase tracking-widest
              ${success ? 'bg-brand-verde text-white' : 'bg-brand-borravino text-white'}`}>
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> :
             success ? <><CheckCircle2 className="w-5 h-5" /> Perfil Guardado</> :
             <><Save className="w-5 h-5" /> Guardar Cambios</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
