import { defineMiddleware } from "astro:middleware";

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
    "connect-src 'self' https://cloudflareinsights.com https://*.cloudflareinsights.com",
    "manifest-src 'self'",
    "media-src 'self'",
    "worker-src 'self'",
    "style-src 'self'",
    "style-src-elem 'self'",
    "style-src-attr 'none'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://static.cloudflareinsights.com`,
    `script-src-elem 'self' 'nonce-${nonce}' 'strict-dynamic' https://static.cloudflareinsights.com`,
    "script-src-attr 'none'",
    `report-uri ${reportEndpoint}`,
    "report-to csp-endpoint",
    "upgrade-insecure-requests",
    "block-all-mixed-content"
  ].join("; ");

const setSecurityHeaders = (headers: Headers, requestUrl: URL, nonce: string) => {
  const reportEndpoint = `${requestUrl.origin}/api/csp-report`;
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
  headers.set("Cross-Origin-Resource-Policy", "same-origin");
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
    headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
};

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

export const onRequest = defineMiddleware(async (context, next) => {
  const nonceBytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(nonceBytes);
  const cspNonce = btoa(String.fromCodePoint(...nonceBytes));
  context.locals.cspNonce = cspNonce;

  const response = await next();
  const headers = new Headers(response.headers);
  const requestUrl = new URL(context.request.url);
  const { pathname } = requestUrl;

  setSecurityHeaders(headers, requestUrl, cspNonce);
  setCacheHeaders(headers, pathname);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
});
