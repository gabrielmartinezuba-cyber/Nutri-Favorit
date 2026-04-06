'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Wallet, Loader2, CheckCircle2, Lock } from 'lucide-react';

type PointsEvent = {
  id: string;
  puntos: number;
  motivo: string;
  created_at: string;
};

const BENEFITS = [
  { id: 'desc15', points: 500, title: '15% de descuento', desc: 'En tu próximo pedido' },
  { id: 'granola', points: 800, title: 'Granola Proteica', desc: 'Gratis en tu próxima compra' },
  { id: 'tarta', points: 1200, title: 'Tarta Individual', desc: 'Gratis en tu próxima compra' },
];

export default function BilleteraPage() {
  const user = useAuthStore(s => s.user);
  const [history, setHistory] = useState<PointsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const points = user?.favorit_points || 0;

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('points_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      setHistory(data || []);
    } catch (err) {
      console.error('Error fetching points history:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });

  return (
    <div className="max-w-xl mx-auto pb-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-4 flex flex-col gap-6">

        {/* Back Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/perfil')} className="p-2 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-100 active:scale-95 transition-all">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-heading font-black text-brand-mostaza">Mis Puntos Favorit</h1>
        </div>

        {/* Balance */}
        <div className="bg-gradient-to-br from-brand-borravino to-[#8B1A35] rounded-[32px] p-7 text-white relative overflow-hidden shadow-2xl shadow-brand-borravino/30">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-16 translate-x-12" />
          <div className="absolute bottom-0 left-0 w-28 h-28 bg-brand-mostaza/20 rounded-full translate-y-12 -translate-x-8" />
          <span className="text-xs font-black text-white/60 uppercase tracking-[0.2em]">Tu saldo actual</span>
          <div className="flex items-end gap-2 mt-2 mb-1">
            <span className="text-6xl font-black font-heading leading-none">{points}</span>
            <span className="text-lg text-white/60 font-bold mb-1">pts</span>
          </div>
          <span className="text-xs text-white/50 font-medium">💛 Puntos Favorit</span>
        </div>

        {/* Beneficios */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Canjear Beneficios</h2>
          {BENEFITS.map((b, idx) => {
            const canRedeem = points >= b.points;
            const missing = b.points - points;

            return (
              <motion.div key={b.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.06 }}
                className="bg-white rounded-[20px] p-4 shadow-sm border border-gray-100 flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 ${canRedeem ? 'bg-brand-mostaza/10' : 'bg-gray-50'}`}>
                  <span className={`text-lg font-black font-heading ${canRedeem ? 'text-brand-mostaza' : 'text-gray-300'}`}>
                    {b.points}
                  </span>
                  <span className={`text-[8px] font-bold uppercase ${canRedeem ? 'text-brand-mostaza' : 'text-gray-300'}`}>pts</span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-black text-gray-900 block leading-tight">{b.title}</span>
                  <span className="text-xs text-gray-400 font-medium">{b.desc}</span>
                </div>
                <button
                  disabled={!canRedeem}
                  className={`flex-shrink-0 flex items-center gap-1.5 font-black text-[11px] px-3 py-2.5 rounded-xl uppercase tracking-wider transition-all active:scale-95
                    ${canRedeem
                      ? 'bg-brand-mostaza text-brand-borravino shadow-md shadow-brand-mostaza/20 hover:scale-105'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  {canRedeem ? (
                    <><CheckCircle2 className="w-3.5 h-3.5" /> Canjear</>
                  ) : (
                    <><Lock className="w-3 h-3" /> -{missing} pts</>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Historial de movimientos */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Movimientos</h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-brand-mostaza animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 text-center">
              <Wallet className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400 font-medium">Sin movimientos aún</p>
            </div>
          ) : (
            history.map(item => (
              <div key={item.id} className="bg-white rounded-[16px] px-4 py-3 shadow-sm border border-gray-100 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-gray-800 block truncate">{item.motivo}</span>
                  <span className="text-[10px] text-gray-400">{formatDate(item.created_at)}</span>
                </div>
                <span className={`font-black text-base ${item.puntos > 0 ? 'text-brand-verde' : 'text-red-500'}`}>
                  {item.puntos > 0 ? '+' : ''}{item.puntos} pts
                </span>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
