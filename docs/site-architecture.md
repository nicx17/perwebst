# Site architecture

How this site is built, deployed, and secured.

## Stack

| Area          | Details                                                                                                                                                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework     | Astro 7. Every page is prerendered to static HTML at build time; only `/api/csp-report/` runs on demand.                                                                                                               |
| Hosting       | Cloudflare Workers. Pages and `public/` files are served from static assets before the Worker runs. The Worker handles the report endpoint and 404s.                                                                   |
| Standalone    | `public/projects/mimick/` and `public/projects/de-1/` are hand-built pages, marked `standalone: true` in their content entries so the `[slug]` route skips them.                                                       |
| Client router | Astro's `<ClientRouter />` swaps pages without a full reload. Bundled scripts are never inlined (`assetsInlineLimit` in `astro.config.mjs`), because the router's wait for inline module scripts breaks under the CSP. |

## Security headers

Static responses can't be given headers by middleware, so the build writes them into Cloudflare's `_headers` file.

| Piece                                 | Role                                                                                                                                                                                                                  |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/utils/security-headers.ts`       | One source for the CSP, the other security headers and the cache rules. Used by the build step, the middleware and the tests.                                                                                         |
| `src/integrations/static-headers.mjs` | Runs after `astro build`. Hashes every inline script in the built HTML and writes one exact-path CSP rule per page. Fails the build on inline event handlers, `javascript:` URLs, or a file over Cloudflare's limits. |
| `src/middleware.ts`                   | Adds the same headers to on-demand responses, with a CSP that allows no inline scripts.                                                                                                                               |

The CSP allows scripts only from the site itself plus the listed hashes: no `'unsafe-inline'`, no nonces, no `strict-dynamic`. Astro pages share one policy (the union of their hashes), because the client router runs the next page's inline scripts under the current page's policy. Standalone pages each get a policy with only their own hashes, plus Google Fonts.

`_headers` rules must never overlap on the same header. Cloudflare joins duplicate values with a comma, so two CSPs would both be enforced and two `Cache-Control` values would contradict each other. That's why CSP rules are exact paths and `/*` carries no CSP or `Cache-Control`. Limits: 100 rules, 2,000 characters per line.

Violation reports go to `/api/csp-report/`. The trailing slash matters: the bare path redirects, and browsers drop redirected reports.

## Backgrounds

| Step                               | What happens                                                                                                                                                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Add or remove a photo              | Put or delete a `.jpg` in `public/backgrounds/light/`, then run `npm run optimize:backgrounds`.                                                                                                                    |
| `scripts/optimize-backgrounds.py`  | Makes the `.avif`, `.webp` and `.tiny.webp` variants, deletes variants whose `.jpg` is gone, and writes `src/data/background-colors.json`: average color, accent colors and `shade` (the darkest 3% of the photo). |
| `src/utils/background-rotation.ts` | The rotation pool is the keys of that JSON, one image per UTC day in turn (Saturday override if the image still exists).                                                                                           |
| `src/utils/scene-palette.ts`       | Turns each photo's colors into the site's color tokens: tinted glass, ink, accent pills and glows.                                                                                                                 |
| `src/pages/scene.js.ts`            | `/scene.js`: the day's photo and palette for the standalone DE pages, which can't use the layout.                                                                                                                  |
| `.github/workflows/ci.yml`         | Rebuilds and deploys daily at 00:07 UTC. Pages are prerendered, so this is what rotates the background.                                                                                                            |

The build fails if a background in the JSON is missing one of its four files.

### Readability

Contrast is computed, not assumed. For each photo, `scene-palette.ts` checks every text color with the WCAG 2 formula against its surface blended over `shade`: the weakest glass surface (project cards, home links) for body text, and the blurred backing behind page headers for text drawn straight on the photo. If a check fails, the lighter text tiers get darker (down to a floor that keeps the hierarchy), then the glass gets more opaque, until it passes.

Targets: 7:1 for main text, 4.5:1 for everything else (WCAG AA). `tests/unit/scene-palette.test.ts` re-derives every surface from the emitted CSS tokens and checks all backgrounds. The header backing's blur and inset in `global.css` assume at least 75% of its opacity reaches the text (measured: 79%); re-measure if you change them.

## Deployment pipeline

| Stage              | Tool                                                                            |
| ------------------ | ------------------------------------------------------------------------------- |
| Source control     | GitHub (`main` branch)                                                          |
| CI runner          | GitHub Actions (ubuntu-latest, Node 24), on push, PR, daily schedule and manual |
| Lint               | ESLint                                                                          |
| Type checking      | `astro sync` + TypeScript (strict)                                              |
| Testing            | Vitest with V8 coverage                                                         |
| Static analysis    | CodeQL (weekly and on push)                                                     |
| Link validation    | Lychee (weekly and on push)                                                     |
| Dependency updates | Dependabot (weekly, npm and GitHub Actions)                                     |
| Deploy             | `wrangler deploy` on `main`; deploy runs queue instead of overlapping           |
| PR previews        | `wrangler versions upload`, which uploads a version without deploying it        |

## Caching

| Files                                        | Cache-Control                                       |
| -------------------------------------------- | --------------------------------------------------- |
| `/_astro/*` (hashed bundles)                 | 1 year, immutable (added by the Cloudflare adapter) |
| `/backgrounds/*` (versioned with `?v=`)      | 30 days, plus 7 days stale-while-revalidate         |
| Icons, project images, favicons              | 7 days, plus 1 day stale-while-revalidate           |
| `robots.txt`, `llms.txt`, sitemaps, manifest | 1 hour, plus 1 day stale-while-revalidate           |
| HTML, `/scene.js`                            | Cloudflare's default: `max-age=0, must-revalidate`  |
| On-demand responses                          | `no-store`                                          |

## Other choices

| Area        | Decision                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------ |
| Backgrounds | Progressive loading: a 72 px placeholder, then AVIF (WebP fallback) with a crossfade.            |
| Typography  | System font stack, so there's no layout shift and no external font fetches.                      |
| Compression | Cloudflare edge compression (Brotli/gzip). Background images are pre-optimized to AVIF and WebP. |
| Sessions    | Off (`session: false`), so the adapter doesn't provision a KV namespace nothing uses.            |
| Prefetch    | Off: HTML is revalidated on every request, so a prefetched copy can't be reused.                 |
