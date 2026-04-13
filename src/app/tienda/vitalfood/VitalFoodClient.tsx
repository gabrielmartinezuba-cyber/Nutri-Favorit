'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Minus } from 'lucide-react';
import { useCart } from '@/store/useCart';
import { FAVORIT_WHATSAPP } from '@/config/contacto';

type Tab = 'menu-dia' | 'menu-fijo' | 'promos';

interface MenuDiaItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
}

interface MenuFijoGroup {
  category: string;
  items: any[];
}

interface Promo {
  id: string;
  nombre?: string;
  name?: string;
  descripcion?: string;
  description?: string;
  precio?: number;
  price?: number;
}

interface Props {
  menuDia: MenuDiaItem[];
  postres: any[];
  menuFijo: MenuFijoGroup[];
  promos: Promo[];
  todayStr: string;
}

export default function VitalFoodClient({ menuDia, postres, menuFijo, promos, todayStr }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('menu-dia');
  const { items, addItem, updateQuantity } = useCart();

  const getItemQty = (id: string) => items.find(i => i.id === id)?.quantity || 0;

  const handleAddToCart = (item: any) => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      category: 'VitalFood',
      image_urls: item.image_url ? [item.image_url] : []
    });
  };

  const handleUpdateQty = (id: string, newQty: number) => updateQuantity(id, newQty);

  return (
    <div className="pb-32 pt-4 flex flex-col gap-6 bg-[#f8f9f4] min-h-[100dvh] -mt-16 pt-20 -mx-4 px-4">
      {/* Header VitalFood */}
      <div className="flex items-center justify-between bg-white rounded-2xl px-6 h-20 shadow-sm border border-gray-50 flex-shrink-0">
        <div className="w-[180px] h-full flex items-center justify-start">
          <img src="/logovitalfood.png" alt="VitalFood Logo" className="h-full w-auto max-h-16 object-contain object-left" />
        </div>
        <Link href="/tienda/favorit" className="flex items-center gap-2 bg-[#fdfafb] hover:bg-[#f6eef1] transition-colors pl-1 pr-3 py-1 rounded-full border border-gray-100 active:scale-95 shadow-sm">
          <div className="h-7 w-7 flex items-center justify-center bg-[#6B2139] rounded-full drop-shadow-sm">
            <img src="/logofav.png" alt="Favorit Mini" className="h-4 w-auto object-contain brightness-0 invert" />
          </div>
          <span className="text-[10px] font-bold text-brand-borravino uppercase tracking-wider">Ir a Favorit</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {(['menu-dia', 'menu-fijo', 'promos'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
              activeTab === tab ? 'bg-[#3C5040] text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* MENU DIA */}
      {activeTab === 'menu-dia' && (
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-xl font-heading font-black text-gray-900 capitalize mb-4 px-1">{todayStr}</h2>
            {menuDia.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menuDia.map((item) => {
                  const qty = getItemQty(item.id);
                  const isKeto = item.id.includes('keto');
                  const isVeggie = item.id.includes('veggie');
                  const isProt = item.id.includes('prot');
                  const borderColor = isKeto ? 'border-green-500' : isVeggie ? 'border-purple-500' : isProt ? 'border-red-500' : 'border-orange-500';
                  const lightBg = isKeto ? 'bg-green-50' : isVeggie ? 'bg-purple-50' : isProt ? 'bg-red-50' : 'bg-orange-50';
                  return (
                    <div key={item.id} className={`bg-white rounded-2xl shadow-sm border-l-4 ${borderColor} border-y border-r border-gray-100 flex flex-col overflow-hidden`}>
                      <div className={`h-32 w-full ${item.image_url ? 'bg-transparent' : lightBg} flex items-center justify-center overflow-hidden border-b border-gray-50`}>
                        {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <img src="/logovitalfood.png" className="h-10 opacity-20 grayscale" alt="" />}
                      </div>
                      <div className="p-4 flex flex-col gap-2 flex-grow">
                        <div>
                          <h3 className="font-bold text-gray-900 leading-tight">{item.name}</h3>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                        </div>
                        <div className="flex items-center justify-between mt-auto pt-3">
                          <span className="text-lg font-black text-[#3C5040]">${item.price}</span>
                          {qty === 0 ? (
                            <button onClick={() => handleAddToCart(item)} className="bg-[#3c5040] text-white p-2.5 rounded-xl hover:bg-[#2c3a2f] active:scale-95 transition-transform shadow-md shadow-[#3c5040]/20"><Plus className="w-5 h-5" /></button>
                          ) : (
                            <div className="flex items-center gap-3 bg-gray-100 rounded-xl px-3 py-1.5 border border-gray-200">
                              <button onClick={() => handleUpdateQty(item.id, qty - 1)} className="text-[#3c5040] font-bold"><Minus size={18} strokeWidth={3} /></button>
                              <span className="font-black text-sm w-4 text-center">{qty}</span>
                              <button onClick={() => handleUpdateQty(item.id, qty + 1)} className="text-[#3c5040] font-bold"><Plus size={18} strokeWidth={3} /></button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-gray-50 p-6 rounded-2xl text-center border border-gray-100 italic text-gray-400">No hay menús publicados para hoy.</div>
            )}
          </div>

          {postres.length > 0 && (
            <div>
              <h3 className="text-lg font-heading font-black text-gray-900 mb-3 px-1">Postres y Otros</h3>
              <div className="grid grid-cols-2 gap-3">
                {postres.map((item, idx) => {
                  const itemId = `vf-pd-${idx}`;
                  const qty = getItemQty(itemId);
                  return (
                    <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                      <div className="h-24 w-full bg-gray-50 flex items-center justify-center overflow-hidden border-b border-gray-50">
                        {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <img src="/logovitalfood.png" className="h-8 opacity-20 grayscale" alt="" />}
                      </div>
                      <div className="p-3 flex flex-col gap-1.5">
                        <h4 className="font-bold text-[13px] text-gray-900 leading-tight line-clamp-1">{item.name}</h4>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm font-black text-[#3C5040]">${item.price}</span>
                          {qty === 0 ? (
                            <button onClick={() => handleAddToCart({ ...item, id: itemId })} className="bg-gray-100 text-[#3C5040] p-1.5 rounded-lg hover:bg-gray-200 transition-colors"><Plus className="w-4 h-4" /></button>
                          ) : (
                            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 border border-gray-200">
                              <button onClick={() => handleUpdateQty(itemId, qty - 1)} className="p-1 text-[#3C5040]"><Minus className="w-3 h-3" strokeWidth={3} /></button>
                              <span className="font-bold text-xs w-3 text-center">{qty}</span>
                              <button onClick={() => handleUpdateQty(itemId, qty + 1)} className="p-1 text-[#3C5040]"><Plus className="w-3 h-3" strokeWidth={3} /></button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MENU FIJO */}
      {activeTab === 'menu-fijo' && (
        <div className="flex flex-col gap-6">
          {menuFijo.length > 0 ? (
            menuFijo.map((cat) => (
              <div key={cat.category}>
                <h3 className="text-xl font-heading font-black text-[#E27E36] mb-4 uppercase tracking-widest px-1">{cat.category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cat.items.map((item: any) => {
                    const itemId = `vf-fixed-${item.id}`;
                    const qty = getItemQty(itemId);
                    return (
                      <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
                        {item.image_url && (
                          <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-gray-50">
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 flex flex-col min-w-0">
                          <h3 className="font-bold text-gray-900 leading-tight">{item.name}</h3>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                          
                          <div className="flex items-center justify-between mt-auto pt-2">
                             <span className="text-lg font-black text-[#E27E36]">${item.price}</span>
                             <div className="scale-90 origin-right">
                              {qty === 0 ? (
                                <button 
                                  onClick={() => handleAddToCart({ ...item, id: itemId })}
                                  className="bg-[#3C5040] text-white p-2.5 rounded-xl hover:bg-[#2c3a2f] active:scale-95 transition-transform shadow-md shadow-[#3C5040]/20"
                                >
                                  <Plus className="w-5 h-5" />
                                </button>
                              ) : (
                                <div className="flex items-center gap-3 bg-gray-100 rounded-xl px-3 py-1.5 border border-gray-200">
                                  <button onClick={() => handleUpdateQty(itemId, qty - 1)} className="text-[#3C5040] font-bold"><Minus className="w-4 h-4" strokeWidth={3} /></button>
                                  <span className="font-black text-sm w-4 text-center text-gray-700">{qty}</span>
                                  <button onClick={() => handleUpdateQty(itemId, qty + 1)} className="text-[#3C5040] font-bold"><Plus className="w-4 h-4" strokeWidth={3} /></button>
                                </div>
                              )}
                             </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-gray-50 p-8 rounded-2xl text-center border border-gray-100 italic text-gray-400">No hay ítems en el menú fijo actualmente.</div>
          )}
        </div>
      )}

      {/* PROMOS */}
      {activeTab === 'promos' && (
        <div className="flex flex-col gap-4">
          {promos.length > 0 ? (
            promos.map((promo) => {
              const nombre = promo.nombre || promo.name || '';
              const precio = promo.precio || promo.price || 0;
              const descripcion = promo.descripcion || promo.description || '';
              const wppMessage = encodeURIComponent(`¡Hola! Quisiera más información sobre la ${nombre} por $${precio}.`);
              return (
                <div key={promo.id} className="bg-gradient-to-tr from-[#3C5040] to-[#516b56] text-white p-6 rounded-3xl shadow-lg flex flex-col gap-4">
                  <div>
                    <h3 className="text-2xl font-black">{nombre}</h3>
                    <p className="text-white/80 mt-1 font-medium text-sm leading-relaxed">{descripcion}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-3xl font-black">${precio}</span>
                    <a href={`https://wa.me/${FAVORIT_WHATSAPP}?text=${wppMessage}`} target="_blank" rel="noopener noreferrer" className="bg-white text-[#3C5040] px-6 py-2.5 rounded-xl font-black active:scale-95 transition-transform text-sm shadow-sm text-center">
                      CONSULTAR
                    </a>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-gray-50 p-8 rounded-2xl text-center border border-gray-100 italic text-gray-400">No hay promociones activas.</div>
          )}
        </div>
      )}
    </div>
  );
}
