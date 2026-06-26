// Customer order tracking. Calls the track_order RPC (needs order number +
// matching WhatsApp number) so customers can check status without any login,
// and without being able to read other people's orders.
import { supabase, ADMIN_WHATSAPP_NUMBER } from './lib/supabaseClient.js';
import { normalizePhone, isNormalizedPhone } from './lib/phone.js';
import { buildWaConsult } from './lib/wa.js';

const STAGES = ['Antrean', 'Proses Sketsa', 'Digitalisasi', 'Revisi', 'Selesai'];
const STAGE_DESC = {
  'Antrean': 'Pesanan diterima & masuk antrean.',
  'Proses Sketsa': 'Desainer membuat sketsa konsep awal.',
  'Digitalisasi': 'Sketsa diubah menjadi desain digital.',
  'Revisi': 'Penyempurnaan desain sesuai masukan Anda.',
  'Selesai': 'Desain final siap & file dikirim.',
};
const PAYMENT_PILL = {
  'Belum Lunas': 'pill--red', 'DP': 'pill--amber', 'Lunas': 'pill--green',
};

const $ = (id) => document.getElementById(id);

function rupiah(n) {
  const num = Number(n || 0);
  return 'Rp ' + (Number.isFinite(num) ? num : 0).toLocaleString('id-ID');
}
function fmtDate(iso) {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return '-'; }
}

function setStatus(msg, kind) {
  const el = $('trackStatus');
  el.textContent = msg || '';
  el.classList.remove('is-error', 'is-ok');
  if (!msg) { el.hidden = true; return; }
  if (kind) el.classList.add(kind === 'error' ? 'is-error' : 'is-ok');
  el.hidden = false;
}
function fieldError(input, errEl, msg) {
  if (msg) { errEl.textContent = msg; errEl.hidden = false; input.setAttribute('aria-invalid', 'true'); }
  else { errEl.textContent = ''; errEl.hidden = true; input.removeAttribute('aria-invalid'); }
}

function renderTimeline(current) {
  const idx = STAGES.indexOf(current);
  const ol = $('resTimeline');
  ol.replaceChildren(...STAGES.map((stage, i) => {
    const state = i < idx ? 'done' : i === idx ? 'current' : 'todo';
    const li = document.createElement('li');
    li.className = `track-step track-step--${state}`;
    const dot = document.createElement('span');
    dot.className = 'track-dot';
    dot.textContent = i < idx ? '✓' : String(i + 1);
    dot.setAttribute('aria-hidden', 'true');
    const body = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'track-step-name';
    name.textContent = stage;
    const desc = document.createElement('div');
    desc.className = 'track-step-desc';
    desc.textContent = STAGE_DESC[stage] || '';
    body.append(name, desc);
    li.append(dot, body);
    if (i === idx) li.setAttribute('aria-current', 'step');
    return li;
  }));
}

function renderResult(o) {
  $('resOrderNo').textContent = o.order_number || '-';
  $('resBrand').textContent = o.brand_name || '';
  const payPill = $('resPayPill');
  payPill.textContent = o.payment_status || '-';
  payPill.className = `pill ${PAYMENT_PILL[o.payment_status] || 'pill--slate'}`;
  renderTimeline(o.progress_status);
  $('resTotal').textContent = rupiah(o.total_amount);
  $('resDp').textContent = Number(o.dp_amount || 0) > 0 ? rupiah(o.dp_amount) : '-';
  $('resCreated').textContent = fmtDate(o.created_at);
  $('resUpdated').textContent = fmtDate(o.updated_at);
  $('resWa').href = buildWaConsult(
    ADMIN_WHATSAPP_NUMBER,
    `Halo Admin LogoKu, saya ingin menanyakan pesanan ${o.order_number}.`,
  );
  $('trackResult').hidden = false;
}

async function onSubmit(e) {
  e.preventDefault();
  const btn = $('trackBtn');
  if (btn.disabled) return;

  const orderInput = $('orderNumber');
  const phoneInput = $('phone');
  fieldError(orderInput, $('orderErr'), '');
  fieldError(phoneInput, $('phoneErr'), '');
  $('trackResult').hidden = true;
  setStatus('', null);

  const orderNumber = orderInput.value.trim().toUpperCase();
  let phone;
  let valid = true;
  if (!orderNumber) { fieldError(orderInput, $('orderErr'), 'Nomor pesanan wajib diisi.'); valid = false; }
  try {
    phone = normalizePhone(phoneInput.value);
    if (!isNormalizedPhone(phone)) throw new Error('bad');
  } catch {
    fieldError(phoneInput, $('phoneErr'), 'Nomor WhatsApp belum valid.');
    valid = false;
  }
  if (!valid) return;

  if (!supabase) {
    setStatus('Layanan pelacakan belum aktif (Supabase belum dikonfigurasi).', 'error');
    return;
  }

  btn.disabled = true;
  const label = btn.textContent;
  btn.textContent = 'Mencari…';
  setStatus('Mencari pesanan Anda…', null);

  try {
    const { data, error } = await supabase.rpc('track_order', {
      p_order_number: orderNumber,
      p_phone: phone,
    });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      setStatus('Pesanan tidak ditemukan. Pastikan nomor pesanan dan nomor WhatsApp sudah benar.', 'error');
      return;
    }
    setStatus('', null);
    renderResult(row);
    $('trackResult').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (err) {
    console.error('[track] gagal', err?.message);
    setStatus('Terjadi kendala saat melacak pesanan. Coba lagi sebentar.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = label;
  }
}

function init() {
  $('trackForm').addEventListener('submit', onSubmit);
  // Prefill from URL (?order=...&wa=...) — handy from the WhatsApp message link.
  try {
    const params = new URLSearchParams(location.search);
    if (params.get('order')) $('orderNumber').value = params.get('order');
    if (params.get('wa')) $('phone').value = params.get('wa');
  } catch { /* ignore */ }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
