const DM_SIGNAL_PATTERNS = [
  /dm\s*(to|for|us)/i,
  /whatsapp/i,
  /call\s*to\s*book/i,
  /message\s*us/i,
  /inbox/i,
  /order\s*via\s*dm/i,
  /send\s*(a\s*)?dm/i,
];

const BUSINESS_CATEGORY_PATTERNS = [
  /salon/i, /restaurant/i, /shop/i, /boutique/i, /bakery/i,
  /barber/i, /fitness/i, /photographer/i, /catering/i, /cleaning/i,
  /nails/i, /hair/i, /makeup/i, /tattoo/i, /florist/i,
  /cafe/i, /bar\b/i, /gym/i, /studio/i, /coach/i,
  /tutor/i, /plumb/i, /electric/i, /landscap/i, /tailor/i,
];

interface ScoreInput {
  website_url: string | null;
  has_linktree: boolean;
  bio_keywords: string[];
  follower_count: number;
  post_count: number;
  bio: string;
}

export function calculateLeadScore(input: ScoreInput): number {
  let score = 0;

  // +30: No website
  if (!input.website_url) score += 30;

  // +20: Has Linktree or similar
  if (input.has_linktree) score += 20;

  // +25: DM/WhatsApp signals in bio or keywords
  const hasDmSignal = input.bio_keywords.length > 0 ||
    DM_SIGNAL_PATTERNS.some(p => p.test(input.bio));
  if (hasDmSignal) score += 25;

  // +15: Small but active (under 1000 followers, 20+ posts)
  if (input.follower_count < 1000 && input.post_count > 20) score += 15;

  // +10: Business category keywords in bio
  const hasBusinessKeyword = BUSINESS_CATEGORY_PATTERNS.some(p => p.test(input.bio));
  if (hasBusinessKeyword) score += 10;

  return Math.min(score, 100);
}
