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
  { id: 1, slug: 'minimalis-modern', category: 'Minimalis & Modern', name: 'Creative Agency', desc: 'Monogram dinamis hitam-putih yang elegan, pas untuk agensi kreatif & studio.', image_url: 'assets/img/catalog/creative-agency.png' },
  { id: 2, slug: 'kuliner-kafe', category: 'Kuliner & Kafe', name: 'Mo Drink', desc: 'Ikon gelas minuman modern, cocok untuk kedai minuman dan coffee shop kekinian.', image_url: 'assets/img/catalog/mo-drink.png' },
  { id: 3, slug: 'corporate-bisnis', category: 'Corporate & Bisnis', name: 'Fauget Fishing Club', desc: 'Maskot ikan dinamis yang energik untuk komunitas, klub, atau brand outdoor.', image_url: 'assets/img/catalog/fauget-fishing.png' },
  { id: 4, slug: 'corporate-bisnis', category: 'Corporate & Bisnis', name: 'Bailey Dupont Perumahan', desc: 'Kombinasi atap dan daun yang asri, ideal untuk properti dan perumahan hijau.', image_url: 'assets/img/catalog/bailey-dupont.png' },
  { id: 5, slug: 'minimalis-modern', category: 'Minimalis & Modern', name: 'Global Design Studio', desc: 'Wordmark tebal dengan ikon globe, tegas untuk studio kreatif dan korporasi.', image_url: 'assets/img/catalog/global-studio.png' },
  { id: 6, slug: 'minimalis-modern', category: 'Minimalis & Modern', name: 'Venture', desc: 'Lettermark biru yang bersih dan modern, cocok untuk startup dan brand teknologi.', image_url: 'assets/img/catalog/venture.png' },
  { id: 7, slug: 'corporate-bisnis', category: 'Corporate & Bisnis', name: 'Bengkel Cak Mat', desc: 'Gir mesin tegas merah-biru untuk bengkel dan jasa otomotif.', image_url: 'assets/img/catalog/bengkel-cak-mat.png' },
  { id: 8, slug: 'corporate-bisnis', category: 'Corporate & Bisnis', name: 'Atma', desc: 'Ikon gedung minimalis navy-oranye untuk perusahaan dan konstruksi.', image_url: 'assets/img/catalog/atma.png' },
  { id: 9, slug: 'minimalis-modern', category: 'Minimalis & Modern', name: 'Creative Technology', desc: 'Garis spirograf artistik untuk brand teknologi dan inovasi.', image_url: 'assets/img/catalog/creative-technology.png' },
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
    thumb.style.height = 'auto';
    const img = document.createElement('img');
    img.src = item.image_url;
    img.alt = `Logo ${item.name}`;
    img.loading = 'lazy';
    img.style.width = '100%';
    img.style.aspectRatio = '1 / 1';
    img.style.objectFit = 'cover';
    img.style.display = 'block';
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
