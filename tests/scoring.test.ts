import { describe, it, expect } from 'vitest';
import { calculateLeadScore } from '../src/lib/scoring';

describe('calculateLeadScore', () => {
  it('scores 30 for no website', () => {
    expect(calculateLeadScore({ website_url: null, has_linktree: false, bio_keywords: [], follower_count: 5000, post_count: 10, bio: '' })).toBe(30);
  });

  it('scores 50 for no website + linktree', () => {
    expect(calculateLeadScore({ website_url: null, has_linktree: true, bio_keywords: [], follower_count: 5000, post_count: 10, bio: '' })).toBe(50);
  });

  it('scores 100 for all signals', () => {
    expect(calculateLeadScore({ website_url: null, has_linktree: true, bio_keywords: ['dm to order'], follower_count: 500, post_count: 30, bio: 'bakery' })).toBe(100);
  });

  it('scores 0 for a profile with a real website and no signals', () => {
    expect(calculateLeadScore({ website_url: 'https://example.com', has_linktree: false, bio_keywords: [], follower_count: 5000, post_count: 10, bio: 'just vibes' })).toBe(0);
  });

  it('caps at 100', () => {
    expect(calculateLeadScore({ website_url: null, has_linktree: true, bio_keywords: ['dm to order', 'whatsapp'], follower_count: 200, post_count: 50, bio: 'salon barber shop restaurant' })).toBe(100);
  });
});
