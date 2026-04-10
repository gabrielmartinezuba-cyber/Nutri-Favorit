const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seed() {
  const items = [
    { name: 'Sorrentinos de Jamón y Queso', description: 'Con salsa bolognesa', price: 7500, category: 'Pastas', is_active: true },
    { name: 'Ravioles de Verdura', description: 'Con salsa bolognesa', price: 7500, category: 'Pastas', is_active: true },
    { name: 'Tallarines', description: 'Con salsa bolognesa', price: 7500, category: 'Pastas', is_active: true },
    { name: 'Ensalada Opción 1', description: 'Arroz integral, atún, zanahoria, huevo, tomate, pepino. Dip: Alioli de zanahoria', price: 7500, category: 'Ensaladas', is_active: true },
    { name: 'Ensalada Opción 2', description: 'Fideos integrales, pollo, choclo, repollo, lechuga, frutos secos. Dip: Alioli de palta', price: 7500, category: 'Ensaladas', is_active: true },
    { name: 'Ensalada Opción 3', description: 'Quinoa, lentejas, pollo, huevo, tomate, palmitos, aceitunas, perejil. Dip: Alioli de ajo', price: 7500, category: 'Ensaladas', is_active: true },
    { name: 'Ensalada Opción 4', description: 'Cesar con aderezo cesar', price: 7500, category: 'Ensaladas', is_active: true }
  ];

  for (const item of items) {
    const { error } = await supabase.from('vitalfood_fixed_items').insert(item);
    if (error) console.log(error);
  }
  console.log('Seeded successfully!');
}

seed();
