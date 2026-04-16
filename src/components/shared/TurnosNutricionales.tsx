"use client";

import { motion } from 'framer-motion';
import { CalendarRange } from 'lucide-react';
import { NUTRICIONISTAS } from '@/config/nutricionistas';

export default function TurnosNutricionales() {
  return (
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
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Reservar
            </a>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
