import { describe, it, expect, vi, beforeAll } from 'vitest';

// Mock the supabase client BEFORE importing orders.js so the CDN import
// (https://esm.sh/...) is never evaluated under node/vitest.
vi.mock('../assets/js/lib/supabaseClient.js', () => ({
  supabase: null,
  catalogImageUrl: () => null,
  ADMIN_WHATSAPP_NUMBER: '6285236314038',
}));

let validateBrief;

beforeAll(async () => {
  ({ validateBrief } = await import('../assets/js/lib/orders.js'));
});

const validInput = () => ({
  phone: '08123456789',
  fullName: 'Budi Santoso',
  brandName: 'Kopi Nusantara',
  brandDescription: 'Kedai kopi lokal premium',
  packageId: 2,
  primaryColor: '#aabbcc',
  secondaryColor: '#112233',
});

describe('validateBrief', () => {
  it('returns no errors for a fully valid input', () => {
    const errors = validateBrief(validInput());
    expect(errors).toEqual([]);
  });

  it('reports missing_full_name when fullName is blank', () => {
    const input = { ...validInput(), fullName: '   ' };
    expect(validateBrief(input)).toContain('missing_full_name');
  });

  it('reports missing_brand_name when brandName is blank', () => {
    const input = { ...validInput(), brandName: '' };
    expect(validateBrief(input)).toContain('missing_brand_name');
  });

  it('reports missing_description when brandDescription is blank', () => {
    const input = { ...validInput(), brandDescription: '' };
    expect(validateBrief(input)).toContain('missing_description');
  });

  it('reports honeypot when the hidden company_website field is filled', () => {
    const input = { ...validInput(), company_website: 'http://spam.example' };
    expect(validateBrief(input)).toContain('honeypot');
  });

  it('reports invalid_primary_color for a malformed hex color', () => {
    const input = { ...validInput(), primaryColor: 'red' };
    expect(validateBrief(input)).toContain('invalid_primary_color');
  });

  it('reports invalid_secondary_color for a malformed hex color', () => {
    const input = { ...validInput(), secondaryColor: '#zzzzzz' };
    expect(validateBrief(input)).toContain('invalid_secondary_color');
  });

  it('reports invalid_package for an unknown package id', () => {
    const input = { ...validInput(), packageId: 5 };
    expect(validateBrief(input)).toContain('invalid_package');
  });

  it('reports invalid_phone for a phone with no digits', () => {
    const input = { ...validInput(), phone: 'no-digits-here' };
    expect(validateBrief(input)).toContain('invalid_phone');
  });

  it('returns ["empty"] when no input is given', () => {
    expect(validateBrief(null)).toEqual(['empty']);
  });
});
