// Public brief submission — direct to Supabase via the submit_brief RPC.
// No server tier, no OTP. The RPC is SECURITY DEFINER and validates input.
import { supabase } from './supabaseClient.js';
import { normalizePhone, isNormalizedPhone } from './phone.js';

const HEX = /^#[0-9a-fA-F]{6}$/;

/**
 * @typedef {Object} CreateOrderInput
 * @property {string} phone
 * @property {string} fullName
 * @property {string} brandName
 * @property {string} brandDescription
 * @property {number|null} [packageId]
 * @property {number|null} [refId]
 * @property {string} [tagline]
 * @property {string} [primaryColor]
 * @property {string} [secondaryColor]
 * @property {string} [notes]
 * @property {string} [company_website]  hidden honeypot, must be empty
 */

/**
 * Validate a brief input. Returns an array of error codes (empty = valid).
 * Pure function — unit testable.
 * @param {CreateOrderInput} input
 * @returns {string[]}
 */
export function validateBrief(input) {
  const errors = [];
  if (!input) return ['empty'];
  if (input.company_website) errors.push('honeypot'); // bot trap
  let phone;
  try { phone = normalizePhone(input.phone); } catch { errors.push('invalid_phone'); }
  if (phone && !isNormalizedPhone(phone)) errors.push('invalid_phone');
  if (!input.fullName || !input.fullName.trim()) errors.push('missing_full_name');
  if (!input.brandName || !input.brandName.trim()) errors.push('missing_brand_name');
  if (!input.brandDescription || !input.brandDescription.trim()) errors.push('missing_description');
  if (input.packageId != null && ![1, 2, 3, 4].includes(Number(input.packageId))) errors.push('invalid_package');
  if (input.primaryColor && !HEX.test(input.primaryColor)) errors.push('invalid_primary_color');
  if (input.secondaryColor && !HEX.test(input.secondaryColor)) errors.push('invalid_secondary_color');
  return errors;
}

/**
 * Submit a brief. Validates, then calls the submit_brief RPC.
 * @param {CreateOrderInput} input
 * @returns {Promise<{orderNumber:string}>}
 */
export async function submitBrief(input) {
  const errors = validateBrief(input);
  if (errors.length) {
    const e = new Error(errors[0]); e.code = errors[0]; e.errors = errors; throw e;
  }
  if (!supabase) throw new Error('supabase_not_configured');

  const phone = normalizePhone(input.phone);
  const { data, error } = await supabase.rpc('submit_brief', {
    p_phone: phone,
    p_full_name: input.fullName.trim(),
    p_brand_name: input.brandName.trim(),
    p_brand_desc: input.brandDescription.trim(),
    p_package_id: input.packageId != null ? Number(input.packageId) : null,
    p_ref_id: input.refId != null ? Number(input.refId) : null,
    p_tagline: input.tagline || null,
    p_primary: HEX.test(input.primaryColor || '') ? input.primaryColor : null,
    p_secondary: HEX.test(input.secondaryColor || '') ? input.secondaryColor : null,
    p_notes: input.notes || null,
  });

  if (error) {
    const e = new Error(error.message || 'order_failed'); e.code = 'order_failed'; throw e;
  }
  return { orderNumber: data };
}
