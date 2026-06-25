// LogoKu — Admin dashboard controller.
// Renders orders, stats, customers and settings using safe DOM building
// (no innerHTML with data). All access is RLS-gated via supabase-js.
import {
  getAdminSession, listOrders, createManualOrder, updateOrder, deleteOrder,
  validateAmounts, PROGRESS, PAYMENT,
} from './lib/admin.js';
import { supabase } from './lib/supabaseClient.js';
import { buildWaConsult } from './lib/wa.js';

/* ---------------------------------------------------------------- maps */
const PROGRESS_PILL = {
  'Antrean': 'pill--slate', 'Proses Sketsa': 'pill--violet',
  'Digitalisasi': 'pill--blue', 'Revisi': 'pill--amber', 'Selesai': 'pill--green',
};
const PAYMENT_PILL = {
  'Belum Lunas': 'pill--red', 'DP': 'pill--amber', 'Lunas': 'pill--green',
};
const PROGRESS_BAR = {
  'Antrean': 'breakdown-fill--slate', 'Proses Sketsa': 'breakdown-fill--violet',
  'Digitalisasi': 'breakdown-fill--blue', 'Revisi': 'breakdown-fill--amber',
  'Selesai': 'breakdown-fill--green',
};
const IN_PROGRESS = ['Proses Sketsa', 'Digitalisasi', 'Revisi'];

const VIEW_META = {
  ringkasan: { title: 'Ringkasan', subtitle: 'Pantau performa pesanan secara sekilas.' },
  pesanan: { title: 'Pesanan', subtitle: 'Kelola seluruh pesanan yang masuk.' },
  pelanggan: { title: 'Pelanggan', subtitle: 'Daftar pelanggan dari pesanan yang tercatat.' },
  pengaturan: { title: 'Pengaturan', subtitle: 'Perbarui profil admin Anda.' },
};

const AMOUNT_ERRORS = {
  amount_invalid: 'Nominal tidak valid.',
  amount_negative: 'Nominal tidak boleh negatif.',
  dp_exceeds_total: 'DP tidak boleh melebihi total.',
};

/* ---------------------------------------------------------------- state */
const state = {
  orders: [],
  view: 'ringkasan',
  filter: 'Semua',
  editingId: null,
  userId: null,
  email: '',
  lastFocused: null,
};

/* ---------------------------------------------------------------- dom utils */
const $ = (id) => document.getElementById(id);

function el(tag, opts = {}, children = []) {
  const node = document.createElement(tag);
  if (opts.class) node.className = opts.class;
  if (opts.text != null) node.textContent = opts.text;
  if (opts.attrs) for (const [k, v] of Object.entries(opts.attrs)) node.setAttribute(k, String(v));
  if (opts.on) for (const [k, v] of Object.entries(opts.on)) node.addEventListener(k, v);
  for (const c of children) if (c) node.appendChild(c);
  return node;
}

function rupiah(n) {
  const num = Number(n || 0);
  return 'Rp ' + (Number.isFinite(num) ? num : 0).toLocaleString('id-ID');
}

function initialOf(name) {
  const s = String(name || '').trim();
  return s ? s[0].toUpperCase() : '?';
}

/* ---------------------------------------------------------------- toast / notice */
let toastTimer = null;
function showToast(msg) {
  const t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

function showNotice(msg) {
  const n = $('dash-notice');
  if (!n) return;
  n.textContent = msg;
  n.hidden = false;
}
function hideNotice() {
  const n = $('dash-notice');
  if (n) n.hidden = true;
}

/* ---------------------------------------------------------------- bootstrap */
async function init() {
  bindStaticHandlers();
  populateSelects();
  buildFilterChips();

  if (!supabase) {
    showNotice('Supabase belum dikonfigurasi. Setel SUPABASE_URL dan SUPABASE_ANON_KEY pada assets/js/env.js untuk memuat data.');
    const add = $('add-order-btn');
    if (add) add.disabled = true;
    return;
  }

  let s = null;
  try {
    s = await getAdminSession();
  } catch (err) {
    console.error('[dashboard] getAdminSession gagal', err);
  }

  if (!s) {
    // A raw session may exist without admin approval — show pending message then sign out.
    let raw = null;
    try { raw = (await supabase.auth.getSession()).data.session; } catch { /* ignore */ }
    if (raw) {
      showNotice('Akun Anda sedang menunggu persetujuan admin. Anda akan diarahkan ke halaman masuk.');
      try { await supabase.auth.signOut(); } catch { /* ignore */ }
      setTimeout(() => location.replace('login.html'), 2800);
      return;
    }
    location.replace('login.html');
    return;
  }

  state.userId = s.session.user.id;
  state.email = s.session.user.email || '';
  renderProfile(s.profile, state.email);

  await refresh();
}

function renderProfile(profile, email) {
  const name = (profile && profile.full_name) || 'Admin';
  $('profile-name').textContent = name;
  $('profile-email').textContent = email || '—';
  $('profile-initial').textContent = initialOf(name);
  // settings form defaults
  $('set-nama').value = name;
  $('set-email').value = email || '';
}

/* ---------------------------------------------------------------- data refresh */
async function refresh() {
  try {
    state.orders = await listOrders();
    hideNotice();
  } catch (err) {
    console.error('[dashboard] listOrders gagal', err);
    showNotice('Gagal memuat data pesanan. Periksa koneksi atau konfigurasi Supabase.');
    state.orders = [];
  }
  renderCurrentView();
}

function custName(o) { return (o.customers && o.customers.full_name) || 'Tanpa Nama'; }
function custWa(o) { return (o.customers && o.customers.whatsapp_number) || ''; }

/* ---------------------------------------------------------------- view switch */
function setView(view) {
  state.view = view;
  for (const btn of document.querySelectorAll('.nav-item')) {
    const active = btn.dataset.view === view;
    btn.classList.toggle('active', active);
    if (active) btn.setAttribute('aria-current', 'page');
    else btn.removeAttribute('aria-current');
  }
  for (const sec of document.querySelectorAll('.dash-view')) {
    sec.hidden = sec.id !== `view-${view}`;
  }
  const meta = VIEW_META[view];
  if (meta) {
    $('view-title').textContent = meta.title;
    $('view-subtitle').textContent = meta.subtitle;
  }
  renderCurrentView();
}

function renderCurrentView() {
  switch (state.view) {
    case 'ringkasan': renderRingkasan(); break;
    case 'pesanan': renderPesanan(); break;
    case 'pelanggan': renderPelanggan(); break;
    case 'pengaturan': /* form already populated */ break;
  }
}

/* ---------------------------------------------------------------- ringkasan */
function computeStats() {
  const o = state.orders;
  return {
    total: o.length,
    inProgress: o.filter((x) => IN_PROGRESS.includes(x.progress_status)).length,
    done: o.filter((x) => x.progress_status === 'Selesai').length,
    unpaid: o.filter((x) => x.payment_status === 'Belum Lunas').length,
  };
}

function statCard(label, value, icon, iconClass) {
  return el('div', { class: 'stat-card' }, [
    el('div', { class: 'stat-card-head' }, [
      el('span', { class: 'stat-label', text: label }),
      el('span', { class: `stat-icon ${iconClass}`, text: icon, attrs: { 'aria-hidden': 'true' } }),
    ]),
    el('div', { class: 'stat-value', text: String(value) }),
  ]);
}

function renderRingkasan() {
  const stats = computeStats();
  const grid = $('stat-grid');
  grid.replaceChildren(
    statCard('Total Pesanan', stats.total, '🗂', 'stat-icon--violet'),
    statCard('Dalam Proses', stats.inProgress, '⏳', 'stat-icon--blue'),
    statCard('Selesai', stats.done, '✓', 'stat-icon--green'),
    statCard('Belum Lunas', stats.unpaid, '💸', 'stat-icon--red'),
  );

  // breakdown bars
  const counts = {};
  for (const p of PROGRESS) counts[p] = 0;
  for (const o of state.orders) {
    if (counts[o.progress_status] != null) counts[o.progress_status] += 1;
  }
  const max = Math.max(1, ...Object.values(counts));
  const list = $('breakdown-list');
  list.replaceChildren(...PROGRESS.map((p) => {
    const pct = Math.round((counts[p] / max) * 100);
    return el('div', { class: 'breakdown-row' }, [
      el('div', { class: 'breakdown-head' }, [
        el('span', { class: 'breakdown-name', text: p }),
        el('span', { class: 'breakdown-count', text: String(counts[p]) }),
      ]),
      el('div', { class: 'breakdown-bar' }, [
        el('div', {
          class: `breakdown-fill ${PROGRESS_BAR[p] || ''}`,
          attrs: { style: `width:${pct}%` },
        }),
      ]),
    ]);
  }));

  // recent (latest 5; orders already sorted desc by created_at)
  const recent = state.orders.slice(0, 5);
  const recentList = $('recent-list');
  if (!recent.length) {
    recentList.replaceChildren(el('div', { class: 'empty-state', text: 'Belum ada pesanan.' }));
    return;
  }
  recentList.replaceChildren(...recent.map((o) => {
    const prog = o.progress_status || 'Antrean';
    return el('button', {
      class: 'recent-item',
      attrs: { type: 'button', 'aria-label': `Edit pesanan ${o.brand_name || ''}` },
      on: { click: () => openModal(o) },
    }, [
      el('span', { class: 'recent-avatar', text: initialOf(custName(o)), attrs: { 'aria-hidden': 'true' } }),
      el('div', { class: 'recent-info' }, [
        el('div', { class: 'recent-brand', text: o.brand_name || '—' }),
        el('div', { class: 'recent-customer', text: custName(o) }),
      ]),
      el('span', { class: `pill pill--sm ${PROGRESS_PILL[prog] || 'pill--slate'}`, text: prog }),
    ]);
  }));
}

/* ---------------------------------------------------------------- filter chips */
function buildFilterChips() {
  const wrap = $('filter-chips');
  if (!wrap) return;
  const opts = ['Semua', ...PROGRESS];
  wrap.replaceChildren(...opts.map((label) => el('button', {
    class: 'filter-btn' + (label === state.filter ? ' active' : ''),
    text: label,
    attrs: { type: 'button', 'aria-pressed': String(label === state.filter) },
    on: {
      click: () => {
        state.filter = label;
        for (const b of wrap.children) {
          const on = b.textContent === label;
          b.classList.toggle('active', on);
          b.setAttribute('aria-pressed', String(on));
        }
        renderPesanan();
      },
    },
  })));
}

/* ---------------------------------------------------------------- pesanan table */
function renderPesanan() {
  const tbody = $('orders-tbody');
  const empty = $('orders-empty');
  const rows = state.filter === 'Semua'
    ? state.orders
    : state.orders.filter((o) => o.progress_status === state.filter);

  if (!rows.length) {
    tbody.replaceChildren();
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  tbody.replaceChildren(...rows.map(renderOrderRow));
}

function renderOrderRow(o) {
  const prog = o.progress_status || 'Antrean';
  const pay = o.payment_status || 'Belum Lunas';
  const name = custName(o);
  const wa = custWa(o);

  // Klien
  const tdClient = el('td', {}, [
    el('div', { class: 'table-client' }, [
      el('span', { class: 'table-avatar', text: initialOf(name), attrs: { 'aria-hidden': 'true' } }),
      el('div', {}, [
        el('div', { class: 'table-name', text: name }),
        el('div', { class: 'table-wa', text: wa || '—' }),
      ]),
    ]),
  ]);

  // Brand
  const tdBrand = el('td', {}, [
    el('div', { class: 'table-brand', text: o.brand_name || '—' }),
    el('div', { class: 'table-brief', text: o.brand_description || '' }),
  ]);

  // Progres
  const tdProg = el('td', {}, [
    el('span', { class: `pill ${PROGRESS_PILL[prog] || 'pill--slate'}`, text: prog }),
  ]);

  // Pembayaran
  const tdPay = el('td', {}, [
    el('span', { class: `pill ${PAYMENT_PILL[pay] || 'pill--red'}`, text: pay }),
  ]);

  // Total
  const dpNote = Number(o.dp_amount || 0) > 0 ? `DP ${rupiah(o.dp_amount)}` : '';
  const tdTotal = el('td', {}, [
    el('div', { class: 'table-total', text: rupiah(o.total_amount) }),
    dpNote ? el('div', { class: 'table-dp', text: dpNote }) : null,
  ]);

  // Aksi
  const chatHref = wa ? buildWaConsult(wa, chatMessage(name, o.brand_name)) : '#';
  const tdAksi = el('td', {}, [
    el('div', { class: 'action-row' }, [
      el('button', {
        class: 'action-btn action-btn--edit', text: '✎',
        attrs: { type: 'button', 'aria-label': `Edit pesanan ${o.brand_name || ''}` },
        on: { click: () => openModal(o) },
      }),
      el('a', {
        class: 'action-btn action-btn--chat', text: '💬',
        attrs: {
          href: chatHref, target: '_blank', rel: 'noopener noreferrer',
          'aria-label': `Chat WhatsApp dengan ${name}`,
          ...(wa ? {} : { 'aria-disabled': 'true' }),
        },
      }),
      el('button', {
        class: 'action-btn action-btn--delete', text: '🗑',
        attrs: { type: 'button', 'aria-label': `Hapus pesanan ${o.brand_name || ''}` },
        on: { click: (e) => onDelete(o, e.currentTarget) },
      }),
    ]),
  ]);

  return el('tr', {}, [tdClient, tdBrand, tdProg, tdPay, tdTotal, tdAksi]);
}

function chatMessage(name, brand) {
  const b = brand ? ` untuk brand "${brand}"` : '';
  return `Halo ${name || 'Kak'}, kami dari LogoKu ingin mengabari perkembangan pesanan logo${b}.`;
}

/* ---------------------------------------------------------------- pelanggan */
function renderPelanggan() {
  const grid = $('customer-grid');
  const empty = $('customer-empty');
  const seen = new Map();
  for (const o of state.orders) {
    const wa = custWa(o);
    const key = wa || `name:${custName(o)}`;
    if (!seen.has(key)) {
      seen.set(key, { name: custName(o), wa, count: 0, brands: new Set() });
    }
    const rec = seen.get(key);
    rec.count += 1;
    if (o.brand_name) rec.brands.add(o.brand_name);
  }
  const customers = [...seen.values()];
  if (!customers.length) {
    grid.replaceChildren();
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  grid.replaceChildren(...customers.map((c) => {
    const sub = c.brands.size
      ? [...c.brands].slice(0, 2).join(', ') + (c.brands.size > 2 ? '…' : '')
      : `${c.count} pesanan`;
    const href = c.wa ? buildWaConsult(c.wa, `Halo ${c.name}, terima kasih telah mempercayakan desain logo pada LogoKu.`) : '#';
    return el('div', { class: 'customer-card' }, [
      el('span', { class: 'customer-avatar', text: initialOf(c.name), attrs: { 'aria-hidden': 'true' } }),
      el('div', { class: 'customer-info' }, [
        el('div', { class: 'customer-name', text: c.name }),
        el('div', { class: 'customer-sub', text: sub }),
      ]),
      el('a', {
        class: 'customer-chat', text: '💬',
        attrs: {
          href, target: '_blank', rel: 'noopener noreferrer',
          'aria-label': `Chat WhatsApp dengan ${c.name}`,
          ...(c.wa ? {} : { 'aria-disabled': 'true' }),
        },
      }),
    ]);
  }));
}

/* ---------------------------------------------------------------- selects */
function populateSelects() {
  const prog = $('f-progres');
  const pay = $('f-bayar');
  prog.replaceChildren(...PROGRESS.map((p) => el('option', { text: p, attrs: { value: p } })));
  pay.replaceChildren(...PAYMENT.map((p) => el('option', { text: p, attrs: { value: p } })));
}

/* ---------------------------------------------------------------- modal */
function openModal(order = null) {
  state.editingId = order ? order.id : null;
  state.lastFocused = document.activeElement;

  $('modal-title').textContent = order ? 'Edit Pesanan' : 'Pesanan Manual';
  $('modal-save').textContent = order ? 'Simpan Perubahan' : 'Simpan';
  $('modal-error').textContent = '';

  $('f-customer').value = order ? custName(order) : '';
  $('f-wa').value = order ? custWa(order) : '';
  $('f-brand').value = order ? (order.brand_name || '') : '';
  $('f-brief').value = order ? (order.brand_description || '') : '';
  $('f-total').value = order ? String(order.total_amount ?? '') : '';
  $('f-dp').value = order ? String(order.dp_amount ?? '') : '';
  $('f-progres').value = order ? (order.progress_status || 'Antrean') : 'Antrean';
  $('f-bayar').value = order ? (order.payment_status || 'Belum Lunas') : 'Belum Lunas';

  // In edit mode the client name/WhatsApp belong to the customer record and
  // cannot be changed from here; make them read-only to avoid silent no-ops.
  $('f-customer').readOnly = !!order;
  $('f-wa').readOnly = !!order;

  const modal = $('order-modal');
  modal.hidden = false;
  document.addEventListener('keydown', onModalKeydown);
  // focus first editable field
  const first = order ? $('f-brand') : $('f-customer');
  setTimeout(() => first.focus(), 0);
}

function closeModal() {
  const modal = $('order-modal');
  modal.hidden = true;
  document.removeEventListener('keydown', onModalKeydown);
  state.editingId = null;
  if (state.lastFocused && typeof state.lastFocused.focus === 'function') {
    state.lastFocused.focus();
  }
}

function onModalKeydown(e) {
  if (e.key === 'Escape') {
    e.preventDefault();
    closeModal();
    return;
  }
  if (e.key !== 'Tab') return;
  const card = $('order-modal').querySelector('.modal-card');
  const focusables = card.querySelectorAll(
    'button, [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const list = [...focusables].filter((n) => !n.disabled && n.offsetParent !== null);
  if (!list.length) return;
  const first = list[0];
  const last = list[list.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault(); last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault(); first.focus();
  }
}

async function onSaveOrder(e) {
  e.preventDefault();
  const errBox = $('modal-error');
  errBox.textContent = '';

  const total = $('f-total').value;
  const dp = $('f-dp').value;
  const amtErr = validateAmounts(total, dp);
  if (amtErr) {
    errBox.textContent = AMOUNT_ERRORS[amtErr] || 'Nominal tidak valid.';
    return;
  }

  const saveBtn = $('modal-save');
  const cancelBtn = $('modal-cancel');
  saveBtn.disabled = true; cancelBtn.disabled = true;

  try {
    if (state.editingId != null) {
      await updateOrder(state.editingId, {
        brand_name: $('f-brand').value.trim(),
        brand_description: $('f-brief').value.trim(),
        total_amount: Number(total || 0),
        dp_amount: Number(dp || 0),
        progress_status: $('f-progres').value,
        payment_status: $('f-bayar').value,
      });
      showToast('Pesanan berhasil diperbarui.');
    } else {
      const wa = $('f-wa').value.trim();
      if (!wa) { errBox.textContent = 'Nomor WhatsApp wajib diisi.'; return; }
      await createManualOrder({
        whatsapp_number: wa,
        full_name: $('f-customer').value.trim() || 'Tanpa Nama',
        brand_name: $('f-brand').value.trim(),
        brief: $('f-brief').value.trim(),
        total_amount: Number(total || 0),
        dp_amount: Number(dp || 0),
        progress_status: $('f-progres').value,
        payment_status: $('f-bayar').value,
      });
      showToast('Pesanan manual berhasil dibuat.');
    }
    closeModal();
    await refresh();
  } catch (err) {
    console.error('[dashboard] simpan pesanan gagal', err);
    errBox.textContent = AMOUNT_ERRORS[err.message] || 'Gagal menyimpan pesanan. Coba lagi.';
  } finally {
    saveBtn.disabled = false; cancelBtn.disabled = false;
  }
}

/* ---------------------------------------------------------------- delete */
async function onDelete(order, btn) {
  const label = order.brand_name || custName(order);
  if (!window.confirm(`Hapus pesanan "${label}"? Tindakan ini tidak dapat dibatalkan.`)) return;
  if (btn) btn.disabled = true;
  try {
    await deleteOrder(order.id);
    showToast('Pesanan berhasil dihapus.');
    await refresh();
  } catch (err) {
    console.error('[dashboard] hapus pesanan gagal', err);
    showToast('Gagal menghapus pesanan.');
    if (btn) btn.disabled = false;
  }
}

/* ---------------------------------------------------------------- settings */
async function onSaveSettings(e) {
  e.preventDefault();
  if (!supabase || !state.userId) {
    showNotice('Supabase belum dikonfigurasi.');
    return;
  }
  const btn = $('settings-save');
  const fullName = $('set-nama').value.trim();
  const wa = $('set-wa').value.trim();
  if (!fullName) { showToast('Nama lengkap wajib diisi.'); return; }

  btn.disabled = true;
  try {
    const { error } = await supabase
      .from('admin_profiles')
      .update({ full_name: fullName })
      .eq('id', state.userId);
    if (error) throw error;

    // WhatsApp is kept in user metadata (no dedicated column required).
    if (wa) {
      try { await supabase.auth.updateUser({ data: { whatsapp_business: wa } }); }
      catch (metaErr) { console.warn('[dashboard] gagal simpan WA metadata', metaErr); }
    }

    $('profile-name').textContent = fullName;
    $('profile-initial').textContent = initialOf(fullName);
    showToast('Perubahan berhasil disimpan.');
  } catch (err) {
    console.error('[dashboard] simpan pengaturan gagal', err);
    showToast('Gagal menyimpan perubahan.');
  } finally {
    btn.disabled = false;
  }
}

/* ---------------------------------------------------------------- logout */
async function onLogout() {
  const btn = $('logout-btn');
  btn.disabled = true;
  try {
    if (supabase) await supabase.auth.signOut();
  } catch (err) {
    console.error('[dashboard] signOut gagal', err);
  } finally {
    location.replace('login.html');
  }
}

/* ---------------------------------------------------------------- static binds */
function bindStaticHandlers() {
  for (const btn of document.querySelectorAll('.nav-item')) {
    btn.addEventListener('click', () => setView(btn.dataset.view));
  }
  $('add-order-btn').addEventListener('click', () => openModal(null));
  $('logout-btn').addEventListener('click', onLogout);
  $('modal-close').addEventListener('click', closeModal);
  $('modal-cancel').addEventListener('click', closeModal);
  $('order-form').addEventListener('submit', onSaveOrder);
  $('settings-form').addEventListener('submit', onSaveSettings);
  // click on overlay (outside card) closes modal
  $('order-modal').addEventListener('mousedown', (e) => {
    if (e.target === $('order-modal')) closeModal();
  });
}

/* ---------------------------------------------------------------- go */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
