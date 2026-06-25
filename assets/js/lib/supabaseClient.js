// Browser Supabase client (ANON key only — RLS enforces access).
// Loaded as an ES module from a CDN so no build step is required.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const env = (typeof window !== 'undefined' && window.__ENV__) || {};

export const SUPABASE_URL = env.SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY || '';
export const ADMIN_WHATSAPP_NUMBER = env.ADMIN_WHATSAPP_NUMBER || '6285236314038';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[LogoKu] SUPABASE_URL / SUPABASE_ANON_KEY belum diset (window.__ENV__). Mode fallback aktif.');
}

export const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

/** Build a public URL for an object in the catalog-images bucket. */
export function catalogImageUrl(imagePath) {
  if (!imagePath) return null;
  if (/^https?:\/\//.test(imagePath)) return imagePath;
  if (!supabase) return null;
  const { data } = supabase.storage.from('catalog-images').getPublicUrl(imagePath);
  return data?.publicUrl || null;
}
