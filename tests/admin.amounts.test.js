import { describe, it, expect, vi, beforeAll } from 'vitest';
import fc from 'fast-check';

// Mock the supabase client BEFORE importing admin.js so the CDN import is
// never evaluated under node/vitest.
vi.mock('../assets/js/lib/supabaseClient.js', () => ({
  supabase: null,
  catalogImageUrl: () => null,
  ADMIN_WHATSAPP_NUMBER: '6285236314038',
}));

let validateAmounts;

beforeAll(async () => {
  ({ validateAmounts } = await import('../assets/js/lib/admin.js'));
});

describe('validateAmounts', () => {
  it('accepts a total with a zero down payment', () => {
    expect(validateAmounts(100000, 0)).toBeNull();
  });

  it('accepts a down payment less than the total', () => {
    expect(validateAmounts(100000, 50000)).toBeNull();
  });

  it('rejects a down payment greater than the total', () => {
    expect(validateAmounts(100000, 150000)).toBe('dp_exceeds_total');
  });

  it('rejects a negative total', () => {
    expect(validateAmounts(-1, 0)).toBe('amount_negative');
  });

  it('rejects a non-numeric total', () => {
    expect(validateAmounts('abc', 0)).toBe('amount_invalid');
  });
});

describe('validateAmounts — properties', () => {
  it('returns null whenever 0 <= dp <= total', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 1_000_000_000 }),
        fc.float({ min: 0, max: 1, noNaN: true }),
        (total, ratio) => {
          const dp = Math.round(total * ratio); // 0 <= dp <= total
          expect(validateAmounts(total, dp)).toBeNull();
        }
      )
    );
  });
});
