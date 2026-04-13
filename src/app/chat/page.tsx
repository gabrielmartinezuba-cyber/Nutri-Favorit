'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, Lock, Sparkles, ChevronRight, ShoppingCart, Check, RefreshCw } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// ─── Types ─────────────────────────────────────────────────────────────────
type RecommendedProduct = { id: string; quantity: number };

type Message = {
  role: 'user' | 'model';
  content: string;
  type?: 'text' | 'single' | 'multi' | 'swap';
  recommendedProductId?: string | null;
  recommendedProducts?: RecommendedProduct[] | null;
};

// ─── Plan Card (Multi-Product — self-contained swap logic) ──────────────────
function PlanCard({
  intro,
  initialRecommendations,
  allProducts,
  user,
  router,
  userProfile,
}: {
  intro: string;
  initialRecommendations: RecommendedProduct[];
  allProducts: any[];
  user: any;
  router: any;
  userProfile: any;
}) {
  const { addItem, updateQuantity } = useCartStore();
  const [addedAll, setAddedAll] = useState(false);

  // Local mutable copy of the plan — allows in-place swapping
  const [planItems, setPlanItems] = useState<RecommendedProduct[]>(initialRecommendations);
  // Track which product id is currently being swapped (shows spinner)
  const [swappingId, setSwappingId] = useState<string | null>(null);

  const resolvedProducts = planItems
    .map(r => {
      const prod = allProducts.find((p: any) => p.id === r.id);
      return prod ? { ...prod, recommendedQty: r.quantity } : null;
    })
    .filter(Boolean) as any[];

  if (resolvedProducts.length === 0) return null;

  const totalPrice = resolvedProducts.reduce(
    (sum: number, p: any) => sum + (p.price * p.recommendedQty), 0
  );

  const handleAddAll = () => {
    if (!user) { router.push('/login'); return; }
    resolvedProducts.forEach((prod: any) => {
      addItem(prod);
      if (prod.recommendedQty > 1) updateQuantity(prod.id, prod.recommendedQty);
    });
    setAddedAll(true);
  };

  // Silent swap: calls the API in the background, updates planItems in-place
  const handleSwapSilent = async (productId: string, productName: string, category: string) => {
    if (swappingId) return; // prevent concurrent swaps
    setSwappingId(productId);

    try {
      // Build context: tell the AI which product to replace and what's already in the plan
      const currentIds = planItems.map(p => p.id).join(', ');
      const swapPrompt = `Necesito que cambies el producto "${productName}" (categoría: ${category}) por UN producto alternativo diferente del catálogo. 
      IMPORTANTE: No uses ninguno de estos IDs ya presentes en el plan: ${currentIds}.
      Respondé SOLO con [RECOMMEND_SWAP: uuid,cantidad]. Sin texto adicional.`;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: swapPrompt,
          history: [], // silent call, no history context needed
          user: {
            first_name: userProfile?.first_name,
            metabolism: userProfile?.metabolism,
            objective: userProfile?.objective,
          }
        })
      });

      const data = await res.json();

      // API returns swapProduct: { id, quantity }
      const newProduct = data.swapProduct;
      if (newProduct?.id && newProduct.id !== productId) {
        setPlanItems(prev =>
          prev.map(item => item.id === productId ? newProduct : item)
        );
      }
    } catch (err) {
      console.error('[PlanCard] Silent swap failed:', err);
    } finally {
      setSwappingId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 w-[92%] rounded-2xl overflow-hidden border border-brand-mostaza/20 bg-white shadow-sm"
    >
      {/* Intro line */}
      {intro && (
        <div className="px-4 pt-3 pb-1">
          <p className="text-sm font-semibold text-gray-700">{intro}</p>
        </div>
      )}

      {/* Products */}
      <div className="flex flex-col divide-y divide-gray-100">
        <AnimatePresence mode="wait">
          {resolvedProducts.map((prod: any) => {
            const isSwapping = swappingId === prod.id;
            return (
              <motion.div
                key={prod.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.2 }}
                className={`flex items-center gap-3 px-3 py-3 transition-opacity ${isSwapping ? 'opacity-40 pointer-events-none' : ''}`}
              >
                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-xl flex-shrink-0 bg-gradient-to-br from-brand-mostaza/15 to-brand-verde/15 overflow-hidden relative">
                  {prod.image_urls?.[0] ? (
                    <img src={prod.image_urls[0]} alt={prod.name} className="w-full h-full object-cover" />
                  ) : null}
                  {/* Spinner overlay while swapping */}
                  {isSwapping && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                      <Loader2 className="w-5 h-5 text-brand-verde animate-spin" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-brand-verde uppercase tracking-wider leading-none mb-0.5">
                    {prod.category}
                  </p>
                  <p className="text-sm font-semibold text-gray-800 leading-tight truncate pr-1">
                    {prod.name}
                  </p>
                  <p className="text-sm font-bold text-brand-borravino mt-0.5">
                    ${(prod.price * prod.recommendedQty).toLocaleString('es-AR')}
                  </p>
                </div>

                {/* Swap button */}
                <button
                  onClick={() => handleSwapSilent(prod.id, prod.name, prod.category)}
                  disabled={!!swappingId}
                  className="flex-shrink-0 flex items-center gap-1 text-[10px] font-black text-gray-400 hover:text-brand-borravino border border-gray-200 hover:border-brand-borravino/40 px-2.5 py-1.5 rounded-full transition-colors uppercase tracking-wider disabled:opacity-30"
                >
                  {isSwapping
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <RefreshCw className="w-3 h-3" />
                  }
                  {isSwapping ? '...' : 'Cambiar'}
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer CTA */}
      <div className="px-4 pb-4 pt-3 flex items-center justify-between gap-3 border-t border-gray-100">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">Total plan</p>
          <motion.p
            key={totalPrice}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-lg font-black text-brand-borravino font-heading"
          >
            ${totalPrice.toLocaleString('es-AR')}
          </motion.p>
        </div>
        <button
          onClick={handleAddAll}
          disabled={addedAll || !!swappingId}
          className={`flex items-center gap-2 font-black text-xs px-5 py-3 rounded-xl transition-all active:scale-95 shadow-md uppercase tracking-wider
            ${addedAll
              ? 'bg-brand-verde text-white'
              : 'bg-brand-mostaza text-brand-borravino hover:brightness-110 disabled:opacity-50'
            }`}
        >
          {addedAll
            ? <><Check className="w-4 h-4" /> Agregado</>
            : <><ShoppingCart className="w-4 h-4" /> Agregar todo</>
          }
        </button>
      </div>
    </motion.div>
  );
}

// ─── Single Product Card ─────────────────────────────────────────────────────
function SingleCard({ productId, products, user, router }: {
  productId: string; products: any[]; user: any; router: any;
}) {
  const { addItem } = useCartStore();
  const [added, setAdded] = useState(false);
  const prod = products.find((p: any) => p.id === productId);
  if (!prod) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 w-[85%] bg-white border border-brand-mostaza/30 rounded-2xl p-3 flex items-center gap-3 shadow-sm"
    >
      <div className="w-14 h-14 rounded-xl flex-shrink-0 bg-gradient-to-br from-brand-mostaza/15 to-brand-verde/15 overflow-hidden">
        {prod.image_urls?.[0] && <img src={prod.image_urls[0]} alt={prod.name} className="w-full h-full object-cover" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black text-brand-verde uppercase tracking-wider">{prod.category}</p>
        <p className="text-sm font-semibold text-gray-800 truncate">{prod.name}</p>
        <p className="text-sm font-bold text-brand-borravino">${prod.price?.toLocaleString('es-AR')}</p>
      </div>
      <button
        onClick={() => { if (!user) { router.push('/login'); return; } addItem(prod); setAdded(true); }}
        disabled={added}
        className={`flex-shrink-0 flex items-center gap-1.5 font-black text-xs px-3 py-2 rounded-xl transition-all active:scale-95 uppercase tracking-wider
          ${added ? 'bg-brand-verde text-white' : 'bg-brand-mostaza text-brand-borravino'}`}
      >
        {added ? <Check className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5" />}
        {added ? 'Listo' : 'Agregar'}
      </button>
    </motion.div>
  );
}

// ─── Main Chat Page ──────────────────────────────────────────────────────────
export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: '¡Hola! Soy Nutri AI de Favorit. ¿Cuáles son tus objetivos o querés un plan de varios días?', type: 'text' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const user = useAuthStore(state => state.user);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.from('products').select('*').then(({ data }) => setProducts(data || []));
  }, []);

  useEffect(() => {
    // Only scroll to bottom if there's more than the initial message
    if (messages.length > 1 || isLoading) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    if (!user) { router.push('/login'); return; }
    if (!text.trim() || isLoading) return;

    const userMsg = text.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg, type: 'text' }]);
    setIsLoading(true);

    try {
      const history = messages.slice(1).map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history,
          user: { first_name: user.first_name, metabolism: user.metabolism, objective: user.objective }
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessages(prev => [...prev, {
        role: 'model',
        content: data.text || '',
        type: data.type || 'text',
        recommendedProducts: data.recommendedProducts || null,
        recommendedProductId: data.recommendedProductId || null,
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'model',
        content: `Error al procesar: ${err.message || 'Error desconocido'}`,
        type: 'text'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const isOnboardingComplete = user?.metabolism && user?.objective;

  if (user && !isOnboardingComplete) {
    return (
      <div className="min-h-[calc(100vh-160px)] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[40px] p-8 shadow-2xl border border-gray-100 flex flex-col items-center text-center max-w-sm relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-mostaza/10 rounded-full blur-2xl -mr-10 -mt-10" />
          <div className="w-20 h-20 bg-brand-borravino/5 rounded-3xl flex items-center justify-center mb-6">
            <Lock className="w-10 h-10 text-brand-borravino opacity-80" />
          </div>
          <h2 className="text-2xl font-heading font-black text-gray-900 leading-tight">AI Guard Activo</h2>
          <p className="text-sm text-gray-500 font-medium mt-3 leading-relaxed">
            Para que <span className="text-brand-borravino font-bold">Nutri AI</span> sea precisa, necesitamos conocer tu metabolismo y objetivos.
          </p>
          <div className="mt-8 w-full">
            <Link href="/perfil" className="w-full bg-brand-mostaza text-brand-borravino font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
              Completar Datos <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
          <div className="mt-6 flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <Sparkles className="w-3 h-3 text-brand-mostaza" /> Inteligencia Vital Food
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pb-32 pt-4 flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full glass flex items-center justify-center bg-brand-verde/10">
          <Bot className="w-6 h-6 text-brand-verde" />
        </div>
        <div>
          <h1 className="text-xl font-heading font-black text-brand-mostaza leading-tight">Nutri AI</h1>
          <p className="text-sm text-gray-500 font-medium tracking-tight">Especialista Favorit</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-4 flex flex-col gap-4 scrollbar-none pr-1">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>

            {/* MULTI PLAN: self-contained card with silent swap */}
            {msg.role === 'model' && msg.type === 'multi' && msg.recommendedProducts ? (
              <PlanCard
                intro={msg.content}
                initialRecommendations={msg.recommendedProducts}
                allProducts={products}
                user={user}
                router={router}
                userProfile={user}
              />
            ) : (
              /* TEXT or SINGLE */
              <>
                {msg.content && (
                  <div className={`max-w-[85%] p-4 rounded-3xl text-[15px] font-medium leading-relaxed
                    ${msg.role === 'user'
                      ? 'bg-brand-verde text-white rounded-br-sm shadow-md'
                      : 'glass border border-white/40 text-foreground rounded-bl-sm shadow-[0_4px_20px_rgba(0,0,0,0.03)]'
                    }`}
                  >
                    {msg.content}
                  </div>
                )}
                {msg.type === 'single' && msg.recommendedProductId && (
                  <SingleCard productId={msg.recommendedProductId} products={products} user={user} router={router} />
                )}
              </>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start">
            <div className="glass p-4 rounded-3xl rounded-bl-sm">
              <Loader2 className="w-5 h-5 text-brand-verde animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-24 inset-x-0 mx-auto max-w-2xl z-40 px-4">
        {!user ? (
          <button onClick={() => router.push('/login')}
            className="w-full glass border-2 border-brand-mostaza/30 bg-white/40 rounded-full py-4 px-6 flex items-center justify-between shadow-xl"
          >
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-brand-borravino opacity-60" />
              <span className="text-sm font-bold text-gray-600">Iniciá sesión para chatear</span>
            </div>
            <div className="bg-brand-borravino text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest">
              Ingresar
            </div>
          </button>
        ) : (
          <div className="glass rounded-full border border-white/60 shadow-lg flex items-center p-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
              placeholder="Ej: armame un plan de 5 días..."
              className="flex-1 bg-transparent px-4 py-2 text-sm font-medium focus:outline-none placeholder-gray-400"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 rounded-full bg-brand-verde text-white flex items-center justify-center disabled:opacity-50 transition-opacity flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
