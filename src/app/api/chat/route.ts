import Groq from 'groq-sdk';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper: EXPLICIT plan request - needs cards UI
function isMultiPlanRequest(msg: string): boolean {
  const lower = msg.toLowerCase();
  return /(\d+\s*(productos?|d[ií]as?|cenas?|almuerzos?))|(arm[aá]me\s+(un\s+)?plan|men[uú]\s+(para|de)|plan\s+(semanal|para|de)|agreg[aá](me)?\s+(productos?|al\s+carrito)|para\s+toda\s+la\s+semana)/.test(lower);
}

// Helper: recipe/ingredients mode
function isRecipeMode(msg: string): boolean {
  const lower = msg.toLowerCase();
  return /tengo\s+\w|me\s+sobr[oó]|qu[eé]\s+hago\s+con|tengo\s+en\s+casa|con\s+lo\s+que\s+tengo/.test(lower);
}

// Helper: general exploratory query
function isGeneralQuery(msg: string): boolean {
  const lower = msg.toLowerCase();
  return /(qu[eé]\s+(me\s+)?recomend[aá]s?|qu[eé]\s+productos?|qu[eé]\s+tienen|qu[eé]\s+es\s+bueno|qu[eé]\s+(comer|como)\s+para|qu[eé]\s+hay|me\s+recomend[aá]s?)/.test(lower);
}

function buildSystemPrompt(products: any[], userData?: any): string {
  const objective = userData?.objective || 'equilibrada';
  const metabolism = userData?.metabolism || 'normal';
  const name = userData?.first_name || 'usuario';

  // Group products by category
  const byCategory: Record<string, any[]> = {};
  products.forEach(p => {
    if (!byCategory[p.category]) byCategory[p.category] = [];
    byCategory[p.category].push(p);
  });

  // Build catalog string with plain ASCII separators
  const catalogLines: string[] = [];
  Object.entries(byCategory).forEach(([cat, prods]) => {
    catalogLines.push('[' + cat + ']');
    prods.forEach(p => catalogLines.push('  ' + p.name + ' | ID=' + p.id + ' | $' + p.price));
  });
  const catalogStr = catalogLines.join('\n');

  // Build a real example from actual product IDs
  const exampleIds = Object.values(byCategory)
    .map(prods => prods[0]?.id)
    .filter(Boolean)
    .slice(0, 3)
    .map(id => id + ',1')
    .join(';');

  const lines = [
    'Sos Nutri AI de Favorit. Hablas con ' + name + ' (objetivo: ' + objective + ', metabolismo: ' + metabolism + ').',
    '',
    '--- CATALOGO REAL DE FAVORIT (usar SOLO estos IDs) ---',
    catalogStr,
    '',
    '--- REGLAS DE RESPUESTA ---',
    '',
    'MODO A - PLAN EXPLICITO (usuario pide cantidad concreta, "armame un plan", "para la semana", "agregame X productos"):',
    '1. UNA oracion de intro (max 8 palabras).',
    '2. Siguiente linea: tag con IDs REALES del catalogo:',
    '   [RECOMMEND_MULTI: ID1,1;ID2,1;ID3,1]',
    '3. NADA mas despues del tag. Sin consejos ni parrafos.',
    '4. Productos de DISTINTAS categorias. NUNCA repetir.',
    '',
    'EJEMPLO CORRECTO:',
    'Tu plan variado de Favorit:',
    '[RECOMMEND_MULTI: ' + exampleIds + ']',
    '',
    'MODO B - CONSULTA GENERAL (usuario pregunta "que recomiendas", "que tienen", "que es bueno para X" sin pedir cantidad):',
    '- Respuesta conversacional corta. Max 3-4 oraciones.',
    '- Menciona 2-3 productos de Favorit por NOMBRE (sin UUID, sin tags).',
    '- Terminar con: "Queres que te arme un plan con estos productos?"',
    '- SIN tags [RECOMMEND...]. Solo texto.',
    '',
    'MODO C - SUGERENCIA PUNTUAL (1 producto especifico):',
    '- 1-2 oraciones. Luego: [RECOMMEND: ID_REAL]',
    '',
    'MODO D - USUARIO TIENE INGREDIENTES ("tengo X", "me sobro X"):',
    '- Ayudarlo a cocinar. Sin tags. Max 5 oraciones.',
    '- Al final: "Si algun dia no tenes tiempo, Favorit tiene opciones listas ;)"',
    '',
    'MODO E - PREGUNTA NUTRICIONAL PURA:',
    '- Max 3 oraciones. Sin tags.',
    '',
    'REGLA CRITICA: Los IDs DEBEN ser exactamente los del catalogo de arriba. NUNCA inventar IDs.',
  ];

  return lines.join('\n');
}

export async function POST(req: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY no esta definida en .env.local');
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: dbProducts } = await supabase.from('products').select('id, name, category, price');
    const products = dbProducts || [];

    const body = await req.json();
    const { message, history, user } = body;

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const groqMessages = [
      { role: 'system', content: buildSystemPrompt(products, user) },
      ...(history || []).map((msg: any) => ({
        role: msg.role === 'model' || msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content || (msg.parts?.[0]?.text) || '',
      })),
      { role: 'user', content: message },
    ];

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 800,
      temperature: 0.3,
      messages: groqMessages as any,
    });

    const rawText = completion.choices[0]?.message?.content || '';
    console.log('[Nutri AI] Raw response:', rawText.substring(0, 300));

    // --- Parser 1: RECOMMEND_MULTI ---
    const multiMatch = rawText.match(/\[RECOMMEND_MULTI:\s*([^\]]+)\]/);
    if (multiMatch) {
      const recommendedProducts = multiMatch[1]
        .split(';')
        .map(entry => {
          const parts = entry.trim().split(',');
          return { id: parts[0]?.trim(), quantity: parseInt(parts[1]?.trim() || '1', 10) || 1 };
        })
        .filter(p => p.id && products.some(prod => prod.id === p.id));

      if (recommendedProducts.length > 0) {
        const introText = rawText.replace(multiMatch[0], '').trim();
        console.log('[Nutri AI] Multi plan detected:', recommendedProducts.length, 'products');
        return NextResponse.json({ text: introText, recommendedProducts, type: 'multi' });
      }
    }

    // --- Fallback: explicit plan request but LLM didn't output valid tag ---
    if (isMultiPlanRequest(message) && !isRecipeMode(message) && !isGeneralQuery(message)) {
      console.log('[Nutri AI] Fallback: building plan from catalog');

      const byCategory: Record<string, any[]> = {};
      products.forEach(p => {
        if (!byCategory[p.category]) byCategory[p.category] = [];
        byCategory[p.category].push(p);
      });

      const numMatch = message.match(/(\d+)\s*(productos|d[ií]as|cenas)/);
      const numProducts = Math.min(Math.max(parseInt(numMatch?.[1] || '5'), 2), Object.keys(byCategory).length);
      const selected: { id: string; quantity: number }[] = [];

      Object.keys(byCategory).slice(0, numProducts).forEach(cat => {
        const first = byCategory[cat][0];
        if (first) selected.push({ id: first.id, quantity: 1 });
      });

      if (selected.length > 0) {
        const introText = rawText.length > 10 ? rawText : 'Aqui tu plan personalizado de Favorit:';
        return NextResponse.json({ text: introText, recommendedProducts: selected, type: 'multi' });
      }
    }

    // --- Parser 2: RECOMMEND_SWAP ---
    const swapMatch = rawText.match(/\[RECOMMEND_SWAP:\s*([^\]]+)\]/);
    if (swapMatch) {
      const parts = swapMatch[1].trim().split(',');
      const swapId = parts[0]?.trim();
      if (swapId && products.some(p => p.id === swapId)) {
        const swapProduct = { id: swapId, quantity: parseInt(parts[1]?.trim() || '1', 10) || 1 };
        return NextResponse.json({ text: rawText.replace(swapMatch[0], '').trim(), swapProduct, type: 'swap' });
      }
    }

    // --- Parser 3: RECOMMEND single ---
    const singleMatch = rawText.match(/\[RECOMMEND:\s*([^\]]+)\]/);
    if (singleMatch) {
      const productId = singleMatch[1].trim();
      if (products.some(p => p.id === productId)) {
        return NextResponse.json({ text: rawText.replace(singleMatch[0], '').trim(), recommendedProductId: productId, type: 'single' });
      }
    }

    return NextResponse.json({ text: rawText, type: 'text' });

  } catch (error: any) {
    console.error('[Nutri AI] ERROR:', error?.message || error);
    return NextResponse.json({ error: 'El asistente no esta disponible. Intenta de nuevo.' }, { status: 500 });
  }
}
