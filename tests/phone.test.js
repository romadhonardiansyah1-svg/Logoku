import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { normalizePhone, isNormalizedPhone } from '../assets/js/lib/phone.js';

describe('normalizePhone', () => {
  it('converts a leading 0 local number to a 62-prefixed number', () => {
    // Arrange
    const raw = '08123456789';
    // Act
    const result = normalizePhone(raw);
    // Assert
    expect(result).toBe('628123456789');
  });

  it('keeps a +62 international number as 62-prefixed digits', () => {
    const raw = '+628123';
    const result = normalizePhone(raw);
    expect(result).toBe('628123');
  });

  it('leaves an already 62-prefixed number unchanged', () => {
    const raw = '628123';
    const result = normalizePhone(raw);
    expect(result).toBe('628123');
  });

  it('prefixes a number starting with 8 with 62', () => {
    const raw = '8123456';
    const result = normalizePhone(raw);
    expect(result).toBe('628123456');
  });

  it('strips spaces, dashes, and parentheses before normalizing', () => {
    const raw = '(0812) 3456-789';
    const result = normalizePhone(raw);
    expect(result).toBe('628123456789');
  });

  it('throws when given an empty string', () => {
    expect(() => normalizePhone('')).toThrow();
  });

  it('throws when the input contains no digits', () => {
    expect(() => normalizePhone('abc-def')).toThrow();
  });

  it('throws when given null', () => {
    expect(() => normalizePhone(null)).toThrow();
  });
});

describe('normalizePhone — properties', () => {
  // Generator: arbitrary strings guaranteed to contain at least one digit.
  const stringWithDigit = fc
    .tuple(fc.string(), fc.integer({ min: 0, max: 9 }), fc.string())
    .map(([a, d, b]) => a + String(d) + b);

  it('is idempotent: normalizing twice equals normalizing once', () => {
    fc.assert(
      fc.property(stringWithDigit, (x) => {
        const once = normalizePhone(x);
        const twice = normalizePhone(once);
        expect(twice).toBe(once);
      })
    );
  });

  it('always produces a 62-prefixed, digits-only result', () => {
    fc.assert(
      fc.property(stringWithDigit, (x) => {
        const result = normalizePhone(x);
        expect(result.startsWith('62')).toBe(true);
        expect(/^\d+$/.test(result)).toBe(true);
      })
    );
  });
});

describe('isNormalizedPhone', () => {
  it('returns true for a normalized 62-prefixed number', () => {
    expect(isNormalizedPhone('628123456789')).toBe(true);
  });

  it('returns false for a non-string value', () => {
    expect(isNormalizedPhone(628123456789)).toBe(false);
  });

  it('returns false for a number that is too short', () => {
    expect(isNormalizedPhone('6281')).toBe(false);
  });

  it('returns false for a number not starting with 62', () => {
    expect(isNormalizedPhone('08123456789')).toBe(false);
  });
});
