const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((a, l) => {
  const i = l.indexOf('=');
  if (i > 0) a[l.substring(0, i)] = l.substring(i + 1).trim().replace(/"/g, '');
  return a;
}, {});
const sup = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
sup.from('orders').select('*').limit(1).then(r => console.log(Object.keys(r.data[0] || {}))).catch(e => console.error(e));
