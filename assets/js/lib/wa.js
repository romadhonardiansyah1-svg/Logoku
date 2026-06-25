// Pure WhatsApp handoff URL builder.
import { normalizePhone } from './phone.js';

/**
 * @typedef {Object} OrderSummary
 * @property {string} [orderNumber]
 * @property {string} [fullName]
 * @property {string} [phone]
 * @property {string} [brandName]
 * @property {string|number} [packageId]
 * @property {string} [primaryColor]
 * @property {string} [secondaryColor]
 * @property {string} [note]
 */

/**
 * Build a wa.me URL with a prefilled order summary message.
 * @param {string} adminPhone destination admin number (any format)
 * @param {OrderSummary} order
 * @returns {string} https://wa.me/<num>?text=<encoded>
 */
export function buildWaHandoff(adminPhone, order = {}) {
  const num = normalizePhone(adminPhone);
  const lines = ['Halo Admin LogoKu, saya ingin memesan logo.'];
  if (order.orderNumber) lines.push(`No. Pesanan: ${order.orderNumber}`);
  if (order.fullName) lines.push(`Nama: ${order.fullName}`);
  if (order.phone) lines.push(`WhatsApp: ${order.phone}`);
  if (order.brandName) lines.push(`Brand: ${order.brandName}`);
  if (order.packageId) lines.push(`Paket: ${order.packageId}`);
  if (order.primaryColor) lines.push(`Warna utama: ${order.primaryColor}`);
  if (order.secondaryColor) lines.push(`Warna sekunder: ${order.secondaryColor}`);
  if (order.note) lines.push(`Catatan: ${order.note}`);
  const text = encodeURIComponent(lines.join('\n'));
  return `https://wa.me/${num}?text=${text}`;
}

/** Build a simple consultation link (no order). */
export function buildWaConsult(adminPhone, message = 'Halo Admin LogoKu, saya ingin berkonsultasi mengenai desain logo.') {
  const num = normalizePhone(adminPhone);
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}
