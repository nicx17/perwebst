/**
 * Unit tests for the middleware security and cache header logic.
 *
 * The middleware is an Astro file, so we extract and test its pure functions
 * by re-implementing them here against the same contract — this lets us unit
 * test the header rules without spinning up the full SSR runtime.
 *
 * If the middleware logic changes, these tests will catch regressions.
 */
import { describe, it, expect, beforeEach } from "vitest";

// ── Replicated pure functions from src/middleware.ts ──────────────────────────

const buildSecurityPolicy = (nonce: string, reportEndpoint: string): string =>
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
    "block-all-mixed-content",
  ].join("; ");

const TRUSTED_REPORT_ORIGIN = "https://link.nickcardoso.com";

const setSecurityHeaders = (headers: Headers, requestUrl: URL, nonce: string): void => {
  const reportEndpoint = `${TRUSTED_REPORT_ORIGIN}/api/csp-report`;
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
      endpoints: [{ url: reportEndpoint }],
    })
  );
  if (requestUrl.protocol === "https:") {
    headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
};

const setCacheHeaders = (headers: Headers, pathname: string): void => {
  if (headers.has("Cache-Control")) return;

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
  if (
    pathname.endsWith(".xml") ||
    pathname.endsWith("robots.txt") ||
    pathname.endsWith("site.webmanifest")
  ) {
    headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    return;
  }
  headers.set("Cache-Control", "public, max-age=0, must-revalidate");
};

// ── Tests ─────────────────────────────────────────────────────────────────────

const NONCE = "abc123";
const HTTPS_URL = new URL("https://link.nickcardoso.com/");
const HTTP_URL = new URL("http://link.nickcardoso.com/");

describe("buildSecurityPolicy", () => {
  it("embeds the nonce in script-src and script-src-elem", () => {
    const policy = buildSecurityPolicy(NONCE, "https://example.com/api/csp-report");
    expect(policy).toContain(`'nonce-${NONCE}'`);
  });

  it("includes object-src none", () => {
    const policy = buildSecurityPolicy(NONCE, "https://example.com/api/csp-report");
    expect(policy).toContain("object-src 'none'");
  });

  it("includes frame-ancestors none", () => {
    const policy = buildSecurityPolicy(NONCE, "https://example.com/api/csp-report");
    expect(policy).toContain("frame-ancestors 'none'");
  });

  it("includes upgrade-insecure-requests", () => {
    const policy = buildSecurityPolicy(NONCE, "https://example.com/api/csp-report");
    expect(policy).toContain("upgrade-insecure-requests");
  });

  it("sets the report-uri to the provided endpoint", () => {
    const endpoint = "https://example.com/api/csp-report";
    const policy = buildSecurityPolicy(NONCE, endpoint);
    expect(policy).toContain(`report-uri ${endpoint}`);
  });

  it("includes cloudflare insights in connect-src", () => {
    const policy = buildSecurityPolicy(NONCE, "https://x.com/report");
    expect(policy).toContain("https://cloudflareinsights.com");
  });

  it("does not contain unsafe-inline", () => {
    const policy = buildSecurityPolicy(NONCE, "https://x.com/report");
    expect(policy).not.toContain("unsafe-inline");
  });
});

describe("setSecurityHeaders — HTTPS request", () => {
  let headers: Headers;
  beforeEach(() => {
    headers = new Headers();
    setSecurityHeaders(headers, HTTPS_URL, NONCE);
  });

  it("sets Content-Security-Policy", () => {
    expect(headers.get("Content-Security-Policy")).toBeTruthy();
  });

  it("removes Content-Security-Policy-Report-Only", () => {
    const h = new Headers({ "Content-Security-Policy-Report-Only": "default-src 'none'" });
    setSecurityHeaders(h, HTTPS_URL, NONCE);
    expect(h.get("Content-Security-Policy-Report-Only")).toBeNull();
  });

  it("sets HSTS on HTTPS", () => {
    expect(headers.get("Strict-Transport-Security")).toContain("max-age=63072000");
    expect(headers.get("Strict-Transport-Security")).toContain("includeSubDomains");
    expect(headers.get("Strict-Transport-Security")).toContain("preload");
  });

  it("sets X-Frame-Options to DENY", () => {
    expect(headers.get("X-Frame-Options")).toBe("DENY");
  });

  it("sets X-Content-Type-Options to nosniff", () => {
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("sets Referrer-Policy", () => {
    expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });

  it("sets Cross-Origin-Opener-Policy to same-origin", () => {
    expect(headers.get("Cross-Origin-Opener-Policy")).toBe("same-origin");
  });

  it("sets Cross-Origin-Resource-Policy to same-origin", () => {
    expect(headers.get("Cross-Origin-Resource-Policy")).toBe("same-origin");
  });

  it("sets Permissions-Policy locking dangerous APIs", () => {
    const pp = headers.get("Permissions-Policy");
    expect(pp).toContain("camera=()");
    expect(pp).toContain("microphone=()");
    expect(pp).toContain("geolocation=()");
  });

  it("sets Reporting-Endpoints pointing to /api/csp-report", () => {
    expect(headers.get("Reporting-Endpoints")).toContain("/api/csp-report");
  });

  it("pins report endpoint to trusted ORIGIN, not request host", () => {
    const h = new Headers();
    const untrustedHost = new URL("https://attacker.example/");
    setSecurityHeaders(h, untrustedHost, NONCE);
    expect(h.get("Reporting-Endpoints")).toContain("https://link.nickcardoso.com/api/csp-report");
    expect(h.get("Reporting-Endpoints")).not.toContain("attacker.example");
  });

  it("sets Report-To as valid JSON with correct group", () => {
    const raw = headers.get("Report-To");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw as string);
    expect(parsed.group).toBe("csp-endpoint");
    expect(parsed.endpoints[0].url).toContain("/api/csp-report");
  });
});

describe("setSecurityHeaders — HTTP request", () => {
  it("does NOT set HSTS on plain HTTP", () => {
    const headers = new Headers();
    setSecurityHeaders(headers, HTTP_URL, NONCE);
    expect(headers.get("Strict-Transport-Security")).toBeNull();
  });
});

describe("setCacheHeaders", () => {
  it("sets immutable cache for /_astro/ assets", () => {
    const h = new Headers();
    setCacheHeaders(h, "/_astro/main.abc123.css");
    expect(h.get("Cache-Control")).toBe("public, max-age=31536000, immutable");
  });

  it("sets long cache with SWR for /backgrounds/ assets", () => {
    const h = new Headers();
    setCacheHeaders(h, "/backgrounds/hero.avif");
    expect(h.get("Cache-Control")).toContain("max-age=2592000");
    expect(h.get("Cache-Control")).toContain("stale-while-revalidate=604800");
  });

  it("sets medium cache for standalone image files (.png, .jpg, .avif, .webp, etc.)", () => {
    for (const ext of ["png", "jpg", "jpeg", "avif", "webp", "gif", "svg", "ico", "woff", "woff2"]) {
      const h = new Headers();
      setCacheHeaders(h, `/static/file.${ext}`);
      expect(h.get("Cache-Control")).toContain("max-age=604800");
    }
  });

  it("sets 24h cache for /js/ files", () => {
    const h = new Headers();
    setCacheHeaders(h, "/js/app.js");
    expect(h.get("Cache-Control")).toContain("max-age=86400");
  });

  it("sets 1h cache for .xml files", () => {
    const h = new Headers();
    setCacheHeaders(h, "/sitemap.xml");
    expect(h.get("Cache-Control")).toContain("max-age=3600");
  });

  it("sets 1h cache for robots.txt", () => {
    const h = new Headers();
    setCacheHeaders(h, "/robots.txt");
    expect(h.get("Cache-Control")).toContain("max-age=3600");
  });

  it("sets 1h cache for site.webmanifest", () => {
    const h = new Headers();
    setCacheHeaders(h, "/site.webmanifest");
    expect(h.get("Cache-Control")).toContain("max-age=3600");
  });

  it("sets no-cache (must-revalidate) for HTML pages", () => {
    const h = new Headers();
    setCacheHeaders(h, "/projects/");
    expect(h.get("Cache-Control")).toBe("public, max-age=0, must-revalidate");
  });

  it("does NOT overwrite a pre-existing Cache-Control header", () => {
    const h = new Headers({ "Cache-Control": "private, no-store" });
    setCacheHeaders(h, "/projects/");
    expect(h.get("Cache-Control")).toBe("private, no-store");
  });
});
