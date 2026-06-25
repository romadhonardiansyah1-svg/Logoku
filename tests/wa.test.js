import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { buildWaHandoff, buildWaConsult } from '../assets/js/lib/wa.js';

const WA_URL = /^https:\/\/wa\.me\/62\d+\?text=/;

describe('buildWaHandoff', () => {
  it('returns a wa.me URL with a 62-prefixed number and a text param', () => {
    const url = buildWaHandoff('08123456789', {});
    expect(url).toMatch(WA_URL);
  });

  it('includes the URL-encoded order number when provided', () => {
    const url = buildWaHandoff('08123456789', { orderNumber: 'LKU-2025-0001' });
    expect(url).toContain(encodeURIComponent('LKU-2025-0001'));
  });

  it('URL-encodes spaces and newlines in the message body', () => {
    const url = buildWaHandoff('08123456789', { fullName: 'Budi Santoso' });
    // raw spaces and newlines must not appear in the encoded output
    expect(url).not.toMatch(/ /);
    expect(url).not.toContain('\n');
    // a space encodes to %20 and a newline to %0A
    expect(url).toContain('%20');
    expect(url).toContain('%0A');
  });

  it('normalizes the admin phone into the URL path', () => {
    const url = buildWaHandoff('+628123', { orderNumber: 'A1' });
    expect(url.startsWith('https://wa.me/628123?text=')).toBe(true);
  });
});

describe('buildWaConsult', () => {
  it('returns a valid wa.me URL with an encoded default message', () => {
    const url = buildWaConsult('08123456789');
    expect(url).toMatch(WA_URL);
    expect(url).not.toMatch(/text=.* /);
  });
});

describe('buildWaHandoff — properties', () => {
  const orderArb = fc.record(
    {
      orderNumber: fc.string(),
      fullName: fc.string(),
      phone: fc.string(),
      brandName: fc.string(),
      primaryColor: fc.string(),
      secondaryColor: fc.string(),
      note: fc.string(),
    },
    { requiredKeys: [] }
  );

  it('always yields a wa.me URL with a 62-prefixed number and encoded text', () => {
    fc.assert(
      fc.property(orderArb, (order) => {
        const url = buildWaHandoff('08123456789', order);
        expect(url).toMatch(WA_URL);
        // the text param must never contain raw spaces
        const text = url.split('?text=')[1] ?? '';
        expect(text).not.toMatch(/ /);
        expect(text).not.toContain('\n');
      })
    );
  });
});
