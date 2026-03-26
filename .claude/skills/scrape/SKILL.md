---
name: scrape
description: Scrape Instagram hashtags for business leads. Usage: /scrape <hashtag> or /scrape --all
---

Run the Instagram scraper to discover small business leads from a hashtag.

## Usage
- `/scrape <hashtag>` — scrape a specific hashtag (e.g. `/scrape antiguasalon`)
- `/scrape --all` — scrape all active hashtags configured in the dashboard

## How to run
Execute this command from the `insta-lead-finder` project root:

```bash
cd ~/Claude/insta-lead-finder && npx tsx scripts/scrape.ts {{args}}
```

Ensure `.env.local` is configured with `INSTAGRAM_SESSION_COOKIE` and `API_SECRET`.
The Next.js dev server must be running (`npm run dev`) for enrichment to work.
