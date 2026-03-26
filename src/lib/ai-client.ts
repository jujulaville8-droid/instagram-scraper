import OpenAI from 'openai';

export async function generateText(systemPrompt: string, userPrompt: string): Promise<string> {
  const provider = process.env.AI_PROVIDER ?? 'openai';

  if (provider === 'openai') {
    const openai = new OpenAI({ apiKey: process.env.AI_API_KEY });
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 200,
    });
    return response.choices[0]?.message?.content ?? '';
  }

  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const anthropic = new Anthropic({ apiKey: process.env.AI_API_KEY });
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 200,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });
  const block = response.content[0];
  return block.type === 'text' ? block.text : '';
}
