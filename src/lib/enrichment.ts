import type { ProfileData, Lead } from './types';
import { calculateLeadScore } from './scoring';

const LINKTREE_PATTERNS = [
  /linktr\.ee/i,
  /linkin\.bio/i,
  /lnk\.to/i,
  /beacons\.ai/i,
  /campsite\.bio/i,
  /stan\.store/i,
  /tap\.bio/i,
];

const DM_SIGNAL_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /dm\s*(to|for|us)/i, label: 'dm to order' },
  { pattern: /whatsapp/i, label: 'whatsapp' },
  { pattern: /call\s*to\s*book/i, label: 'call to book' },
  { pattern: /message\s*us/i, label: 'message us' },
  { pattern: /inbox/i, label: 'inbox' },
  { pattern: /order\s*via\s*dm/i, label: 'order via dm' },
];

export function isLinktreeUrl(url: string | null): boolean {
  if (!url) return false;
  return LINKTREE_PATTERNS.some(p => p.test(url));
}

export function extractSignals(bio: string): string[] {
  const signals: string[] = [];
  for (const { pattern, label } of DM_SIGNAL_PATTERNS) {
    if (pattern.test(bio)) {
      signals.push(label);
    }
  }
  return signals;
}

export function enrichProfile(profile: ProfileData, sourceHashtag: string, source: 'scraper' | 'manual'): Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'status' | 'notes'> {
  const has_linktree = isLinktreeUrl(profile.website_url);
  const bio_keywords = extractSignals(profile.bio ?? '');

  const lead_score = calculateLeadScore({
    website_url: has_linktree ? null : profile.website_url,
    has_linktree,
    bio_keywords,
    follower_count: profile.follower_count,
    post_count: profile.post_count,
    bio: profile.bio ?? '',
  });

  return {
    instagram_handle: profile.instagram_handle,
    display_name: profile.display_name,
    bio: profile.bio,
    profile_pic_url: profile.profile_pic_url,
    follower_count: profile.follower_count,
    following_count: profile.following_count,
    post_count: profile.post_count,
    website_url: profile.website_url,
    has_linktree,
    bio_keywords,
    lead_score,
    source,
    source_hashtag: sourceHashtag,
  };
}
