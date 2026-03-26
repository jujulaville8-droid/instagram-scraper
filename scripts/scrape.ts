import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { scrapeHashtag } from '../src/lib/scraper/instagram';
import type { ProfileData } from '../src/lib/types';
import type { ScrapeResult } from '../src/lib/scraper/instagram';

// Load env from .env.local
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const API_BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const API_SECRET = process.env.API_SECRET;
const SESSION_COOKIE = process.env.INSTAGRAM_SESSION_ID;
const QUEUE_FILE = path.resolve(__dirname, '..', '.scrape-queue.json');

interface QueueEntry {
  hashtag: string;
  profiles: ProfileData[];
  timestamp: string;
}

async function fetchActiveHashtags(): Promise<string[]> {
  if (!API_SECRET) {
    console.error('[cli] API_SECRET not set in .env.local');
    process.exit(1);
  }

  const res = await fetch(`${API_BASE}/api/hashtags`, {
    headers: { Authorization: `Bearer ${API_SECRET}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch hashtags: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as Array<{ hashtag: string; is_active: boolean }>;
  return data.filter(h => h.is_active).map(h => h.hashtag);
}

async function sendToEnrichAPI(
  profiles: ProfileData[],
  hashtag: string,
): Promise<{ total: number; new_leads: number; high_score: number } | null> {
  if (!API_SECRET) {
    console.error('[cli] API_SECRET not set');
    return null;
  }

  try {
    const res = await fetch(`${API_BASE}/api/enrich`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_SECRET}`,
      },
      body: JSON.stringify({
        profiles,
        source: 'scraper',
        source_hashtag: hashtag,
      }),
    });

    if (!res.ok) {
      throw new Error(`Enrich API returned ${res.status}: ${res.statusText}`);
    }

    return (await res.json()) as { total: number; new_leads: number; high_score: number };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[cli] API unreachable: ${msg}`);
    return null;
  }
}

function queueLocally(hashtag: string, profiles: ProfileData[]): void {
  let queue: QueueEntry[] = [];

  if (fs.existsSync(QUEUE_FILE)) {
    try {
      queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8')) as QueueEntry[];
    } catch {
      queue = [];
    }
  }

  queue.push({
    hashtag,
    profiles,
    timestamp: new Date().toISOString(),
  });

  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
  console.log(`[cli] Queued ${profiles.length} profiles locally to ${QUEUE_FILE}`);
}

async function processHashtag(hashtag: string): Promise<void> {
  if (!SESSION_COOKIE) {
    console.error('[cli] INSTAGRAM_SESSION_ID not set in .env.local');
    process.exit(1);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`[cli] Scraping hashtag: #${hashtag}`);
  console.log(`${'='.repeat(60)}`);

  const result: ScrapeResult = await scrapeHashtag(hashtag, SESSION_COOKIE);

  if (result.blocked) {
    console.warn('[cli] WARNING: Instagram blocked the scraper. Try again later or rotate session.');
  }

  if (result.error) {
    console.error(`[cli] Scrape error: ${result.error}`);
  }

  if (result.profiles.length === 0) {
    console.log('[cli] No profiles scraped.');
    return;
  }

  console.log(`[cli] Scraped ${result.profiles.length} profiles. Sending to enrich API...`);

  const apiResult = await sendToEnrichAPI(result.profiles, hashtag);

  if (apiResult) {
    console.log(`[cli] Enrich API result:`);
    console.log(`  Total processed: ${apiResult.total}`);
    console.log(`  New leads:       ${apiResult.new_leads}`);
    console.log(`  High score:      ${apiResult.high_score}`);
  } else {
    console.log('[cli] API unreachable - queueing results locally.');
    queueLocally(hashtag, result.profiles);
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage:');
    console.log('  npx tsx scripts/scrape.ts <hashtag>     Scrape a specific hashtag');
    console.log('  npx tsx scripts/scrape.ts --all          Scrape all active hashtags');
    process.exit(0);
  }

  if (args[0] === '--all') {
    console.log('[cli] Fetching active hashtags from API...');
    const hashtags = await fetchActiveHashtags();

    if (hashtags.length === 0) {
      console.log('[cli] No active hashtags found.');
      return;
    }

    console.log(`[cli] Found ${hashtags.length} active hashtags: ${hashtags.join(', ')}`);

    for (const hashtag of hashtags) {
      await processHashtag(hashtag);
    }
  } else {
    const hashtag = args[0].replace(/^#/, '');
    await processHashtag(hashtag);
  }

  console.log('\n[cli] Done.');
}

main().catch(err => {
  console.error('[cli] Fatal error:', err);
  process.exit(1);
});
