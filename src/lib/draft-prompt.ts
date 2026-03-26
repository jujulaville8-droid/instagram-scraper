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
  const name = input.display_name ?? 'there';
  const observations: string[] = [];

  if (!input.website_url && !input.has_linktree) observations.push('no website linked in their profile');
  if (input.has_linktree) observations.push('using a Linktree instead of their own website');
  if (input.bio_keywords.length > 0) observations.push(`taking orders/bookings through DMs`);

  const observationStr = observations.length > 0
    ? `What I noticed about their online presence: ${observations.join(', ')}.`
    : 'They could benefit from a stronger online presence.';

  return `You are a friendly, confident freelance web developer writing a short Instagram DM to a small business owner. Your goal is to start a conversation, NOT to close a sale in the first message.

ABOUT THE BUSINESS:
Name: ${name}
Bio: "${input.bio ?? 'N/A'}"
${observationStr}

WRITE A DM FOLLOWING THESE PROVEN COLD OUTREACH PRINCIPLES:

1. OPEN WITH A GENUINE COMPLIMENT about their business, product, or content. Be specific. Reference something real from their bio or what they do. This shows you actually looked at their page.

2. BRIDGE TO VALUE in one sentence. Connect what they do to how a website would help them specifically. Frame it as an opportunity, never a problem. Examples:
   - "I think a website could really help you reach even more customers"
   - "A site where people can browse and book directly would save you so much time"
   - "Your work deserves its own space online where people can find you"

3. END WITH A SOFT QUESTION that's easy to say yes to. Not "can I build you a website?" but something like:
   - "Would you be open to chatting about it?"
   - "Want me to show you what that could look like?"
   - "Is that something you've been thinking about?"

STRICT RULES:
- Maximum 3 short sentences. Keep it under 50 words. DMs that look like paragraphs get ignored.
- Write like a real person texting, not a marketer. Casual, warm, direct.
- NO dashes or em dashes anywhere in the message.
- NO undermining or negative language. Never say "I noticed you don't have..." or "your page is missing..." or anything that sounds like criticism.
- Everything must be POSITIVE and forward looking. Focus on what they COULD have, not what they lack.
- NO "I'm a web developer" or "I build websites" in the opener. Lead with THEM, not you.
- Maximum 1 emoji, placed naturally. Zero is fine too.
- Do not use quotation marks in the output.
- Do not include a subject line.
- Do not sign off with a name.
${input.template ? `\nADDITIONAL STYLE GUIDE:\n${input.template}` : ''}

Write ONLY the DM text, nothing else.`;
}
