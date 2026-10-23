/**
 * Astro configuration file.
 * Handles site URL resolution (with environment variable support),
 * prerendering with the Cloudflare adapter (see docs/site-architecture.md),
 * and Vite-specific build optimizations.
 */
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import mdx from '@astrojs/mdx';
import staticHeaders from './src/integrations/static-headers.mjs';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DEFAULT_ORIGIN = 'https://nickcardoso.com';

/** Normalizes a URL by removing trailing slashes. */
const normalizeOrigin = (value) => value?.trim().replace(/\/+$/, '');

/**
 * Fallback to reading ORIGIN from .env manually if process.env is not yet populated.
 * This is useful during early build stages or specific CLI invocations.
 */
const readOriginFromDotEnv = () => {
  try {
    const dotEnv = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
    const match = dotEnv.match(/^\s*ORIGIN\s*=\s*(.*)\s*$/m);
    if (!match) {
      return undefined;
    }

    const value = match[1].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      return value.slice(1, -1).trim();
    }

    return value;
  } catch {
    return undefined;
  }
};

/**
 * Resolves the final site origin based on environment variables.
 * Enforces HTTPS in production to ensure secure link generation and CSP compliance.
 */
const resolveSiteOrigin = () => {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const rawOrigin = normalizeOrigin(
    process.env.ORIGIN ?? readOriginFromDotEnv()
  );

  if (!rawOrigin) {
    if (nodeEnv === 'production') {
      throw new Error(
        'Missing ORIGIN: set ORIGIN in .env for production builds.'
      );
    }

    return DEFAULT_ORIGIN;
  }

  let parsed;
  try {
    parsed = new URL(rawOrigin);
  } catch {
    throw new Error(
      `Invalid ORIGIN: "${rawOrigin}" is not a valid absolute URL.`
    );
  }

  if (nodeEnv === 'production' && parsed.protocol !== 'https:') {
    throw new Error(
      `Invalid ORIGIN: expected an https URL in production, got "${rawOrigin}".`
    );
  }

  return parsed.origin;
};

const site = resolveSiteOrigin();

export default defineConfig({
  /** The base URL for the built site. */
  site,
  redirects: {
    '/about/': { status: 301, destination: '/' },
    '/colophon/': { status: 301, destination: '/' },
  },
  devToolbar: { enabled: false },
  /**
   * Keep client-side navigation, but disable link prefetching: HTML is
   * served `max-age=0, must-revalidate`, so the ClientRouter's fetch() can't
   * reuse a prefetched copy and every prefetch would just double the request.
   */
  prefetch: false,
  /**
   * Pages are prerendered (the default 'static' output); routes that opt out
   * with `export const prerender = false` (/api/csp-report) run in the Worker.
   * Static headers, including each page's CSP, come from staticHeaders().
   */
  adapter: cloudflare(),
  /** No route uses Astro sessions, so skip the adapter's SESSION KV binding. */
  session: false,
  integrations: [mdx(), staticHeaders()],
  /** Standardizes URLs to always have a trailing slash. */
  trailingSlash: 'always',
  vite: {
    build: {
      /**
       * Never inline bundled scripts: the ClientRouter waits for inline module
       * scripts by injecting a `data:` script, which the CSP blocks. External
       * /_astro/ scripts are allowed by 'self'. CSS keeps the default limit.
       */
      assetsInlineLimit: (filePath) =>
        filePath.endsWith('.js') ? false : undefined,
      rollupOptions: {
        /** Custom warning handler to suppress known/expected noise from Astro internals. */
        onwarn(warning, defaultHandler) {
          const isKnownAstroWarning =
            warning.code === 'UNUSED_EXTERNAL_IMPORT' &&
            warning.message.includes('@astrojs/internal-helpers/remote') &&
            warning.message.includes('matchHostname');

          if (isKnownAstroWarning) {
            return;
          }

          defaultHandler(warning);
        },
      },
    },
  },
});
