import { chromium, type Page } from 'playwright';
import { getRandomUserAgent, randomDelay, isBlockedPage } from './anti-ban';
import { buildProfileData } from './profile-parser';
import type { ProfileData } from '../types';

const MAX_PROFILES_PER_RUN = 50;

export interface ScrapeResult {
  profiles: ProfileData[];
  blocked: boolean;
  error: string | null;
}

/**
 * Parse the meta description tag to extract follower/following/post counts.
 * Instagram meta descriptions follow the format:
 * "X Followers, Y Following, Z Posts - ..."
 */
function parseMetaCounts(metaContent: string): {
  followers: string;
  following: string;
  posts: string;
} {
  const defaults = { followers: '0', following: '0', posts: '0' };

  // Match patterns like "1,234 Followers, 567 Following, 89 Posts"
  const followersMatch = metaContent.match(/([\d,.]+[KkMm]?)\s*Followers/i);
  const followingMatch = metaContent.match(/([\d,.]+[KkMm]?)\s*Following/i);
  const postsMatch = metaContent.match(/([\d,.]+[KkMm]?)\s*Posts/i);

  return {
    followers: followersMatch?.[1] ?? defaults.followers,
    following: followingMatch?.[1] ?? defaults.following,
    posts: postsMatch?.[1] ?? defaults.posts,
  };
}

/**
 * Extract unique post links from the hashtag explore page.
 */
async function extractPostLinks(page: Page): Promise<string[]> {
  // Scroll down a couple times to load more posts
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await randomDelay(1500, 3000);
  }

  const links = await page.$$eval('a[href*="/p/"]', anchors =>
    anchors
      .map(a => a.getAttribute('href'))
      .filter((href): href is string => href !== null)
      .map(href => {
        // Normalize to full URL
        if (href.startsWith('/')) return `https://www.instagram.com${href}`;
        return href;
      }),
  );

  // Deduplicate
  return [...new Set(links)];
}

/**
 * Extract the profile handle from a post page.
 */
async function extractHandleFromPost(page: Page): Promise<string | null> {
  // Try the post header link which contains the username
  const handle = await page
    .$eval(
      'header a[href^="/"], article a[href^="/"]',
      el => {
        const href = el.getAttribute('href');
        if (!href) return null;
        // Extract username from href like "/username/" or "/username"
        const match = href.match(/^\/([a-zA-Z0-9._]+)\/?$/);
        return match ? match[1] : null;
      },
    )
    .catch(() => null);

  if (handle && isValidHandle(handle)) return handle;

  // Fallback: look for the username in the page URL structure or meta tags
  const ogUrl = await page
    .$eval('meta[property="og:description"]', el => el.getAttribute('content'))
    .catch(() => null);

  if (ogUrl) {
    const usernameMatch = ogUrl.match(/@([a-zA-Z0-9._]+)/);
    if (usernameMatch && isValidHandle(usernameMatch[1])) return usernameMatch[1];
  }

  return null;
}

/**
 * Filter out fake handles that are actually email domains, websites, or generic words.
 */
function isValidHandle(handle: string): boolean {
  const lower = handle.toLowerCase();

  // Reject email domains
  if (lower.endsWith('.com') || lower.endsWith('.net') || lower.endsWith('.org') ||
      lower.endsWith('.co') || lower.endsWith('.io') || lower.endsWith('.ag') ||
      lower.endsWith('.gov') || lower.endsWith('.edu')) {
    return false;
  }

  // Reject known non-business handles
  const blacklist = [
    'gmail', 'hotmail', 'outlook', 'yahoo', 'instagram', 'facebook',
    'twitter', 'tiktok', 'youtube', 'tripadvisor', 'followers',
    'explore', 'reels', 'stories', 'p', 'reel',
  ];
  if (blacklist.includes(lower)) return false;

  // Must be at least 2 characters
  if (handle.length < 2) return false;

  return true;
}

/**
 * Scrape a single Instagram profile page and return ProfileData.
 */
async function scrapeProfile(page: Page, handle: string): Promise<ProfileData | null> {
  const profileUrl = `https://www.instagram.com/${handle}/`;
  await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await randomDelay(2000, 4000);

  if (page.url().includes('/accounts/login') || page.url().includes('/challenge')) {
    return null;
  }

  // Extract meta description for follower/following/post counts
  const metaDescription = await page
    .$eval('meta[name="description"]', el => el.getAttribute('content') ?? '')
    .catch(() => '');

  const metaOgDescription = await page
    .$eval('meta[property="og:description"]', el => el.getAttribute('content') ?? '')
    .catch(() => '');

  const description = metaDescription || metaOgDescription;
  const counts = parseMetaCounts(description);

  // Extract display name
  const displayName = await page
    .$eval(
      'header section h1, header section span[dir="auto"]',
      el => el.textContent?.trim() ?? null,
    )
    .catch(() => null);

  // Extract bio text - try multiple selectors
  const bio = await page
    .$eval('header section > div:last-of-type span', el => el.textContent?.trim() ?? null)
    .catch(() => null);

  // Extract profile pic URL
  const profilePicUrl = await page
    .$eval('header img[alt*="profile"]', el => el.getAttribute('src'))
    .catch(async () => {
      // Fallback: any img in header
      return page
        .$eval('header img', el => el.getAttribute('src'))
        .catch(() => null);
    });

  // Extract website URL from the profile — try multiple approaches
  const websiteUrl = await page.evaluate(() => {
    // Method 1: Look for any external link in the bio/header area
    const externalLinks = document.querySelectorAll('a[href*="l.instagram.com"], a[rel*="nofollow"]');
    for (const link of externalLinks) {
      const href = link.getAttribute('href');
      if (!href) continue;
      // Skip internal Instagram links
      if (href.includes('instagram.com/') && !href.includes('l.instagram.com')) continue;
      // Extract real URL from Instagram's redirect wrapper
      if (href.includes('l.instagram.com')) {
        try {
          const url = new URL(href);
          const real = url.searchParams.get('u');
          if (real) return decodeURIComponent(real);
        } catch { /* continue */ }
      }
      if (!href.startsWith('/') && !href.includes('instagram.com')) return href;
    }

    // Method 2: Look for visible link text that looks like a URL
    const allLinks = document.querySelectorAll('a');
    for (const link of allLinks) {
      const text = link.textContent?.trim() ?? '';
      const href = link.getAttribute('href') ?? '';
      // Link text that looks like a domain
      if (text.match(/^[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}/) && !text.includes('instagram.com')) {
        if (href.includes('l.instagram.com')) {
          try {
            const url = new URL(href);
            const real = url.searchParams.get('u');
            if (real) return decodeURIComponent(real);
          } catch { /* continue */ }
        }
        return text.startsWith('http') ? text : `https://${text}`;
      }
    }

    // Method 3: Check the page's JSON data (Instagram embeds profile data in script tags)
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent ?? '');
        if (data.url && !data.url.includes('instagram.com')) return data.url;
      } catch { /* continue */ }
    }

    return null;
  }).catch(() => null);

  return buildProfileData(
    handle,
    displayName,
    bio,
    profilePicUrl ?? null,
    counts.followers,
    counts.following,
    counts.posts,
    websiteUrl ?? null,
  );
}

export async function scrapeHashtag(
  hashtag: string,
  sessionCookie: string,
  maxProfiles = MAX_PROFILES_PER_RUN,
): Promise<ScrapeResult> {
  const result: ScrapeResult = {
    profiles: [],
    blocked: false,
    error: null,
  };

  let context: Awaited<ReturnType<typeof chromium.launchPersistentContext>> | null = null;

  try {
    // Launch headed browser with session cookie + realistic fingerprint
    console.log('[scraper] Launching browser with session cookie (headed mode)');
    context = await chromium.launchPersistentContext('', {
      headless: false,
      channel: 'chrome', // Use system Chrome binary — more realistic fingerprint
      viewport: { width: 1280, height: 720 },
      locale: 'en-US',
      timezoneId: 'America/New_York',
      args: [
        '--no-sandbox',
        '--disable-blink-features=AutomationControlled', // Hide automation flag
      ],
    });

    // Set all the cookies Instagram expects
    await context.addCookies([
      {
        name: 'sessionid',
        value: sessionCookie,
        domain: '.instagram.com',
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'None',
      },
      {
        name: 'ig_did',
        value: crypto.randomUUID(),
        domain: '.instagram.com',
        path: '/',
        secure: true,
        sameSite: 'None',
      },
      {
        name: 'csrftoken',
        value: crypto.randomUUID().replace(/-/g, ''),
        domain: '.instagram.com',
        path: '/',
        secure: true,
        sameSite: 'None',
      },
    ]);

    // Remove the webdriver flag that Instagram uses to detect Playwright
    const page0 = context.pages()[0] || await context.newPage();
    await page0.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });
    await page0.close();

    const page = await context.newPage();

    // Navigate to hashtag explore page
    const cleanedHashtag = hashtag.replace(/^#/, '');
    const hashtagUrl = `https://www.instagram.com/explore/tags/${cleanedHashtag}/`;

    // First navigate to Instagram home to check login status
    console.log('[scraper] Checking login status...');
    await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await randomDelay(2000, 3000);

    // If redirected to login, auto-login with credentials
    if (page.url().includes('/accounts/login')) {
      const igUser = process.env.INSTAGRAM_USERNAME;
      const igPass = process.env.INSTAGRAM_PASSWORD;
      if (igUser && igPass) {
        console.log('[scraper] Not logged in — auto-logging in...');
        await page.fill('input[name="username"]', igUser);
        await randomDelay(500, 1000);
        await page.fill('input[name="password"]', igPass);
        await randomDelay(500, 1000);
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
        await randomDelay(3000, 5000);
        console.log(`[scraper] After login, URL: ${page.url()}`);

        // Handle "Save Login Info" or "Turn On Notifications" popups
        try {
          const notNowBtn = page.locator('button:has-text("Not Now"), button:has-text("Not now")').first();
          if (await notNowBtn.isVisible({ timeout: 3000 })) {
            await notNowBtn.click();
            await randomDelay(1000, 2000);
          }
        } catch { /* no popup */ }
        try {
          const notNowBtn2 = page.locator('button:has-text("Not Now"), button:has-text("Not now")').first();
          if (await notNowBtn2.isVisible({ timeout: 3000 })) {
            await notNowBtn2.click();
            await randomDelay(1000, 2000);
          }
        } catch { /* no popup */ }
      } else {
        console.log('[scraper] Not logged in and no credentials set. Set INSTAGRAM_USERNAME and INSTAGRAM_PASSWORD.');
        result.blocked = true;
        result.error = 'Not logged in. Set INSTAGRAM_USERNAME and INSTAGRAM_PASSWORD in .env.local';
        return result;
      }
    } else {
      console.log('[scraper] Already logged in!');
    }

    // Now navigate to hashtag page
    console.log(`[scraper] Navigating to ${hashtagUrl}`);
    await page.goto(hashtagUrl, { waitUntil: 'load', timeout: 30000 });
    await randomDelay(6000, 10000); // Wait for Instagram's JS to fully render content

    // Check if we're blocked (only real blocks, not redirects)
    const currentUrl = page.url();
    const initialContent = await page.content();
    console.log(`[scraper] Current URL after navigation: ${currentUrl}`);

    // Instagram redirects hashtag URLs to search — that's fine, not a block
    const isLoginRedirect = currentUrl.includes('/accounts/login') || currentUrl.includes('/challenge');
    if (isLoginRedirect) {
      await page.screenshot({ path: 'scraper-blocked.png' });
      console.log('[scraper] Redirected to login page — session expired');
      result.blocked = true;
      result.error = 'Session expired — redirected to login';
      return result;
    }
    // Only check for hard blocks (URL-based), not content-based — Instagram pages
    // contain words like "action blocked" in their JS bundles even on normal pages

    // Save a screenshot for debugging
    await page.screenshot({ path: 'scraper-loaded.png' });
    console.log('[scraper] Page loaded successfully! Screenshot saved to scraper-loaded.png');

    // Extract post links from the hashtag page
    console.log('[scraper] Extracting post links...');
    const postLinks = await extractPostLinks(page);
    console.log(`[scraper] Found ${postLinks.length} post links`);

    if (postLinks.length === 0) {
      result.error = 'No posts found on hashtag page - the page may have changed or be empty';
      return result;
    }

    // Visit each post and extract the profile handle
    const seenHandles = new Set<string>();
    const handlesToScrape: string[] = [];

    for (const postLink of postLinks) {
      if (handlesToScrape.length >= maxProfiles) break;

      try {
        console.log(`[scraper] Visiting post: ${postLink}`);
        await page.goto(postLink, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await randomDelay(2000, 4000);

        // Check for login redirect (real block)
        if (page.url().includes('/accounts/login') || page.url().includes('/challenge')) {
          console.log('[scraper] Redirected to login — stopping');
          result.blocked = true;
          break;
        }

        const handle = await extractHandleFromPost(page);
        if (handle && !seenHandles.has(handle)) {
          seenHandles.add(handle);
          handlesToScrape.push(handle);
          console.log(`[scraper] Found handle: @${handle} (${handlesToScrape.length}/${maxProfiles})`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log(`[scraper] Error visiting post ${postLink}: ${msg}`);
        // Continue to next post
      }
    }

    console.log(`[scraper] Collected ${handlesToScrape.length} unique handles, scraping profiles...`);

    // Visit each profile and extract data
    for (const handle of handlesToScrape) {
      try {
        console.log(`[scraper] Scraping profile: @${handle}`);
        const profileData = await scrapeProfile(page, handle);

        if (profileData === null && !result.blocked) {
          if (page.url().includes('/accounts/login') || page.url().includes('/challenge')) {
            console.log('[scraper] Redirected to login — stopping');
            result.blocked = true;
            break;
          }
          console.log(`[scraper] Skipping @${handle} - could not parse profile`);
          continue;
        }

        if (profileData) {
          result.profiles.push(profileData);
          console.log(
            `[scraper] Scraped @${handle}: ${profileData.follower_count} followers`,
          );
        }

        await randomDelay(3000, 6000);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log(`[scraper] Error scraping @${handle}: ${msg}`);
        // Continue to next profile
      }
    }

    console.log(`[scraper] Done. Scraped ${result.profiles.length} profiles.`);
    await context.close();
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.error = msg;
    console.error(`[scraper] Fatal error: ${msg}`);
    if (context) await context.close();
    return result;
  }
}
