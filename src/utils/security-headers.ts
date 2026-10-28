/**
 * Security and cache header rules, shared by the build step that writes the
 * static `_headers` file (src/integrations/static-headers.mjs) and the
 * middleware that covers on-demand responses (API routes, 404s).
 *
 * Pages are prerendered, so inline scripts are allowed by SHA-256 hash rather
 * than a per-request nonce. Keep this module free of Node and Astro imports:
 * it runs in the Astro config loader, the Worker, and Vitest.
 */

/**
 * Trailing slash required: with `trailingSlash: 'always'` the bare path
 * 308-redirects, and browsers drop reports rather than follow it.
 */
export const REPORT_PATH = '/api/csp-report/';

/** Cloudflare `_headers` limits (developers.cloudflare.com/workers/static-assets/headers/). */
export const HEADERS_FILE_MAX_RULES = 100;
export const HEADERS_FILE_MAX_LINE = 2000;

export interface CspOptions {
  /** Absolute URL that receives CSP violation reports. */
  reportEndpoint: string;
  /** `'sha256-…'` sources for the inline scripts the page may run. */
  scriptHashes?: readonly string[];
  /** Standalone pages in public/projects load Google Fonts. */
  allowGoogleFonts?: boolean;
}

/**
 * Builds the Content-Security-Policy value. Scripts are limited to same-origin
 * files plus the listed inline-script hashes: no 'unsafe-inline', no nonces.
 */
export const buildContentSecurityPolicy = ({
  reportEndpoint,
  scriptHashes = [],
  allowGoogleFonts = false,
}: CspOptions): string => {
  const scriptSources = ["'self'", ...scriptHashes.map((h) => `'${h}'`)];
  const fontStyles = allowGoogleFonts ? ' https://fonts.googleapis.com' : '';
  const fontFiles = allowGoogleFonts ? ' https://fonts.gstatic.com' : '';

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
    "form-action 'self'",
    "img-src 'self' data: https://img.shields.io https://github.com",
    `font-src 'self' data:${fontFiles}`,
    "connect-src 'self'",
    "manifest-src 'self'",
    "media-src 'self'",
    "worker-src 'self'",
    `style-src 'self' 'unsafe-inline'${fontStyles}`,
    "style-src-attr 'unsafe-inline'",
    `script-src ${scriptSources.join(' ')}`,
    "script-src-attr 'none'",
    `report-uri ${reportEndpoint}`,
    'report-to csp-endpoint',
    'upgrade-insecure-requests',
  ].join('; ');
};

/**
 * Every security header except Content-Security-Policy, which is per page.
 */
export const buildSecurityHeaders = (
  reportEndpoint: string
): Record<string, string> => ({
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-DNS-Prefetch-Control': 'off',
  'X-XSS-Protection': '0',
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), usb=(), payment=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  // COEP/CORP stay off so third-party embeds (YouTube) keep working.
  'Accept-CH': 'Sec-CH-UA, Sec-CH-UA-Mobile, Sec-CH-UA-Platform',
  'Origin-Agent-Cluster': '?1',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'Reporting-Endpoints': `csp-endpoint="${reportEndpoint}"`,
  'Report-To': JSON.stringify({
    group: 'csp-endpoint',
    max_age: 10886400,
    endpoints: [{ url: reportEndpoint }],
  }),
});

const IMMUTABLE_IMAGES =
  'public, max-age=2592000, stale-while-revalidate=604800';
const STATIC_IMAGES = 'public, max-age=604800, stale-while-revalidate=86400';
const SITE_METADATA = 'public, max-age=3600, stale-while-revalidate=86400';

/**
 * Cache-Control for static files, by `_headers` pattern. The patterns must
 * not overlap each other or the adapter's `/_astro/*` rule: Cloudflare joins
 * duplicate values with a comma, which would make a contradictory header.
 * Anything unlisted (HTML, /scene.js) gets Cloudflare's default,
 * `public, max-age=0, must-revalidate`.
 */
export const CACHE_RULES: readonly (readonly [string, string])[] = [
  // Background URLs carry a ?v= version, and a name's content never changes.
  ['/backgrounds/*', IMMUTABLE_IMAGES],
  ['/project-icons/*', STATIC_IMAGES],
  ['/project-assets/*', STATIC_IMAGES],
  ['/projects/mimick/assets/*', STATIC_IMAGES],
  ['/favicon.ico', STATIC_IMAGES],
  ['/favicon.svg', STATIC_IMAGES],
  ['/favicon-16x16.png', STATIC_IMAGES],
  ['/favicon-32x32.png', STATIC_IMAGES],
  ['/apple-touch-icon.png', STATIC_IMAGES],
  ['/android-chrome-192x192.png', STATIC_IMAGES],
  ['/android-chrome-512x512.png', STATIC_IMAGES],
  ['/robots.txt', SITE_METADATA],
  ['/llms.txt', SITE_METADATA],
  ['/site.webmanifest', SITE_METADATA],
  ['/sitemap.xml', SITE_METADATA],
  ['/sitemap-index.xml', SITE_METADATA],
];

const EXECUTABLE_SCRIPT_TYPES = new Set([
  '',
  'module',
  'importmap',
  'text/javascript',
  'application/javascript',
  'text/ecmascript',
  'application/ecmascript',
]);

const SCRIPT_BLOCK = /<script\b([^>]*)>([\s\S]*?)<\/script\b[^>]*>/gi;

const attributeValue = (attributes: string, name: string) =>
  new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i')
    .exec(attributes)
    ?.slice(1)
    .find((value) => value !== undefined);

/**
 * Returns the source of every inline script the browser would execute, i.e.
 * the ones a CSP hash must cover. Skips `src=` scripts (allowed by 'self')
 * and data blocks such as JSON-LD.
 */
export const extractInlineScripts = (html: string): string[] => {
  const sources: string[] = [];
  for (const [, attributes = '', body = ''] of html.matchAll(SCRIPT_BLOCK)) {
    if (/\bsrc\s*=/i.test(attributes)) {
      continue;
    }
    const type = (attributeValue(attributes, 'type') ?? '')
      .trim()
      .toLowerCase();
    if (EXECUTABLE_SCRIPT_TYPES.has(type)) {
      sources.push(body);
    }
  }
  return sources;
};

/**
 * Inline event handlers and javascript: URLs, which `script-src-attr 'none'`
 * and the hash-only script-src block. Script bodies are stripped first so
 * markup built inside JavaScript strings isn't reported.
 */
export const findBlockedInlineCode = (html: string): string[] => {
  const markup = html.replace(SCRIPT_BLOCK, ' ');
  const handlers = markup.match(/<[a-z][^>]*?\son[a-z]+\s*=/gi) ?? [];
  const jsUrls =
    markup.match(/\b(?:href|src|action)\s*=\s*["']?\s*javascript:/gi) ?? [];
  return [...handlers, ...jsUrls].map((m) => m.slice(0, 120));
};

const toBase64 = (bytes: Uint8Array) => {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
};

/**
 * CSP hash source for an inline script. The HTML parser turns CRLF and CR
 * into LF before the browser hashes a script, so this does the same.
 */
export const hashInlineScript = async (source: string): Promise<string> => {
  const normalized = source.replace(/\r\n?/g, '\n');
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(normalized)
  );
  return `sha256-${toBase64(new Uint8Array(digest))}`;
};

/**
 * Maps a built HTML file (relative to the client output folder) to the URL
 * Cloudflare serves it at: `a/index.html` → `/a/`, `a/b.html` → `/a/b`.
 */
export const htmlFileToUrlPath = (relativePath: string): string => {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  if (normalized === 'index.html') {
    return '/';
  }
  if (normalized.endsWith('/index.html')) {
    return `/${normalized.slice(0, -'index.html'.length)}`;
  }
  return `/${normalized.replace(/\.html$/, '')}`;
};

export interface HeaderRule {
  pattern: string;
  headers: Readonly<Record<string, string>>;
}

/** Serializes rules in Cloudflare `_headers` syntax. */
export const renderHeaderRules = (rules: readonly HeaderRule[]): string =>
  rules
    .map(
      ({ pattern, headers }) =>
        `${pattern}\n${Object.entries(headers)
          .map(([name, value]) => `  ${name}: ${value}`)
          .join('\n')}`
    )
    .join('\n\n') + '\n';

/**
 * Checks a complete `_headers` file against Cloudflare's limits and for
 * header names that two overlapping rules would join into one value.
 * Returns human-readable problems; an empty list means it's valid.
 */
export const validateHeadersFile = (content: string): string[] => {
  const problems: string[] = [];
  const lines = content.split('\n');
  const rulePatterns = lines.filter((line) => line.startsWith('/'));

  if (rulePatterns.length > HEADERS_FILE_MAX_RULES) {
    problems.push(
      `${rulePatterns.length} rules (Cloudflare allows ${HEADERS_FILE_MAX_RULES})`
    );
  }
  lines.forEach((line, index) => {
    if (line.length > HEADERS_FILE_MAX_LINE) {
      problems.push(
        `line ${index + 1} is ${line.length} characters (limit ${HEADERS_FILE_MAX_LINE}): ${line.slice(0, 60)}…`
      );
    }
  });

  const duplicates = new Map<string, number>();
  for (const pattern of rulePatterns) {
    duplicates.set(pattern, (duplicates.get(pattern) ?? 0) + 1);
  }
  for (const [pattern, count] of duplicates) {
    if (count > 1) {
      problems.push(`pattern ${pattern} appears ${count} times`);
    }
  }
  return problems;
};
