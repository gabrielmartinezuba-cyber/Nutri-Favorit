'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

import { FAVORIT_WHATSAPP } from '@/config/contacto';

// Tipos 
type Tab = 'menu-dia' | 'menu-fijo' | 'promos';

// Mock Data para VitalFood
const MENU_DEL_DIA = [
  {
    id: 'vf-md-gral',
    name: 'Menú General (Hoy)',
    description: 'Pechuga a la plancha con puré mixto y ensalada mixta',
    price: 6500,
  },
  {
    id: 'vf-md-keto',
    name: 'Menú Keto (Hoy)',
    description: 'Pollo al verdeo con espinaca a la crema y parmesano',
    price: 7200,
  },
  {
    id: 'vf-md-veggie',
    name: 'Menú Veggie (Hoy)',
    description: 'Wok de vegetales de estación con tofu y semillas',
    price: 6300,
  },
  {
    id: 'vf-md-prot',
    name: 'Menú Proteico (Hoy)',
    description: 'Bife de chorizo magro con revuelto de claras y zapallo',
    price: 8000,
  }
];

const POSTRES_DEL_DIA = [
  {
    id: 'vf-pd-1',
    name: 'Flan Light',
    description: 'Flan casero sin azúcar con dulce de leche diet',
    price: 2500,
  },
  {
    id: 'vf-pd-2',
    name: 'Copa de Frutas',
    description: 'Ensalada de frutas frescas',
    price: 2000,
  }
];

const MENU_FIJO = [
  {
    category: 'Pastas',
    items: [
      { id: 'vf-mf-p1', name: 'Sorrentinos de Jamón y Queso', description: 'Con salsa fileto', price: 6800 },
      { id: 'vf-mf-p2', name: 'Ravioles de Verdura', description: 'Con salsa blanca', price: 6500 },
    ]
  },
  {
    category: 'Ensaladas',
    items: [
      { id: 'vf-mf-e1', name: 'Ensalada Caesar', description: 'Lechuga, pollo, croutons, queso', price: 5500 },
      { id: 'vf-mf-e2', name: 'Ensalada Atún', description: 'Atún, huevo, tomate, zanahoria', price: 5800 },
    ]
  }
];

const PROMOS = [
  {
    id: 'sem',
    name: 'Promo Semanal',
    description: 'Llevá 5 viandas de Menú General con postre incluido',
    price: 29000
  },
  {
    id: 'men',
    name: 'Promo Mensual',
    description: '20 viandas combinables (Menú General y Veggie)',
    price: 110000
  }
];

export default function VitalFoodPage() {
  const [activeTab, setActiveTab] = useState<Tab>('menu-dia');
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
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-gray-50 flex-shrink-0">
        <div className="w-[120px]">
          <img src="/logovitalfood.png" alt="VitalFood Logo" className="w-full h-auto object-contain" />
        </div>
        <Link href="/tienda/favorit" className="flex items-center gap-2 bg-[#fdfafb] hover:bg-[#f6eef1] transition-colors pl-1.5 pr-4 py-1.5 rounded-full border border-gray-100 active:scale-95 shadow-sm">
          <img src="/logofav.png" alt="Favorit Mini" className="h-8 w-auto object-contain drop-shadow-sm bg-white rounded-full p-1" />
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
            {MENU_DEL_DIA.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MENU_DEL_DIA.map((item) => {
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
                      {/* Image Placeholder */}
                      <div className={`h-24 w-full ${lightBg} flex items-center justify-center`}>
                        <img src="/logovitalfood.png" className="h-10 opacity-20 grayscale" alt="" />
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

          <div>
            <h3 className="text-lg font-heading font-black text-gray-900 mb-3">Postres</h3>
            <div className="grid grid-cols-2 gap-3">
              {POSTRES_DEL_DIA.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">{item.name}</h4>
                    <span className="text-sm font-black text-[#3C5040]">${item.price}</span>
                  </div>
                  <button 
                    onClick={() => handleAddToCart(item)}
                    className="w-full mt-auto bg-gray-100 text-gray-800 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors"
                  >
                    AGREGAR
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Contenido Menú Fijo */}
      {activeTab === 'menu-fijo' && (
        <div className="flex flex-col gap-6">
          {MENU_FIJO.map((cat) => (
            <div key={cat.category}>
              <h2 className="text-xl font-heading font-black text-gray-900 mb-4">{cat.category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cat.items.map((item) => (
                  <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div className="flex-1 pr-4">
                      <h3 className="font-bold text-gray-900">{item.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                      <span className="block text-md font-black text-[#3C5040] mt-2">${item.price}</span>
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
          {PROMOS.map((promo) => {
            const wppMessage = encodeURIComponent(`¡Hola! Quisiera más información sobre la ${promo.name} por $${promo.price}.`);
            return (
              <div key={promo.id} className="bg-gradient-to-tr from-[#3C5040] to-[#516b56] text-white p-6 rounded-3xl shadow-lg flex flex-col gap-4">
                <div>
                  <h3 className="text-2xl font-black">{promo.name}</h3>
                  <p className="text-white/80 mt-1 font-medium text-sm leading-relaxed">{promo.description}</p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-3xl font-black">${promo.price}</span>
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
