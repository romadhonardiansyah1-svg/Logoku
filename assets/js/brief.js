// Brief / order page controller.
// Flow: fill form -> client validation -> submitBrief() saves order to Supabase
// via RPC -> open wa.me direct chat to admin with a prefilled summary.
// No OTP, no API tier. If Supabase is not configured we fall back to a
// WhatsApp handoff without an order number so the page stays usable in preview.
import { submitBrief } from './lib/orders.js';
import { buildWaHandoff } from './lib/wa.js';
import { ADMIN_WHATSAPP_NUMBER } from './lib/supabaseClient.js';

const HEX = /^#[0-9a-fA-F]{6}$/;

// Package catalogue (kept in sync with the pricing section / RPC ids 1-4).
const PACKAGES = {
  1: { name: 'Logo 1 Pilihan', price: 'Rp 80.000' },
  2: { name: 'Logo 2 Pilihan', price: 'Rp 140.000' },
  3: { name: 'Logo 3 Pilihan', price: 'Rp 199.000' },
  4: { name: 'Paket Utama', price: 'Rp 250.000' },
};

// Friendly Indonesian messages mapped from error codes returned by orders.js.
const ERROR_MESSAGES = {
  invalid_phone: 'Nomor WhatsApp belum valid. Masukkan nomor aktif, contoh: 81234567890.',
  missing_full_name: 'Nama lengkap wajib diisi.',
  missing_brand_name: 'Nama brand / bisnis wajib diisi.',
  missing_description: 'Deskripsi bisnis & target pasar wajib diisi.',
  invalid_package: 'Paket yang dipilih tidak dikenali. Silakan pilih ulang dari halaman harga.',
  invalid_primary_color: 'Warna dominan harus berupa kode hex yang valid, contoh: #7c3aed.',
  invalid_secondary_color: 'Warna sekunder harus berupa kode hex yang valid, contoh: #60a5fa.',
  honeypot: 'Pengiriman ditolak. Silakan muat ulang halaman dan coba lagi.',
  supabase_not_configured: 'Backend belum aktif, tapi Anda tetap bisa lanjut chat ke WhatsApp.',
  order_failed: 'Maaf, pesanan gagal disimpan. Silakan coba lagi atau hubungi admin via WhatsApp.',
  empty: 'Form belum terisi. Lengkapi data terlebih dahulu.',
};

// Map each error code to the input it relates to (for inline display + focus).
const FIELD_FOR_CODE = {
  invalid_phone: 'phone',
  missing_full_name: 'fullName',
  missing_brand_name: 'brandName',
  missing_description: 'brandDescription',
  invalid_primary_color: 'primaryHex',
  invalid_secondary_color: 'secondaryHex',
};

const $ = (id) => document.getElementById(id);

/* ----------------------------------------------------------------------- */
/* URL params -> selected package / reference panel                         */
/* ----------------------------------------------------------------------- */

let packageId = null;
let refId = null;

function parseIntOrNull(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isInteger(n) ? n : null;
}

function renderPaketPanel() {
  const panel = $('paketPanel');
  const eyebrow = $('paketEyebrow');
  const name = $('paketName');

  let params;
  try {
    params = new URLSearchParams(window.location.search);
  } catch {
    params = new URLSearchParams('');
  }

  packageId = parseIntOrNull(params.get('paket'));
  refId = parseIntOrNull(params.get('ref'));

  const pkg = packageId != null ? PACKAGES[packageId] : null;

  if (pkg) {
    eyebrow.textContent = 'Paket Dipilih';
    name.textContent = `${pkg.name} (${pkg.price})`;
    panel.hidden = false;
  } else if (refId != null) {
    eyebrow.textContent = 'Referensi Desain';
    name.textContent = `Desain referensi #${refId}`;
    panel.hidden = false;
  } else {
    // neither present -> keep neutral / hidden, and drop an invalid package id.
    if (packageId != null && !pkg) packageId = null;
    panel.hidden = true;
  }
  // never submit an unrecognised package id
  if (packageId != null && !PACKAGES[packageId]) packageId = null;
}

/* ----------------------------------------------------------------------- */
/* Color picker <-> hex text two-way sync                                   */
/* ----------------------------------------------------------------------- */

function bindColorPair(pickerId, hexId, errId) {
  const picker = $(pickerId);
  const hex = $(hexId);
  const err = $(errId);

  // picker -> hex
  picker.addEventListener('input', () => {
    hex.value = picker.value.toLowerCase();
    clearFieldError(hex, err);
  });

  // hex -> picker (only when valid)
  hex.addEventListener('input', () => {
    let v = hex.value.trim();
    if (v && !v.startsWith('#')) v = `#${v}`;
    if (HEX.test(v)) {
      picker.value = v.toLowerCase();
      clearFieldError(hex, err);
    }
  });

  // normalise / validate on blur
  hex.addEventListener('blur', () => {
    let v = hex.value.trim();
    if (v && !v.startsWith('#')) v = `#${v}`;
    if (v) v = v.toLowerCase();
    hex.value = v;
    if (v && !HEX.test(v)) {
      showFieldError(hex, err, 'Gunakan format hex seperti #7c3aed.');
    } else if (HEX.test(v)) {
      picker.value = v;
    }
  });
}

/* ----------------------------------------------------------------------- */
/* Inline error helpers (textContent only — never innerHTML with user data) */
/* ----------------------------------------------------------------------- */

function showFieldError(input, errEl, message) {
  if (errEl) {
    errEl.textContent = message;
    errEl.hidden = false;
  }
  if (input) {
    input.classList.add('is-invalid');
    input.setAttribute('aria-invalid', 'true');
  }
}

function clearFieldError(input, errEl) {
  if (errEl) {
    errEl.textContent = '';
    errEl.hidden = true;
  }
  if (input) {
    input.classList.remove('is-invalid');
    input.removeAttribute('aria-invalid');
  }
}

function clearAllErrors() {
  ['phone', 'fullName', 'brandName', 'brandDescription', 'primaryHex', 'secondaryHex']
    .forEach((id) => {
      const input = $(id);
      const err = $(`${id === 'primaryHex' ? 'primary' : id === 'secondaryHex' ? 'secondary' : id}Err`);
      clearFieldError(input, err);
    });
  setStatus('', null);
}

function errElForCode(code) {
  const fieldId = FIELD_FOR_CODE[code];
  if (!fieldId) return { input: null, err: null };
  const errId = fieldId === 'primaryHex' ? 'primaryErr'
    : fieldId === 'secondaryHex' ? 'secondaryErr'
      : `${fieldId}Err`;
  return { input: $(fieldId), err: $(errId), fieldId };
}

function setStatus(message, kind /* 'error' | 'ok' | null */) {
  const el = $('formStatus');
  el.textContent = message || '';
  el.classList.remove('is-error', 'is-ok');
  if (!message) {
    el.hidden = true;
    return;
  }
  if (kind === 'error') el.classList.add('is-error');
  if (kind === 'ok') el.classList.add('is-ok');
  el.hidden = false;
}

/**
 * Render the list of error codes inline + focus the first invalid field.
 * @param {string[]} codes
 */
function renderErrors(codes) {
  let firstField = null;
  const general = [];

  codes.forEach((code) => {
    const message = ERROR_MESSAGES[code] || ERROR_MESSAGES.order_failed;
    const { input, err, fieldId } = errElForCode(code);
    if (err) {
      showFieldError(input, err, message);
      if (!firstField) firstField = input;
    } else {
      general.push(message);
    }
    if (!firstField && fieldId) firstField = $(fieldId);
  });

  if (general.length) setStatus(general.join(' '), 'error');
  if (firstField && typeof firstField.focus === 'function') firstField.focus();
}

/* ----------------------------------------------------------------------- */
/* Submit                                                                   */
/* ----------------------------------------------------------------------- */

function collectInput() {
  return {
    phone: $('phone').value.trim(),
    fullName: $('fullName').value.trim(),
    brandName: $('brandName').value.trim(),
    brandDescription: $('brandDescription').value.trim(),
    packageId,
    refId,
    tagline: $('tagline').value.trim(),
    primaryColor: $('primaryHex').value.trim(),
    secondaryColor: $('secondaryHex').value.trim(),
    notes: $('notes').value.trim(),
    company_website: $('company_website').value,
  };
}

function buildOrder(input, orderNumber) {
  return {
    orderNumber: orderNumber || undefined,
    fullName: input.fullName,
    phone: input.phone,
    brandName: input.brandName,
    packageId: packageId != null ? `${PACKAGES[packageId]?.name || packageId}` : undefined,
    primaryColor: HEX.test(input.primaryColor) ? input.primaryColor : undefined,
    secondaryColor: HEX.test(input.secondaryColor) ? input.secondaryColor : undefined,
    note: input.notes || undefined,
  };
}

function goToWhatsApp(input, orderNumber) {
  const order = buildOrder(input, orderNumber);
  const url = buildWaHandoff(ADMIN_WHATSAPP_NUMBER, order);
  window.location.href = url;
}

async function onSubmit(event) {
  event.preventDefault();
  const btn = $('submitBtn');
  if (btn.disabled) return;

  clearAllErrors();

  const input = collectInput();

  // honeypot: bail silently-ish (bots shouldn't reach WhatsApp).
  if (input.company_website) {
    setStatus(ERROR_MESSAGES.honeypot, 'error');
    return;
  }

  btn.disabled = true;
  const originalLabel = btn.textContent;
  btn.textContent = 'Mengirim…';
  setStatus('Menyimpan brief Anda…', null);

  try {
    const { orderNumber } = await submitBrief(input);
    setStatus(`Brief tersimpan. No. Pesanan: ${orderNumber}. Mengarahkan ke WhatsApp…`, 'ok');
    goToWhatsApp(input, orderNumber);
    // keep the button disabled — navigation is in progress.
  } catch (error) {
    const code = error && error.code ? error.code : 'order_failed';
    const codes = error && Array.isArray(error.errors) && error.errors.length
      ? error.errors
      : [code];

    if (code === 'supabase_not_configured') {
      // graceful preview fallback: continue to WhatsApp without an order number.
      setStatus(
        `${ERROR_MESSAGES.supabase_not_configured} Mengarahkan ke WhatsApp…`,
        'ok',
      );
      goToWhatsApp(input, null);
      return; // leave button disabled during navigation
    }

    renderErrors(codes);
    btn.disabled = false;
    btn.textContent = originalLabel;
  }
}

/* ----------------------------------------------------------------------- */
/* Init                                                                     */
/* ----------------------------------------------------------------------- */

function init() {
  renderPaketPanel();
  bindColorPair('primaryColor', 'primaryHex', 'primaryErr');
  bindColorPair('secondaryColor', 'secondaryHex', 'secondaryErr');

  // clear inline errors as the user fixes each field
  ['phone', 'fullName', 'brandName', 'brandDescription'].forEach((id) => {
    const input = $(id);
    const err = $(`${id}Err`);
    input.addEventListener('input', () => clearFieldError(input, err));
  });

  $('briefForm').addEventListener('submit', onSubmit);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
