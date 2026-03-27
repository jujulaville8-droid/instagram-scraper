import { chromium } from 'playwright';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const API_BASE = 'http://localhost:3000';
const API_SECRET = process.env.API_SECRET!;
const HASHTAGS = process.argv.slice(2);

if (HASHTAGS.length === 0) {
  console.log('Usage: npx tsx scripts/validated-scrape.ts <hashtag1> <hashtag2> ...');
  process.exit(1);
}

function isValidHandle(handle: string): boolean {
  const lower = handle.toLowerCase();
  if (lower.endsWith('.com') || lower.endsWith('.net') || lower.endsWith('.org') ||
      lower.endsWith('.co') || lower.endsWith('.io') || lower.endsWith('.ag') ||
      lower.endsWith('.gov') || lower.endsWith('.edu')) return false;
  const blacklist = ['gmail','hotmail','outlook','yahoo','instagram','facebook',
    'twitter','tiktok','youtube','tripadvisor','followers','explore','reels','stories','p','reel'];
  if (blacklist.includes(lower)) return false;
  if (handle.length < 2) return false;
  if (handle.endsWith('.')) return false;
  return true;
}

function parseCount(s: string): number {
  const c = s.replace(/,/g, '').trim();
  if (c.match(/[Kk]$/)) return Math.round(parseFloat(c.slice(0, -1)) * 1000);
  if (c.match(/[Mm]$/)) return Math.round(parseFloat(c.slice(0, -1)) * 1000000);
  return parseInt(c) || 0;
}

async function delay(min = 3000, max = 6000) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log(`\n=== VALIDATED SCRAPE: ${HASHTAGS.join(', ')} ===\n`);

  const context = await chromium.launchPersistentContext('', {
    headless: false,
    channel: 'chrome',
    viewport: { width: 1280, height: 720 },
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
  });

  await context.addCookies([{
    name: 'sessionid', value: process.env.INSTAGRAM_SESSION_COOKIE!,
    domain: '.instagram.com', path: '/', httpOnly: true, secure: true, sameSite: 'None' as const,
  }]);

  const page = await context.newPage();
  await page.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => false }); });

  // Check login
  await page.goto('https://www.instagram.com/', { waitUntil: 'load', timeout: 30000 });
  await delay(2000, 4000);
  if (page.url().includes('/accounts/login')) {
    console.log('Logging in...');
    await page.fill('input[name="username"]', process.env.INSTAGRAM_USERNAME!);
    await delay(500, 1000);
    await page.fill('input[name="password"]', process.env.INSTAGRAM_PASSWORD!);
    await delay(500, 1000);
    await page.click('button[type="submit"]');
    await delay(5000, 7000);
    try { await page.locator('button:has-text("Not Now")').first().click({ timeout: 3000 }); } catch {}
    try { await page.locator('button:has-text("Not Now")').first().click({ timeout: 3000 }); } catch {}
  }
  console.log('Logged in!\n');

  let totalNew = 0;
  let totalSkipped = 0;

  for (const hashtag of HASHTAGS) {
    console.log(`\n========== #${hashtag} ==========`);
    
    // Navigate to hashtag
    await page.goto(`https://www.instagram.com/explore/tags/${hashtag}/`, { waitUntil: 'load', timeout: 30000 });
    await delay(6000, 10000);

    if (page.url().includes('/accounts/login')) {
      console.log('Session expired, stopping.');
      break;
    }

    // Extract post links
    const postLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]'));
      return [...new Set(links.map(l => (l as HTMLAnchorElement).href))];
    });
    console.log(`Found ${postLinks.length} posts`);

    // Visit posts to find handles
    const handles = new Set<string>();
    for (const postLink of postLinks.slice(0, 35)) {
      try {
        await page.goto(postLink, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await delay(2000, 4000);

        const handle = await page.evaluate(() => {
          // Try header link
          const headerLink = document.querySelector('header a[href^="/"]');
          if (headerLink) {
            const href = headerLink.getAttribute('href');
            const match = href?.match(/^\/([a-zA-Z0-9._]+)\/?$/);
            if (match) return match[1];
          }
          // Try og:description
          const og = document.querySelector('meta[property="og:description"]')?.getAttribute('content');
          if (og) {
            const m = og.match(/@([a-zA-Z0-9._]+)/);
            if (m) return m[1];
          }
          return null;
        });

        if (handle && isValidHandle(handle) && !handles.has(handle)) {
          handles.add(handle);
          console.log(`  Found: @${handle} (${handles.size})`);
        }
      } catch {}
      if (handles.size >= 20) break;
    }

    console.log(`Collected ${handles.size} handles. Validating profiles...`);

    // Visit each profile, validate it exists, extract data
    const validProfiles: any[] = [];
    for (const handle of handles) {
      try {
        await page.goto(`https://www.instagram.com/${handle}/`, { waitUntil: 'load', timeout: 20000 });
        await delay(3000, 5000);

        // Check if profile exists
        const pageTitle = await page.title();
        const pageUrl = page.url();
        if (pageTitle.includes('Page Not Found') || pageUrl.includes('/accounts/login')) {
          console.log(`  SKIP @${handle} — profile doesn't exist`);
          totalSkipped++;
          continue;
        }

        // Check for "Sorry, this page isn't available" in page content
        const notAvailable = await page.evaluate(() => {
          return document.body.innerText.includes("Sorry, this page isn't available");
        });
        if (notAvailable) {
          console.log(`  SKIP @${handle} — page not available`);
          totalSkipped++;
          continue;
        }

        // Extract profile data
        const data = await page.evaluate(() => {
          const meta = document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
          const countMatch = meta.match(/([\d,.KkMm]+)\s*Followers.*?([\d,.KkMm]+)\s*Following.*?([\d,.KkMm]+)\s*Posts/i);

          const nameEl = document.querySelector('header h2, header section h1, header section h2');
          const displayName = nameEl?.textContent?.trim() ?? null;

          const bioEl = document.querySelector('header section > div > span, header section > div:last-of-type > span');
          const bio = bioEl?.textContent?.trim() ?? null;

          const picEl = document.querySelector('header img') as HTMLImageElement;
          const profilePic = picEl?.src ?? null;

          let website: string | null = null;
          const extLinks = document.querySelectorAll('a[href*="l.instagram.com"], a[rel*="nofollow"]');
          for (const link of extLinks) {
            const href = link.getAttribute('href');
            if (!href || (!href.includes('l.instagram.com'))) continue;
            try {
              const url = new URL(href);
              const real = url.searchParams.get('u');
              if (real) { website = decodeURIComponent(real).split('?')[0]; break; }
            } catch {}
          }
          if (!website) {
            const allLinks = document.querySelectorAll('a');
            for (const link of allLinks) {
              const text = link.textContent?.trim() ?? '';
              if (text.match(/^[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}/) && !text.includes('instagram.com')) {
                website = text.startsWith('http') ? text : `https://${text}`;
                break;
              }
            }
          }

          return {
            displayName, bio, profilePic, website,
            followers: countMatch?.[1] ?? '0',
            following: countMatch?.[2] ?? '0',
            posts: countMatch?.[3] ?? '0',
          };
        });

        const followers = parseCount(data.followers);
        
        // Skip if 0 followers AND no display name (likely dead)
        if (followers === 0 && !data.displayName) {
          console.log(`  SKIP @${handle} — empty profile`);
          totalSkipped++;
          continue;
        }

        validProfiles.push({
          instagram_handle: `@${handle}`,
          display_name: data.displayName,
          bio: data.bio,
          profile_pic_url: data.profilePic,
          follower_count: followers,
          following_count: parseCount(data.following),
          post_count: parseCount(data.posts),
          website_url: data.website,
        });

        const siteStatus = data.website ? `site: ${data.website.slice(0, 40)}` : 'NO SITE';
        console.log(`  OK @${handle} — ${followers} followers | ${siteStatus}`);

      } catch (err: any) {
        console.log(`  ERROR @${handle}: ${err.message?.slice(0, 60)}`);
        totalSkipped++;
      }
    }

    // Send valid profiles to enrich API
    if (validProfiles.length > 0) {
      console.log(`\nEnriching ${validProfiles.length} validated profiles...`);
      try {
        const res = await fetch(`${API_BASE}/api/enrich`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_SECRET}` },
          body: JSON.stringify({ profiles: validProfiles, source: 'scraper', source_hashtag: hashtag }),
        });
        const json = await res.json();
        totalNew += json.new_leads ?? 0;
        console.log(`Added ${json.new_leads ?? 0} new leads (${json.high_score ?? 0} high score)`);
      } catch (err: any) {
        console.log(`API error: ${err.message}`);
      }
    } else {
      console.log('No valid profiles found for this hashtag.');
    }

    await delay(3000, 5000);
  }

  await context.close();

  console.log(`\n========================================`);
  console.log(`DONE: ${totalNew} new leads added, ${totalSkipped} skipped`);
  console.log(`========================================\n`);
}

main().catch(console.error);
