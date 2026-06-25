// Pure phone normalization helper (Indonesian WhatsApp numbers).
// Idempotent: normalizePhone(normalizePhone(x)) === normalizePhone(x).

/**
 * Normalize a raw phone string to digits-only, 62-prefixed form.
 * - strips spaces, dashes, parentheses, leading '+'
 * - '08xx'  -> '628xx'
 * - '+62..' / '62..' -> '62..'
 * - '8xx'   -> '628xx'
 * @param {string} raw
 * @returns {string} normalized number, e.g. "62812..."
 * @throws {Error} if no digits remain
 */
export function normalizePhone(raw) {
  if (raw == null) throw new Error('phone_required');
  // keep digits only
  let digits = String(raw).replace(/\D+/g, '');
  if (digits.length === 0) throw new Error('phone_invalid');

  if (digits.startsWith('62')) {
    // already prefixed
  } else if (digits.startsWith('0')) {
    digits = '62' + digits.slice(1);
  } else if (digits.startsWith('8')) {
    digits = '62' + digits;
  } else {
    // fall back: ensure 62 prefix
    digits = '62' + digits;
  }
  return digits;
}

/** True if value is a normalized 62-prefixed digits-only number. */
export function isNormalizedPhone(value) {
  return typeof value === 'string' && /^62\d{6,}$/.test(value);
}
