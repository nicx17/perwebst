/**
 * Astro middleware for responses the Worker renders on demand (/api/csp-report
 * and 404s). Prerendered pages and public/ files are served from static
 * assets before the Worker runs; their headers come from the `_headers` file
 * written by src/integrations/static-headers.mjs. Both use the rules in
 * src/utils/security-headers.ts.
 *
 * Handles:
 * 1. Runtime environment validation
 * 2. Cross-site request safety checks (Fetch Metadata)
 * 3. Security headers, with a CSP that allows no inline scripts
 * 4. A no-cache default
 */
import { defineMiddleware } from 'astro:middleware';
import {
  REPORT_PATH,
  buildContentSecurityPolicy,
  buildSecurityHeaders,
} from './utils/security-headers';

const ALLOWED_NODE_ENVS = new Set(['development', 'test', 'production']);

type RuntimeEnvMap = Record<string, string | undefined>;

/**
 * Accesses the global process.env in a runtime-agnostic way.
 * This handles environments where `process` might not be globally available.
 */
const runtimeEnv: RuntimeEnvMap =
  (
    globalThis as typeof globalThis & {
      process?: { env?: RuntimeEnvMap };
    }
  ).process?.env ?? {};

/**
 * Parses a string value into a URL object, throwing if invalid.
 * Used for validating the ORIGIN environment variable.
 */
const parseOrigin = (value: string): URL => {
  try {
    return new URL(value);
  } catch {
    throw new Error(`Invalid ORIGIN: "${value}" is not a valid absolute URL.`);
  }
};

/**
 * Validates critical environment variables required for the application to run safely.
 */
const validateRuntimeEnv = () => {
  const nodeEnv = (runtimeEnv.NODE_ENV ?? 'development').trim();
  if (!ALLOWED_NODE_ENVS.has(nodeEnv)) {
    throw new Error(
      `Invalid NODE_ENV: "${nodeEnv}". Expected one of development, test, production.`
    );
  }

  const rawOrigin = runtimeEnv.ORIGIN?.trim();
  if (rawOrigin) {
    const parsedOrigin = parseOrigin(rawOrigin);
    if (nodeEnv === 'production' && parsedOrigin.protocol !== 'https:') {
      throw new Error(
        `Invalid ORIGIN: expected an https URL in production, got "${rawOrigin}".`
      );
    }
  }
};

validateRuntimeEnv();

/**
 * Validates that cross-site requests are safe based on Fetch Metadata headers.
 * Blocks potentially malicious cross-site POSTs/navigations while allowing standard GET-based entry.
 */
const isCrossSiteRequestSafe = (request: Request): boolean => {
  const site = request.headers.get('sec-fetch-site');

  if (
    !site ||
    site === 'same-origin' ||
    site === 'same-site' ||
    site === 'none'
  ) {
    return true;
  }

  const isSafeNavigation =
    request.method === 'GET' &&
    request.headers.get('sec-fetch-mode') === 'navigate' &&
    request.headers.get('sec-fetch-dest') === 'document';

  return isSafeNavigation;
};

/**
 * The primary middleware handler invoked for every request.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // Prerendered pages are built once; their headers live in _headers.
  if (context.isPrerendered) {
    return next();
  }

  // 1. Security check for cross-site requests in production.
  if (!import.meta.env.DEV && !isCrossSiteRequestSafe(context.request)) {
    return new Response('Forbidden Request Context', { status: 403 });
  }

  const response = await next();
  // Copy: headers on a response fetched from static assets are immutable.
  const headers = new Headers(response.headers);

  // 2. Apply security headers (production only: Vite's HMR needs inline scripts).
  if (!import.meta.env.DEV) {
    // context.site is the configured origin, so a spoofed Host header can't
    // redirect reports elsewhere.
    const origin = context.site?.origin ?? new URL(context.request.url).origin;
    const reportEndpoint = `${origin}${REPORT_PATH}`;
    for (const [name, value] of Object.entries(
      buildSecurityHeaders(reportEndpoint)
    )) {
      headers.set(name, value);
    }
    headers.set(
      'Content-Security-Policy',
      buildContentSecurityPolicy({ reportEndpoint })
    );
    headers.delete('Content-Security-Policy-Report-Only');
  }

  // 3. On-demand responses are per request, so don't let caches keep them.
  if (!headers.has('Cache-Control')) {
    headers.set('Cache-Control', 'no-store');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
