import { describe, it, expect } from 'vitest';
import { extractSignals, isLinktreeUrl } from '../src/lib/enrichment';

describe('isLinktreeUrl', () => {
  it('detects linktr.ee', () => {
    expect(isLinktreeUrl('https://linktr.ee/myshop')).toBe(true);
  });
  it('detects linkin.bio', () => {
    expect(isLinktreeUrl('https://linkin.bio/myshop')).toBe(true);
  });
  it('returns false for real website', () => {
    expect(isLinktreeUrl('https://myshop.com')).toBe(false);
  });
  it('returns false for null', () => {
    expect(isLinktreeUrl(null)).toBe(false);
  });
});

describe('extractSignals', () => {
  it('extracts DM signals from bio', () => {
    const signals = extractSignals('DM to order! WhatsApp us at 555-1234');
    expect(signals).toContain('dm to order');
    expect(signals).toContain('whatsapp');
  });
  it('returns empty for clean bio', () => {
    expect(extractSignals('Just a photographer sharing my work')).toEqual([]);
  });
});
