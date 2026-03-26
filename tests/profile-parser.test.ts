import { describe, it, expect } from 'vitest';
import { parseProfileText } from '../src/lib/scraper/profile-parser';

describe('parseProfileText.parseCount', () => {
  it('parses plain numbers', () => {
    expect(parseProfileText.parseCount('1,234')).toBe(1234);
  });
  it('handles K suffix', () => {
    expect(parseProfileText.parseCount('12.5K')).toBe(12500);
  });
  it('handles M suffix', () => {
    expect(parseProfileText.parseCount('1.2M')).toBe(1200000);
  });
  it('handles zero', () => {
    expect(parseProfileText.parseCount('0')).toBe(0);
  });
  it('handles lowercase k suffix', () => {
    expect(parseProfileText.parseCount('5.3k')).toBe(5300);
  });
  it('handles lowercase m suffix', () => {
    expect(parseProfileText.parseCount('2.5m')).toBe(2500000);
  });
  it('handles plain number without commas', () => {
    expect(parseProfileText.parseCount('456')).toBe(456);
  });
  it('handles empty string', () => {
    expect(parseProfileText.parseCount('')).toBe(0);
  });
  it('handles whitespace', () => {
    expect(parseProfileText.parseCount('  1,000  ')).toBe(1000);
  });
});
