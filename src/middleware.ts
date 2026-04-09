/**
 * Astro middleware handles global concerns including:
 * 1. Runtime environment validation
 * 2. Security header injection (CSP, HSTS, etc.)
 * 3. Cache control strategies for different asset types
 * 4. Cross-site request safety checks
 */
import { defineMiddleware } from "astro:middleware";

const ALLOWED_NODE_ENVS = new Set(["development", "test", "production"]);

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
 * Validates critical environment variables required for the application to run safely,
 * especially in production. Ensures ORIGIN, HOST, and PORT are correctly configured.
 */
const validateRuntimeEnv = () => {
  const nodeEnv = (runtimeEnv.NODE_ENV ?? "development").trim();
  if (!ALLOWED_NODE_ENVS.has(nodeEnv)) {
    throw new Error(
      `Invalid NODE_ENV: "${nodeEnv}". Expected one of development, test, production.`
    );
  }

  const rawOrigin = runtimeEnv.ORIGIN?.trim();
  if (rawOrigin) {
    const parsedOrigin = parseOrigin(rawOrigin);
    if (nodeEnv === "production" && parsedOrigin.protocol !== "https:") {
      throw new Error(`Invalid ORIGIN: expected an https URL in production, got "${rawOrigin}".`);
    }
  } else if (nodeEnv === "production") {
    throw new Error("Missing ORIGIN: set ORIGIN in .env for production runtime.");
  }

  const rawHost = runtimeEnv.HOST?.trim();
  if (!rawHost && nodeEnv === "production") {
    throw new Error("Missing HOST: set HOST in .env for production runtime.");
  }

  const rawPort = runtimeEnv.PORT?.trim();
  if (rawPort) {
    const parsedPort = Number(rawPort);
    if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
      throw new Error(`Invalid PORT: "${rawPort}". Expected an integer between 1 and 65535.`);
    }
  } else if (nodeEnv === "production") {
    throw new Error("Missing PORT: set PORT in .env for production runtime.");
  }
};

validateRuntimeEnv();

/**
 * The origin derived from the environment, used for CSP report endpoints.
 */
const trustedReportOrigin = runtimeEnv.ORIGIN?.trim()
  ? parseOrigin(runtimeEnv.ORIGIN.trim()).origin
  : undefined;

/**
 * Constructs a strict Content Security Policy (CSP) string.
 * @param nonce - A cryptographically strong random string for inline script/style authorization.
 * @param reportEndpoint - The URI where the browser should send CSP violation reports.
 */
const buildSecurityPolicy = (nonce: string, reportEndpoint: string) =>
  [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "form-action 'self'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "manifest-src 'self'",
    "media-src 'self'",
    "worker-src 'self'",
    `style-src 'self' 'unsafe-inline'`,
    `style-src-elem 'self' 'unsafe-inline'`,
    "style-src-attr 'unsafe-inline'",
    `script-src 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline' 'self'`,
    `script-src-elem 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline' 'self'`,
    `script-src-attr 'none'`,
    `report-uri ${reportEndpoint}`,
    "report-to csp-endpoint",
    "upgrade-insecure-requests"
  ].join("; ");

/**
 * Injects a suite of security headers into the response.
 * Includes CSP, HSTS, X-Frame-Options, and more to harden the application.
 */
const setSecurityHeaders = (headers: Headers, requestUrl: URL, nonce: string) => {
  const reportEndpoint = `${trustedReportOrigin ?? requestUrl.origin}/api/csp-report`;
  headers.delete("Content-Security-Policy-Report-Only");
  headers.set("Content-Security-Policy", buildSecurityPolicy(nonce, reportEndpoint));
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-DNS-Prefetch-Control", "off");
  headers.set("X-Download-Options", "noopen");
  headers.set("X-XSS-Protection", "0");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), usb=(), payment=()");
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("Cross-Origin-Embedder-Policy", "require-corp");
  headers.set("Cross-Origin-Resource-Policy", "same-origin");
  headers.set("Accept-CH", "Sec-CH-UA, Sec-CH-UA-Mobile, Sec-CH-UA-Platform");
  headers.set("Origin-Agent-Cluster", "?1");
  headers.set("X-Permitted-Cross-Domain-Policies", "none");
  headers.set("Reporting-Endpoints", `csp-endpoint="${reportEndpoint}"`);
  headers.set(
    "Report-To",
    JSON.stringify({
      group: "csp-endpoint",
      max_age: 10886400,
      endpoints: [{ url: reportEndpoint }]
    })
  );

  if (requestUrl.protocol === "https:") {
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
};

/**
 * Implements a cache control strategy based on the request pathname.
 * - Astro internal assets: Immutable (1 year)
 * - Background images: Large cache (30 days) with stale-while-revalidate
 * - Other static assets: 7 days
 * - HTML/Dynamic Content: must-revalidate
 */
const setCacheHeaders = (headers: Headers, pathname: string) => {
  if (headers.has("Cache-Control")) {
    return;
  }

  if (pathname.startsWith("/_astro/")) {
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    return;
  }

  if (pathname.startsWith("/backgrounds/")) {
    headers.set("Cache-Control", "public, max-age=2592000, stale-while-revalidate=604800");
    return;
  }

  if (/\.(?:avif|webp|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/i.test(pathname)) {
    headers.set("Cache-Control", "public, max-age=604800, stale-while-revalidate=86400");
    return;
  }

  if (pathname.startsWith("/js/")) {
    headers.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=3600");
    return;
  }

  if (pathname.endsWith(".xml") || pathname.endsWith("robots.txt") || pathname.endsWith("site.webmanifest")) {
    headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    return;
  }

  headers.set("Cache-Control", "public, max-age=0, must-revalidate");
};

/**
 * Validates that cross-site requests are safe based on Fetch Metadata headers.
 * Blocks potentially malicious cross-site POSTs/navigations while allowing standard GET-based entry.
 */
const isCrossSiteRequestSafe = (request: Request): boolean => {
  const site = request.headers.get("sec-fetch-site");
  
  if (!site || site === "same-origin" || site === "same-site" || site === "none") {
    return true;
  }

  const isSafeNavigation =
    request.method === "GET" &&
    request.headers.get("sec-fetch-mode") === "navigate" &&
    request.headers.get("sec-fetch-dest") === "document";

  return isSafeNavigation;
};

/**
 * The primary middleware handler invoked for every request.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // 1. Security check for cross-site requests in production.
  if (!import.meta.env.DEV && !isCrossSiteRequestSafe(context.request)) {
    return new Response("Forbidden Request Context", { status: 403 });
  }

  // 2. Generate a secure nonce for CSP.
  const nonceBytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(nonceBytes);
  const cspNonce = btoa(String.fromCodePoint(...nonceBytes));
  
  // 3. Attach the nonce to locals so Astro components can access it.
  context.locals.cspNonce = cspNonce;

  // 4. Continue the request chain.
  const response = await next();
  const headers = new Headers(response.headers);
  const requestUrl = new URL(context.request.url);
  const { pathname } = requestUrl;

  // 5. Apply security headers (Production only).
  // In development, Vite's HMR needs unsafe-inline styles and scripts.
  if (!import.meta.env.DEV) {
    setSecurityHeaders(headers, requestUrl, cspNonce);
  }

  // 6. Apply caching strategy.
  setCacheHeaders(headers, pathname);

  let body: BodyInit | null = response.body;

  // Intercept HTML responses to inject nonces into Astro's hoisted/injected scripts.
  // This is required because 'strict-dynamic' drops whitelist sources and mandates nonces everywhere.
  if (
    !import.meta.env.DEV &&
    headers.get("Content-Type")?.includes("text/html")
  ) {
    const htmlText = await response.text();
    const noncedHtml = htmlText.replace(
      /<script(?![^>]*\bnonce=)([^>]*)>/gi,
      (match, p1) => {
        // Exclude non-executable scripts like JSON data blocks
        if (p1.includes('type="application/')) {
          return match;
        }
        return `<script nonce="${cspNonce}"${p1}>`;
      }
    );
    body = noncedHtml;
    // Remove the old Content-Length so the standard Response constructor calculates the new one
    headers.delete("Content-Length");
  }

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
});

