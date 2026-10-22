# Site architecture

How this site is built, deployed, and secured.

## Stack

| Area         | Details                                                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Framework    | Astro with server-side rendering (SSR). Content-first, with minimal client-side JavaScript for a fast time-to-interactive.                       |
| Edge runtime | Cloudflare Workers. Pages render at the PoP nearest the visitor, so there's no origin round trip.                                                |
| CI/CD        | GitHub Actions runs type checking, tests, and the build on every push. Merges to `main` deploy to Cloudflare with the Wrangler CLI.              |
| Security     | Strict Content Security Policy with per-request nonces, HSTS preloading, Fetch Metadata validation, and security headers enforced in middleware. |

## Deployment pipeline

| Stage              | Tool                                        |
| ------------------ | ------------------------------------------- |
| Source control     | GitHub (`main` branch)                      |
| CI runner          | GitHub Actions (ubuntu-latest, Node 24)     |
| Type checking      | `astro check` + TypeScript (strict)         |
| Testing            | Vitest with V8 coverage                     |
| Static analysis    | CodeQL (weekly and on push)                 |
| Link validation    | Lychee (weekly and on push)                 |
| Dependency updates | Dependabot (weekly, npm and GitHub Actions) |
| Deploy target      | Cloudflare Workers via wrangler-action v4   |

## Performance and optimizations

| Area             | Decision                                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------------------------- |
| Rendering        | Astro SSR with hybrid output. Static assets are fingerprinted and cached as immutable for 1 year.          |
| Backgrounds      | Progressive loading: a 72 px placeholder, then AVIF (WebP fallback) with a crossfade.                      |
| Typography       | System font stack, so there's no layout shift and no external font fetches.                                |
| Caching          | Tiered `Cache-Control`: immutable for hashed assets, 30 days for backgrounds, `must-revalidate` for HTML.  |
| Compression      | Cloudflare edge compression (Brotli/gzip). Background images are pre-optimized to AVIF and WebP.           |
| Security headers | CSP with nonces and `strict-dynamic`, HSTS, COEP/COOP/CORP, `X-Frame-Options: DENY`, `Permissions-Policy`. |
