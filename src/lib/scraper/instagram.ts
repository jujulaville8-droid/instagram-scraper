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

  if (handle) return handle;

  // Fallback: look for the username in the page URL structure or meta tags
  const ogUrl = await page
    .$eval('meta[property="og:description"]', el => el.getAttribute('content'))
    .catch(() => null);

  if (ogUrl) {
    // OG description often starts with "X Likes, Y Comments - @username ..."
    const usernameMatch = ogUrl.match(/@([a-zA-Z0-9._]+)/);
    if (usernameMatch) return usernameMatch[1];
  }

  return null;
}

/**
 * Scrape a single Instagram profile page and return ProfileData.
 */
async function scrapeProfile(page: Page, handle: string): Promise<ProfileData | null> {
  const profileUrl = `https://www.instagram.com/${handle}/`;
  await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await randomDelay(2000, 4000);

  const pageContent = await page.content();
  if (isBlockedPage(pageContent)) {
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

  // Extract website URL from the profile
  const websiteUrl = await page
    .$eval('header a[rel="me nofollow noopener noreferrer"]', el => el.getAttribute('href'))
    .catch(async () => {
      // Fallback: look for external link in bio area
      return page
        .$eval(
          'header a[href^="https://l.instagram.com/"]',
          el => {
            const href = el.getAttribute('href');
            if (!href) return null;
            // Extract the actual URL from Instagram's redirect
            try {
              const url = new URL(href);
              return url.searchParams.get('u') ?? href;
            } catch {
              return href;
            }
          },
        )
        .catch(() => null);
    });

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

  let browser;

  try {
    // Launch headless browser
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const context = await browser.newContext({
      userAgent: getRandomUserAgent(),
      viewport: { width: 1280, height: 720 },
      locale: 'en-US',
    });

    // Set the Instagram session cookie
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
    ]);

    const page = await context.newPage();

    // Navigate to hashtag explore page
    const cleanedHashtag = hashtag.replace(/^#/, '');
    const hashtagUrl = `https://www.instagram.com/explore/tags/${cleanedHashtag}/`;

    console.log(`[scraper] Navigating to ${hashtagUrl}`);
    await page.goto(hashtagUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await randomDelay(3000, 5000);

    // Check if we're blocked
    const initialContent = await page.content();
    if (isBlockedPage(initialContent)) {
      console.log('[scraper] Blocked on hashtag page - login required or challenge detected');
      result.blocked = true;
      result.error = 'Blocked: Instagram requires login or presented a challenge';
      return result;
    }

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

        // Check for blocks
        const postContent = await page.content();
        if (isBlockedPage(postContent)) {
          console.log('[scraper] Blocked while visiting post');
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
          // Check if this was a block
          const currentContent = await page.content();
          if (isBlockedPage(currentContent)) {
            console.log('[scraper] Blocked while scraping profile');
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
    await browser.close();
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.error = msg;
    console.error(`[scraper] Fatal error: ${msg}`);
    if (browser) await browser.close();
    return result;
  }
}
