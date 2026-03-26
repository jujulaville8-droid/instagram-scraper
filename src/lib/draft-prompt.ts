interface DraftInput {
  display_name: string | null;
  bio: string | null;
  bio_keywords: string[];
  has_linktree: boolean;
  website_url: string | null;
  lead_score: number;
  template?: string;
}

export function buildDraftPrompt(input: DraftInput): string {
  const name = input.display_name ?? 'this business';
  const problems: string[] = [];

  if (!input.website_url || input.has_linktree) problems.push('no website');
  if (input.has_linktree) problems.push('using a link-in-bio service instead of a real site');
  if (input.bio_keywords.length > 0) problems.push(`running business through DMs (${input.bio_keywords.join(', ')})`);

  const problemStr = problems.length > 0
    ? `They currently have: ${problems.join('; ')}.`
    : 'They may benefit from a professional web presence.';

  return `Write a short, personalized cold DM (under 100 words) to ${name} offering website building services.

Their Instagram bio: "${input.bio ?? 'N/A'}"
${problemStr}

Rules:
- Professional but conversational, not salesy
- Reference something specific from their bio
- Mention the specific problem you noticed
- End with a low-pressure question
- No emojis overload, max 1-2
${input.template ? `\nBase template to follow:\n${input.template}` : ''}`;
}
