// Generates assets/js/env.js at build time from environment variables.
// Used by Vercel (buildCommand). All values are client-safe (public).
const fs = require('fs');
const path = require('path');

const env = {
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  ADMIN_WHATSAPP_NUMBER: process.env.ADMIN_WHATSAPP_NUMBER || '6285236314038',
};

const dir = path.join(__dirname, '..', 'assets', 'js');
fs.mkdirSync(dir, { recursive: true });
const out = `// AUTO-GENERATED at build time. Do not edit.\nwindow.__ENV__ = ${JSON.stringify(env, null, 2)};\n`;
fs.writeFileSync(path.join(dir, 'env.js'), out);

if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
  console.warn('[gen-env] WARNING: SUPABASE_URL / SUPABASE_ANON_KEY belum diset di environment Vercel.');
}
console.log('[gen-env] assets/js/env.js generated.');
