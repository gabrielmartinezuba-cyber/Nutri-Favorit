'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

import { FAVORIT_WHATSAPP } from '@/config/contacto';

// Tipos 
type Tab = 'menu-dia' | 'menu-fijo' | 'promos';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function VitalFoodPage() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<Tab>('menu-dia');
  const [menuDiaState, setMenuDiaState] = useState<any[]>([]);
  const [postresDiaState, setPostresDiaState] = useState<any[]>([]);
  const [menuFijoState, setMenuFijoState] = useState<any[]>([]);
  const [promosState, setPromosState] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const todayString = new Date().toISOString().split('T')[0];
      
      const [menusRes, fixedRes, promosRes] = await Promise.all([
        supabase.from('vitalfood_daily_menus').select('*').eq('menu_date', todayString).eq('status', 'published').maybeSingle(),
        supabase.from('vitalfood_fixed_items').select('*').eq('is_active', true),
        supabase.from('vitalfood_promos').select('*').eq('activo', true)
      ]);
      
      if (menusRes.data) {
        setPostresDiaState(menusRes.data.desserts || []);
        const opts = menusRes.data.options;
        const mapped = [];
        if (opts.general?.desc) mapped.push({ id: 'vf-md-gral', name: 'Menú General (Hoy)', description: opts.general.desc, price: opts.general.price, image_url: opts.general.image_url });
        if (opts.keto?.desc) mapped.push({ id: 'vf-md-keto', name: 'Menú Keto (Hoy)', description: opts.keto.desc, price: opts.keto.price, image_url: opts.keto.image_url });
        if (opts.veggie?.desc) mapped.push({ id: 'vf-md-veggie', name: 'Menú Veggie (Hoy)', description: opts.veggie.desc, price: opts.veggie.price, image_url: opts.veggie.image_url });
        if (opts.proteica?.desc) mapped.push({ id: 'vf-md-prot', name: 'Menú Proteico (Hoy)', description: opts.proteica.desc, price: opts.proteica.price, image_url: opts.proteica.image_url });
        setMenuDiaState(mapped);
      } else {
        setMenuDiaState([]);
      }
      
      if (fixedRes.data) {
        const groups: Record<string, any[]> = {};
        for(const item of fixedRes.data) {
          if(!groups[item.category]) groups[item.category] = [];
          groups[item.category].push(item);
        }
        setMenuFijoState(Object.keys(groups).map(cat => ({ category: cat, items: groups[cat] })));
      }
      
      if (promosRes.data) {
        setPromosState(promosRes.data);
      }
      setLoading(false);
    }
    loadData();
  }, []);
  const addItem = useCartStore(state => state.addItem);

  const handleAddToCart = (item: any) => {
    // Adapter para que el cartStore lo acepte
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      category: 'VitalFood',
      image_urls: []
    });
  };

  const today = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="pb-32 pt-4 flex flex-col gap-6 bg-[#f8f9f4] min-h-[100dvh] -mt-16 pt-20 -mx-4 px-4">
      {/* Header VitalFood */}
      <div className="flex items-center justify-between bg-white rounded-2xl px-6 h-32 shadow-sm border border-gray-50 flex-shrink-0">
        <div className="w-[180px] h-full flex items-center justify-center">
          <img src="/logovitalfood.png" alt="VitalFood Logo" className="w-full h-auto max-h-28 object-contain" />
        </div>
        <Link href="/tienda/favorit" className="flex items-center gap-2 bg-[#fdfafb] hover:bg-[#f6eef1] transition-colors pl-1.5 pr-4 py-1.5 rounded-full border border-gray-100 active:scale-95 shadow-sm">
          <div className="h-8 w-8 flex items-center justify-center bg-[#6B2139] rounded-full drop-shadow-sm">
            <img src="/logofav.png" alt="Favorit Mini" className="h-4 w-auto object-contain brightness-0 invert" />
          </div>
          <span className="text-[11px] font-bold text-brand-borravino uppercase tracking-wider">Ir a Favorit</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {(['menu-dia', 'menu-fijo', 'promos'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
              activeTab === tab
                ? 'bg-[#3C5040] text-white shadow-md'
                : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Contenido Menú del Día */}
      {activeTab === 'menu-dia' && (
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-xl font-heading font-black text-gray-900 capitalize mb-4 px-1">{today}</h2>
            {loading ? (
               <div className="flex items-center justify-center p-8"><p className="animate-pulse text-gray-500 font-bold">Cargando menú...</p></div>
            ) : menuDiaState.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menuDiaState.map((item) => {
                  // Determine colors based on ID or Name
                  const isKeto = item.id.includes('keto');
                  const isVeggie = item.id.includes('veggie');
                  const isProt = item.id.includes('prot');
                  
                  let themeColor = 'bg-orange-500'; // General
                  let borderColor = 'border-orange-500';
                  let lightBg = 'bg-orange-50';
                  
                  if (isKeto) { themeColor = 'bg-green-500'; borderColor = 'border-green-500'; lightBg = 'bg-green-50'; }
                  else if (isVeggie) { themeColor = 'bg-purple-500'; borderColor = 'border-purple-500'; lightBg = 'bg-purple-50'; }
                  else if (isProt) { themeColor = 'bg-red-500'; borderColor = 'border-red-500'; lightBg = 'bg-red-50'; }

                  return (
                    <div key={item.id} className={`bg-white rounded-2xl shadow-sm border-l-4 ${borderColor} border-y border-r border-gray-100 flex flex-col overflow-hidden`}>
                      {/* Image Formating */}
                      <div className={`h-32 w-full ${item.image_url ? 'bg-transparent' : lightBg} flex items-center justify-center overflow-hidden border-b border-gray-50`}>
                        {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                            <img src="/logovitalfood.png" className="h-10 opacity-20 grayscale" alt="" />
                        )}
                      </div>
                      
                      <div className="p-4 flex flex-col gap-2 flex-grow">
                        <div>
                          <h3 className="font-bold text-gray-900 leading-tight">{item.name}</h3>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                        </div>
                        <div className="flex items-center justify-between mt-auto pt-3">
                          <span className="text-lg font-black text-[#3C5040]">${item.price}</span>
                          <button 
                            onClick={() => handleAddToCart(item)}
                            className="bg-[#3c5040] text-white p-2.5 rounded-xl hover:bg-[#2c3a2f] active:scale-95 transition-transform shadow-md shadow-[#3c5040]/20"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-gray-50 p-6 rounded-2xl text-center border border-gray-100">
                <p className="text-gray-500 font-medium">El menú de hoy se publicará pronto. Revisá más tarde.</p>
              </div>
            )}
          </div>

          {postresDiaState.length > 0 && (
            <div>
              <h3 className="text-lg font-heading font-black text-gray-900 mb-3 px-1">Postres y Otros</h3>
              <div className="grid grid-cols-2 gap-3">
                {postresDiaState.map((item, idx) => (
                  <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                    <div className="h-24 w-full bg-gray-50 flex items-center justify-center overflow-hidden border-b border-gray-50">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <img src="/logovitalfood.png" className="h-8 opacity-20 grayscale" alt="" />
                      )}
                    </div>
                    <div className="p-3 flex flex-col gap-1.5">
                      <h4 className="font-bold text-[13px] text-gray-900 leading-tight line-clamp-1">{item.name}</h4>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm font-black text-[#3C5040]">${item.price}</span>
                        <button 
                          onClick={() => handleAddToCart({ ...item, id: `vf-pd-${idx}` })}
                          className="bg-gray-100 text-[#3C5040] p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Contenido Menú Fijo */}
      {activeTab === 'menu-fijo' && (
        <div className="flex flex-col gap-6">
          {loading ? (
               <div className="flex items-center justify-center p-8"><p className="animate-pulse text-gray-500 font-bold">Cargando menú fijo...</p></div>
          ) : menuFijoState.map((cat) => (
            <div key={cat.category}>
              <h2 className="text-xl font-heading font-black text-[#E27E36] mb-4 uppercase tracking-widest">{cat.category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cat.items.map((item: any) => (
                  <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between gap-4">
                     {item.image_url && (
                        <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-gray-50">
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                     )}
                    <div className="flex-1 pr-2">
                      <h3 className="font-bold text-gray-900">{item.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                      <span className="block text-md font-black text-[#E27E36] mt-2">${item.price}</span>
                    </div>
                    <button 
                      onClick={() => handleAddToCart(item)}
                      className="bg-[#3C5040] text-white p-2.5 rounded-xl hover:bg-[#2c3a2f] active:scale-95 transition-transform shrink-0 shadow-md shadow-[#3C5040]/20"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contenido Promos */}
      {activeTab === 'promos' && (
        <div className="flex flex-col gap-4">
           {loading ? (
             <div className="flex items-center justify-center p-8"><p className="animate-pulse text-gray-500 font-bold">Cargando promociones...</p></div>
           ) : promosState.map((promo) => {
            const wppMessage = encodeURIComponent(`¡Hola! Quisiera más información sobre la ${promo.nombre || promo.name} por $${promo.precio || promo.price}.`);
            return (
              <div key={promo.id} className="bg-gradient-to-tr from-[#3C5040] to-[#516b56] text-white p-6 rounded-3xl shadow-lg flex flex-col gap-4">
                <div>
                  <h3 className="text-2xl font-black">{promo.nombre || promo.name}</h3>
                  <p className="text-white/80 mt-1 font-medium text-sm leading-relaxed">{promo.descripcion || promo.description}</p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-3xl font-black">${promo.precio || promo.price}</span>
                  <a 
                    href={`https://wa.me/${FAVORIT_WHATSAPP}?text=${wppMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white text-[#3C5040] px-4 py-2 rounded-xl font-bold hover:bg-gray-50 active:scale-95 transition-transform text-sm shadow-sm"
                  >
                    Consultar
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
