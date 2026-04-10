const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((a, l) => {
  const i = l.indexOf('=');
  if (i > 0) a[l.substring(0, i)] = l.substring(i + 1).trim().replace(/"/g, '');
  return a;
}, {});
const sup = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
sup.from('vitalfood_fixed_items').select('*').then(r => console.log('FIXED:', r.data)).catch(e => console.error(e));
sup.from('vitalfood_daily_menus').select('*').then(r => console.log('MENUS:', r.data)).catch(e => console.error(e));
