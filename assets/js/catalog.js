// Landing catalog: load categories + published catalogs from Supabase,
// render with category filtering. Falls back to static cards when Supabase
// is unavailable, errors, or returns nothing (mirrors legacy behavior).
import { supabase, catalogImageUrl } from './lib/supabaseClient.js';

const grid = document.getElementById('catalogGrid');
const filterBar = document.getElementById('catalogFilters');

// ---- static fallback (from the redesign mockup) ----
const FALLBACK_CATEGORIES = [
  { slug: 'kuliner-kafe', category_name: 'Kuliner & Kafe' },
  { slug: 'corporate-bisnis', category_name: 'Corporate & Bisnis' },
  { slug: 'minimalis-modern', category_name: 'Minimalis & Modern' },
];
const FALLBACK_ITEMS = [
  { id: 1, slug: 'kuliner-kafe', category: 'Kuliner & Kafe', name: 'Kopi Kenangan Senja', desc: 'Tipografi hangat dengan monogram retro estetik untuk kedai kopi kekinian.', letter: 'KS', markBg: 'linear-gradient(135deg,#f59e0b,#b45309)', markText: '#fff7ed', bg: 'linear-gradient(135deg,#3a2a1a,#1a130b)', radius: '50%' },
  { id: 2, slug: 'kuliner-kafe', category: 'Kuliner & Kafe', name: 'Roti Bahagia', desc: 'Bentuk membulat lembut yang ramah, ideal untuk bakery dan toko roti.', letter: 'RB', markBg: 'linear-gradient(135deg,#fb7185,#e11d48)', markText: '#fff', bg: 'linear-gradient(135deg,#3a1a24,#1a0b10)', radius: '30px' },
  { id: 3, slug: 'kuliner-kafe', category: 'Kuliner & Kafe', name: 'Teh Tarik Tariko', desc: 'Aksen daun segar dengan kesan tradisional yang dimodernkan.', letter: 'T', markBg: 'linear-gradient(135deg,#34d399,#059669)', markText: '#04241a', bg: 'linear-gradient(135deg,#10322a,#081914)', radius: '50% 50% 50% 12px' },
  { id: 4, slug: 'corporate-bisnis', category: 'Corporate & Bisnis', name: 'Apex Holding Corp', desc: 'Geometris kokoh melambangkan pertumbuhan bisnis yang stabil dan tepercaya.', letter: 'A', markBg: 'linear-gradient(135deg,#60a5fa,#2563eb)', markText: '#04132e', bg: 'linear-gradient(135deg,#13213f,#0a1020)', radius: '20px' },
  { id: 5, slug: 'corporate-bisnis', category: 'Corporate & Bisnis', name: 'Nusantara Tech', desc: 'Heksagon presisi yang mewakili teknologi dan jaringan terhubung.', letter: 'N', markBg: 'linear-gradient(135deg,#22d3ee,#0891b2)', markText: '#042b33', bg: 'linear-gradient(135deg,#0e2c33,#07161a)', radius: '24px' },
  { id: 6, slug: 'corporate-bisnis', category: 'Corporate & Bisnis', name: 'Vertex Finance', desc: 'Bentuk wajik tegas yang menyiratkan keamanan dan presisi finansial.', letter: 'V', markBg: 'linear-gradient(135deg,#818cf8,#4338ca)', markText: '#0a0a2e', bg: 'linear-gradient(135deg,#1c1c45,#0c0c22)', radius: '18px' },
  { id: 7, slug: 'minimalis-modern', category: 'Minimalis & Modern', name: 'Purely Organics', desc: 'Garis organik feminin mewah, ideal untuk kosmetik dan kecantikan.', letter: 'P', markBg: 'linear-gradient(135deg,#a3e635,#16a34a)', markText: '#0a2410', bg: 'linear-gradient(135deg,#16301a,#0a190d)', radius: '50%' },
  { id: 8, slug: 'minimalis-modern', category: 'Minimalis & Modern', name: 'Aurora Studio', desc: 'Gradien lembut serba modern untuk studio kreatif dan agensi.', letter: 'A', markBg: 'linear-gradient(135deg,#c084fc,#7c3aed)', markText: '#fff', bg: 'linear-gradient(135deg,#241338,#120a1d)', radius: '50%' },
  { id: 9, slug: 'minimalis-modern', category: 'Minimalis & Modern', name: 'Mono Architects', desc: 'Monokrom tegas dan rapi untuk firma arsitektur dan desain interior.', letter: 'M', markBg: 'linear-gradient(135deg,#e5e7eb,#9ca3af)', markText: '#1f2937', bg: 'linear-gradient(135deg,#222433,#101119)', radius: '14px' },
];

let categories = [];
let items = [];
let activeFilter = 'all';

function firstLetter(s) {
  const t = String(s || '?').trim();
  return t ? t[0].toUpperCase() : '?';
}

// Build one catalog card with safe DOM APIs (no innerHTML with data).
function makeCard(item) {
  const card = document.createElement('div');
  card.className = 'glass catalog-card';
  card.dataset.category = item.slug || 'all';

  const thumb = document.createElement('div');
  thumb.className = 'catalog-thumb';
  if (item.bg) thumb.style.background = item.bg;

  if (item.image_url) {
    const img = document.createElement('img');
    img.src = item.image_url;
    img.alt = item.name;
    img.loading = 'lazy';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    thumb.appendChild(img);
  } else {
    const mark = document.createElement('div');
    mark.className = 'catalog-mark';
    mark.textContent = item.letter || firstLetter(item.name);
    if (item.markBg) mark.style.background = item.markBg;
    if (item.markText) mark.style.color = item.markText;
    if (item.radius) mark.style.borderRadius = item.radius;
    thumb.appendChild(mark);
  }

  const body = document.createElement('div');
  body.className = 'body';

  const badge = document.createElement('span');
  badge.className = 'item-badge';
  badge.textContent = item.category || 'Umum';

  const h3 = document.createElement('h3');
  h3.textContent = item.name;

  const desc = document.createElement('p');
  desc.className = 'desc';
  desc.textContent = item.desc || '';

  const link = document.createElement('a');
  link.className = 'btn-use';
  link.href = `brief.html?ref=${encodeURIComponent(item.id)}`;
  link.textContent = 'Gunakan Gaya Ini →';

  body.append(badge, h3, desc, link);
  card.append(thumb, body);
  return card;
}

function renderFilters() {
  filterBar.replaceChildren();
  const all = [{ slug: 'all', category_name: 'Semua Kategori' }, ...categories];
  all.forEach((cat) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'filter-btn' + (cat.slug === activeFilter ? ' active' : '');
    btn.textContent = cat.category_name;
    btn.setAttribute('aria-pressed', String(cat.slug === activeFilter));
    btn.addEventListener('click', () => {
      activeFilter = cat.slug;
      for (const b of filterBar.children) {
        const on = b === btn;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', String(on));
      }
      renderGrid();
    });
    filterBar.appendChild(btn);
  });
}

function renderGrid() {
  const visible = items.filter((it) => activeFilter === 'all' || it.slug === activeFilter);
  grid.replaceChildren();
  if (!visible.length) {
    const empty = document.createElement('p');
    empty.className = 'desc';
    empty.style.textAlign = 'center';
    empty.textContent = 'Belum ada katalog pada kategori ini.';
    grid.appendChild(empty);
    return;
  }
  visible.forEach((it) => grid.appendChild(makeCard(it)));
}

function useFallback() {
  categories = FALLBACK_CATEGORIES;
  items = FALLBACK_ITEMS;
  renderFilters();
  renderGrid();
}

async function loadFromSupabase() {
  // categories
  const { data: cats, error: catErr } = await supabase
    .from('categories').select('id, category_name, slug').order('category_name');
  if (catErr) throw catErr;

  // catalogs joined to category
  const { data: rows, error: catalogErr } = await supabase
    .from('catalogs')
    .select('id, title, description, image_path, category_id, is_published, categories(category_name, slug)')
    .eq('is_published', true)
    .order('sort_order', { ascending: true });
  if (catalogErr) throw catalogErr;

  if (!rows || rows.length === 0) {
    useFallback();
    return;
  }

  categories = cats || [];
  items = rows.map((r) => ({
    id: r.id,
    name: r.title,
    desc: r.description || '',
    slug: r.categories?.slug || 'all',
    category: r.categories?.category_name || 'Umum',
    image_url: catalogImageUrl(r.image_path),
    letter: firstLetter(r.title),
    markBg: 'var(--grad)',
    markText: '#0a0816',
    bg: 'linear-gradient(135deg,#241338,#120a1d)',
    radius: '24px',
  }));
  renderFilters();
  renderGrid();
}

async function init() {
  if (!grid || !filterBar) return;
  if (!supabase) { useFallback(); return; }
  try {
    await loadFromSupabase();
  } catch (err) {
    console.warn('[catalog] gagal memuat dari Supabase, memakai fallback:', err?.message);
    useFallback();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
