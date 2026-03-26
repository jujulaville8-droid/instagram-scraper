import { describe, it, expect } from 'vitest';
import { buildDraftPrompt } from '../src/lib/draft-prompt';

describe('buildDraftPrompt', () => {
  it('includes business name and signals', () => {
    const prompt = buildDraftPrompt({
      display_name: 'Island Cuts Barbershop',
      bio: 'Best fades in Antigua. DM to book!',
      bio_keywords: ['dm to book'],
      has_linktree: true,
      website_url: null,
      lead_score: 85,
    });
    expect(prompt).toContain('Island Cuts Barbershop');
    expect(prompt).toContain('no website');
  });

  it('handles no signals gracefully', () => {
    const prompt = buildDraftPrompt({
      display_name: null,
      bio: null,
      bio_keywords: [],
      has_linktree: false,
      website_url: 'https://example.com',
      lead_score: 10,
    });
    expect(prompt).toContain('this business');
    expect(prompt).toContain('professional web presence');
  });
});
