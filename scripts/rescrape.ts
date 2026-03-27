import { chromium } from 'playwright';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const API_BASE = 'http://localhost:3000';
const API_SECRET = process.env.API_SECRET!;
const SESSION_COOKIE = process.env.INSTAGRAM_SESSION_COOKIE!;
const HANDLES = process.argv.slice(2);

async function main() {
  console.log(`Re-scraping ${HANDLES.length} profiles...`);
  
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    channel: 'chrome',
    viewport: { width: 1280, height: 720 },
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
  });

  await context.addCookies([{
    name: 'sessionid', value: SESSION_COOKIE,
    domain: '.instagram.com', path: '/', httpOnly: true, secure: true, sameSite: 'None',
  }]);

  const page = await context.newPage();
  await page.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => false }); });

  // Check login
  await page.goto('https://www.instagram.com/', { waitUntil: 'load', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  
  if (page.url().includes('/accounts/login')) {
    const user = process.env.INSTAGRAM_USERNAME;
    const pass = process.env.INSTAGRAM_PASSWORD;
    if (user && pass) {
      console.log('Logging in...');
      await page.fill('input[name="username"]', user);
      await page.fill('input[name="password"]', pass);
      await page.click('button[type="submit"]');
      await new Promise(r => setTimeout(r, 5000));
      try { await page.locator('button:has-text("Not Now")').first().click({ timeout: 3000 }); } catch {}
      try { await page.locator('button:has-text("Not Now")').first().click({ timeout: 3000 }); } catch {}
    }
  }
  console.log('Logged in!');

  const results: any[] = [];
  
  for (const handle of HANDLES) {
    try {
      console.log(`Scraping @${handle}...`);
      await page.goto(`https://www.instagram.com/${handle}/`, { waitUntil: 'load', timeout: 20000 });
      await new Promise(r => setTimeout(r, 3000 + Math.random() * 3000));
      
      if (page.url().includes('/accounts/login')) {
        console.log('  Session expired, stopping');
        break;
      }

      const data = await page.evaluate(() => {
        const meta = document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
        
        // Parse counts from meta
        const countMatch = meta.match(/([\d,.KkMm]+)\s*Followers.*?([\d,.KkMm]+)\s*Following.*?([\d,.KkMm]+)\s*Posts/i);
        
        // Get display name
        const nameEl = document.querySelector('header h2, header section h1, header section h2');
        const displayName = nameEl?.textContent?.trim() ?? null;
        
        // Get bio
        const bioEl = document.querySelector('header section > div > span, header section > div:last-of-type > span');
        const bio = bioEl?.textContent?.trim() ?? null;
        
        // Get profile pic
        const picEl = document.querySelector('header img') as HTMLImageElement;
        const profilePic = picEl?.src ?? null;
        
        // Get website - comprehensive check
        let website: string | null = null;
        const extLinks = document.querySelectorAll('a[href*="l.instagram.com"], a[rel*="nofollow"]');
        for (const link of extLinks) {
          const href = link.getAttribute('href');
          if (!href) continue;
          if (href.includes('l.instagram.com')) {
            try {
              const url = new URL(href);
              const real = url.searchParams.get('u');
              if (real) { website = decodeURIComponent(real); break; }
            } catch {}
          }
        }
        // Also check visible link text
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
          meta
        };
      });
      
      // Parse counts
      const parseCount = (s: string) => {
        const c = s.replace(/,/g, '').trim();
        if (c.match(/[Kk]$/)) return Math.round(parseFloat(c.slice(0,-1)) * 1000);
        if (c.match(/[Mm]$/)) return Math.round(parseFloat(c.slice(0,-1)) * 1000000);
        return parseInt(c) || 0;
      };
      
      const profile = {
        instagram_handle: `@${handle}`,
        display_name: data.displayName,
        bio: data.bio,
        profile_pic_url: data.profilePic,
        follower_count: parseCount(data.followers),
        following_count: parseCount(data.following),
        post_count: parseCount(data.posts),
        website_url: data.website,
      };
      
      results.push(profile);
      console.log(`  ${parseCount(data.followers)} followers | website: ${data.website ?? 'none'} | bio: ${(data.bio ?? '').slice(0, 50)}...`);
      
    } catch (err: any) {
      console.log(`  Error: ${err.message?.slice(0, 80)}`);
    }
  }

  await context.close();
  
  // Send to enrich API
  if (results.length > 0) {
    console.log(`\nEnriching ${results.length} profiles...`);
    const res = await fetch(`${API_BASE}/api/enrich`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_SECRET}` },
      body: JSON.stringify({ profiles: results, source: 'scraper', source_hashtag: 'rescrape' }),
    });
    const json = await res.json();
    console.log(`Done! Total: ${json.total}, High score: ${json.high_score}`);
  }
}

main().catch(console.error);
