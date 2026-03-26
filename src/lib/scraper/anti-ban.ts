const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
];

export function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export function randomDelay(minMs = 3000, maxMs = 8000): Promise<void> {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function isBlockedPage(pageContent: string, url: string): boolean {
  const lower = pageContent.toLowerCase();

  // If we got redirected to login page, we're blocked
  if (url.includes('/accounts/login') || url.includes('/challenge')) {
    return true;
  }

  // Specific block signals — NOT just "login" which appears on every page
  const blockSignals = [
    'suspicious activity',
    'confirm your identity',
    'unusual login attempt',
    'we detected an automated behavior',
    'please wait a few minutes',
    'action blocked',
  ];
  return blockSignals.some(signal => lower.includes(signal));
}
