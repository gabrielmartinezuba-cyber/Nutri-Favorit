'use client';

import { useAuthStore } from '@/store/authStore';
import { Target, Flame, Ruler, Weight, Activity, ChevronRight, Droplets, Dumbbell, Moon, CalendarRange } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { NUTRICIONISTAS } from '@/config/nutricionistas';

// ─── Harris-Benedict Macro Calculator ───────────────────────────────────────
function calcMacros(user: any) {
  const { height, weight, birth_date, objective, activity_days } = user || {};
  if (!height || !weight || !birth_date) return null;

  const age = Math.floor((Date.now() - new Date(birth_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  // BMR (Harris-Benedict, usando fórmula genérica sin sexo)
  const bmr = 10 * weight + 6.25 * height - 5 * age + 5;

  // Activity multiplier
  const days = activity_days ?? 0;
  const multiplier =
    days === 0 ? 1.2 :
    days <= 2  ? 1.375 :
    days <= 4  ? 1.55 :
    days <= 6  ? 1.725 : 1.9;

  const tdee = Math.round(bmr * multiplier);

  // Macro splits por objetivo
  let protPct = 0.30, carbPct = 0.40, fatPct = 0.30;
  const obj = (objective || '').toLowerCase();
  if (obj.includes('grasa') || obj.includes('pérdida')) {
    protPct = 0.35; carbPct = 0.30; fatPct = 0.35;
  } else if (obj.includes('volumen') || obj.includes('masa')) {
    protPct = 0.30; carbPct = 0.50; fatPct = 0.20;
  }

  const prot = Math.round((tdee * protPct) / 4);
  const carbs = Math.round((tdee * carbPct) / 4);
  const fat = Math.round((tdee * fatPct) / 9);

  return { tdee, prot, carbs, fat };
}

// ─── Donut Chart ─────────────────────────────────────────────────────────────
function DonutChart({ prot, carbs, fat, tdee }: { prot: number; carbs: number; fat: number; tdee: number }) {
  const total = prot * 4 + carbs * 4 + fat * 9;
  const r = 54;
  const circ = 2 * Math.PI * r;
  
  const protPct = (prot * 4) / total;
  const carbPct = (carbs * 4) / total;
  const fatPct  = (fat * 9) / total;

  const segments = [
    { pct: protPct, color: '#2D6A4F', offset: 0 },
    { pct: carbPct, color: '#F4A937', offset: protPct },
    { pct: fatPct,  color: '#6B2139', offset: protPct + carbPct },
  ];

  return (
    <div className="relative flex items-center justify-center w-40 h-40 mx-auto">
      <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx="80" cy="80" r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="18"
            strokeDasharray={`${seg.pct * circ} ${circ}`}
            strokeDashoffset={-seg.offset * circ}
          />
        ))}
      </svg>
      <div className="absolute text-center">
        <p className="text-2xl font-black font-heading text-brand-borravino leading-none">{tdee}</p>
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">kcal / día</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SaludPage() {
  const user = useAuthStore((state) => state.user);
  const macros = calcMacros(user);
  const profileComplete = user?.height && user?.weight && user?.birth_date;

  return (
    <div className="pb-32 pt-4 flex flex-col gap-6 max-w-xl mx-auto">
      <h1 className="text-3xl font-heading font-bold text-brand-mostaza">Mi Salud</h1>

      {/* ─── Sección 1: Resumen de perfil ──────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-white rounded-[28px] p-5 shadow-sm border border-brand-verde/15 flex flex-col gap-4">
        <h2 className="text-[11px] font-black text-brand-verde uppercase tracking-widest flex items-center gap-2">
          <Activity className="w-3.5 h-3.5" /> Perfil de Salud
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-brand-verde/5 rounded-2xl p-3 flex flex-col gap-1">
            <Target className="w-4 h-4 text-brand-verde" />
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Objetivo</span>
            <span className="text-sm font-black text-gray-800 leading-tight">{user?.objective || '—'}</span>
          </div>
          <div className="bg-orange-50 rounded-2xl p-3 flex flex-col gap-1">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Metabolismo</span>
            <span className="text-sm font-black text-gray-800 leading-tight">{user?.metabolism || '—'}</span>
          </div>
          <div className="bg-blue-50 rounded-2xl p-3 flex flex-col gap-1">
            <Ruler className="w-4 h-4 text-blue-400" />
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Altura</span>
            <span className="text-sm font-black text-gray-800">{user?.height ? `${user.height} cm` : '—'}</span>
          </div>
          <div className="bg-purple-50 rounded-2xl p-3 flex flex-col gap-1">
            <Weight className="w-4 h-4 text-purple-400" />
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Peso</span>
            <span className="text-sm font-black text-gray-800">{user?.weight ? `${user.weight} kg` : '—'}</span>
          </div>
        </div>

        <div className="bg-brand-mostaza/5 rounded-2xl p-3 flex items-center gap-3">
          <Dumbbell className="w-4 h-4 text-brand-mostaza flex-shrink-0" />
          <span className="text-sm font-bold text-gray-700">
            {user?.activity_days !== undefined && user?.activity_days !== null
              ? <><span className="font-black text-brand-borravino">{user.activity_days}</span> días de actividad física por semana</>
              : <span className="text-gray-400">Días de actividad no definidos</span>}
          </span>
        </div>

        {(!profileComplete) && (
          <Link href="/perfil/configuracion" className="flex items-center justify-between bg-brand-mostaza/10 p-3 rounded-xl border border-brand-mostaza/20 group">
            <span className="text-[11px] font-bold text-brand-borravino">Completá tu perfil para ver tus macros</span>
            <ChevronRight className="w-4 h-4 text-brand-borravino group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </motion.div>

      {/* ─── Sección 2: Hábitos Diarios ────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-[28px] p-5 shadow-sm border border-brand-verde/15 flex flex-col gap-3">
        <h2 className="text-[11px] font-black text-brand-borravino uppercase tracking-widest flex items-center gap-2">
          <Activity className="w-3.5 h-3.5" /> Hábitos Diarios
        </h2>
        <div className="flex flex-col gap-2">
          {[
            { icon: <Droplets className="w-5 h-5 text-blue-400" />, bg: 'bg-blue-50', text: 'Tomá 2 litros de agua hoy' },
            { icon: <Dumbbell className="w-5 h-5 text-brand-verde" />, bg: 'bg-brand-verde/5', text: 'Realizá actividad física' },
            { icon: <Moon className="w-5 h-5 text-purple-400" />, bg: 'bg-purple-50', text: 'Dormí al menos 8 horas' },
          ].map((h, i) => (
            <div key={i} className={`flex items-center gap-3 ${h.bg} rounded-2xl px-4 py-3`}>
              {h.icon}
              <span className="text-sm font-semibold text-gray-700">{h.text}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ─── Sección 3: Calculadora de Macros ──────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-white rounded-[28px] p-5 shadow-sm border border-brand-verde/15 flex flex-col gap-4">
        <h2 className="text-[11px] font-black text-brand-mostaza uppercase tracking-widest flex items-center gap-2">
          <Flame className="w-3.5 h-3.5" /> Macros Personalizados
        </h2>

        {!profileComplete ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <p className="text-sm text-gray-400 font-medium">Completá altura, peso y fecha de nacimiento para ver tu calculadora de macros personalizada.</p>
            <Link href="/perfil/configuracion" className="bg-brand-mostaza text-brand-borravino font-black text-xs px-5 py-2.5 rounded-full uppercase tracking-wider">
              Completar Perfil
            </Link>
          </div>
        ) : macros ? (
          <>
            <DonutChart prot={macros.prot} carbs={macros.carbs} fat={macros.fat} tdee={macros.tdee} />
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div className="flex flex-col items-center bg-brand-verde/5 rounded-2xl py-3 px-2">
                <div className="w-3 h-3 rounded-full bg-[#2D6A4F] mb-1" />
                <span className="text-lg font-black text-[#2D6A4F] leading-none">{macros.prot}g</span>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Proteínas</span>
              </div>
              <div className="flex flex-col items-center bg-brand-mostaza/5 rounded-2xl py-3 px-2">
                <div className="w-3 h-3 rounded-full bg-brand-mostaza mb-1" />
                <span className="text-lg font-black text-brand-mostaza leading-none">{macros.carbs}g</span>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Carbohid.</span>
              </div>
              <div className="flex flex-col items-center bg-brand-borravino/5 rounded-2xl py-3 px-2">
                <div className="w-3 h-3 rounded-full bg-brand-borravino mb-1" />
                <span className="text-lg font-black text-brand-borravino leading-none">{macros.fat}g</span>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Grasas</span>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 text-center font-medium">Calculado con Harris-Benedict · {user?.objective || 'Mantenimiento'}</p>
          </>
        ) : null}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white rounded-[28px] p-5 shadow-sm border border-brand-verde/15 flex flex-col gap-4">
        <h2 className="text-[11px] font-black text-brand-verde uppercase tracking-widest flex items-center gap-2">
          <CalendarRange className="w-3.5 h-3.5" /> Turnos Nutricionales
        </h2>
        <p className="text-xs text-gray-500 font-medium leading-relaxed -mt-1">
          Reserva un turno para mejorar tus hábitos de forma personalizada con nuestro equipo experto.
        </p>

        <div className="grid grid-cols-2 gap-3 items-stretch">
          {NUTRICIONISTAS.map((prof) => (
            <div key={prof.id} className="flex flex-col gap-3 bg-gray-50 rounded-[20px] p-4 border border-gray-100">
              {/* Foto */}
              <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 shadow-md bg-gradient-to-br from-brand-borravino to-brand-mostaza">
                {prof.foto
                  ? <img src={prof.foto} alt={prof.nombre} className="w-full h-full object-cover" />
                  : <span className="w-full h-full flex items-center justify-center text-white font-black text-xl">
                      {prof.nombre.charAt(prof.nombre.lastIndexOf(' ') + 1)}
                    </span>}
              </div>

              {/* Info — flex-grow para que empuje el botón hacia abajo */}
              <div className="flex flex-col gap-0.5 flex-1">
                <span className="text-xs font-black text-gray-800 leading-tight">{prof.nombre}</span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">{prof.matricula}</span>
                {prof.especialidades.map((e, i) => (
                  <span key={i} className="text-[10px] text-brand-verde font-semibold leading-snug">{e}</span>
                ))}
              </div>

              {/* Botón siempre al fondo */}
              <a
                href={`https://wa.me/${prof.whatsapp}?text=Hola! Me gustaria reservar un turno nutricional.`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 bg-brand-verde text-white font-black text-[10px] uppercase tracking-wider py-2.5 rounded-xl active:scale-95 transition-all mt-auto"
              >
                <svg className="w-3.5 h-3.5" fill="white" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.067 2.877 1.215 3.076.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.658 1.43 5.632 1.43h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Reservar
              </a>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
