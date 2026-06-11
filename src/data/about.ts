/**
 * Data for the 'About' page, reflecting the current Cloudflare Workers deployment.
 */
export const stackCards = [
  {
    title: "Framework",
    body: "Built with Astro using server-side rendering (SSR). Content-first architecture with minimal client-side JavaScript for fast time-to-interactive."
  },
  {
    title: "Edge Runtime",
    body: "Deployed to Cloudflare Workers for global edge execution. Pages are rendered at the nearest PoP to the visitor, eliminating origin latency."
  },
  {
    title: "CI/CD Pipeline",
    body: "GitHub Actions runs type checking, tests, and builds on every push. Merges to main automatically deploy to Cloudflare via the Wrangler CLI."
  },
  {
    title: "Security",
    body: "Strict Content Security Policy with per-request nonces, HSTS preloading, Fetch Metadata validation, and comprehensive security headers enforced at the middleware layer."
  }
];

/**
 * Deployment pipeline stages and tools.
 */
export const pipeline: [string, string][] = [
  ["Source Control", "GitHub (main branch)"],
  ["CI Runner", "GitHub Actions (ubuntu-latest, Node 24)"],
  ["Type Checking", "Astro check + TypeScript (strict)"],
  ["Testing", "Vitest with V8 coverage"],
  ["Static Analysis", "CodeQL (weekly + on push)"],
  ["Link Validation", "Lychee (weekly + on push)"],
  ["Dependency Updates", "Dependabot (weekly, npm + GitHub Actions)"],
  ["Deploy Target", "Cloudflare Workers via wrangler-action v4"],
];

/**
 * Key architectural and performance optimization highlights.
 */
export const optimizationNotes: [string, string][] = [
  ["Rendering", "Astro SSR with hybrid output. Static assets fingerprinted and immutable-cached for 1 year."],
  ["Backgrounds", "Progressive loading: 72px placeholder, then AVIF (or WebP fallback) with crossfade transition."],
  ["Typography", "System font stack to eliminate layout shift and external font fetches."],
  ["Caching", "Tiered cache-control: immutable for hashed assets, 30-day for backgrounds, must-revalidate for HTML."],
  ["Compression", "Cloudflare edge compression (Brotli/gzip). Background images pre-optimized to AVIF and WebP."],
  ["Security", "CSP with nonces and strict-dynamic, HSTS, COEP/COOP/CORP, X-Frame-Options DENY, Permissions-Policy."],
];
