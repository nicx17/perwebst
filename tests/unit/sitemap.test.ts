/**
 * Unit tests for the sitemap and sitemap-index URL generation logic.
 * Tests the pure XML-generating logic without the Astro runtime.
 */
import { describe, it, expect } from "vitest";

// ── Replicated pure logic from src/pages/sitemap.xml.ts ──────────────────────

const buildSitemapXml = (site: URL, routes: string[]): string => {
  const urlEntries = routes
    .map((route) => `<url><loc>${new URL(route, site).toString()}</loc></url>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlEntries}</urlset>`;
};

// ── Replicated pure logic from src/pages/sitemap-index.xml.ts ────────────────

const buildSitemapIndexXml = (site: URL): string => {
  const sitemapUrl = new URL("/sitemap.xml", site).toString();
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${sitemapUrl}</loc></sitemap></sitemapindex>`;
};

// ─────────────────────────────────────────────────────────────────────────────

const SITE = new URL("https://link.nickcardoso.com");
const STATIC_ROUTES = ["/", "/about/", "/projects/"];
const PROJECT_ROUTES = [
  "/projects/hytrackv3/",
  "/projects/hytrackapi/",
  "/projects/mimick/",
  "/projects/unstats/",
  "/projects/multiwave/",
  "/projects/infinityx/",
  "/projects/immichsync/",
];

describe("sitemap.xml", () => {
  it("produces valid XML declaration", () => {
    const xml = buildSitemapXml(SITE, STATIC_ROUTES);
    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  });

  it("wraps content in urlset with sitemaps.org namespace", () => {
    const xml = buildSitemapXml(SITE, STATIC_ROUTES);
    expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
  });

  it("includes all static routes as absolute URLs", () => {
    const xml = buildSitemapXml(SITE, STATIC_ROUTES);
    expect(xml).toContain("<loc>https://link.nickcardoso.com/</loc>");
    expect(xml).toContain("<loc>https://link.nickcardoso.com/about/</loc>");
    expect(xml).toContain("<loc>https://link.nickcardoso.com/projects/</loc>");
  });

  it("includes all project routes", () => {
    const xml = buildSitemapXml(SITE, [...STATIC_ROUTES, ...PROJECT_ROUTES]);
    for (const route of PROJECT_ROUTES) {
      expect(xml).toContain(`<loc>https://link.nickcardoso.com${route}</loc>`);
    }
  });

  it("handles an empty route list gracefully", () => {
    const xml = buildSitemapXml(SITE, []);
    expect(xml).toContain("<urlset");
    expect(xml).toContain("</urlset>");
    expect(xml).not.toContain("<url>");
  });

  it("all URLs start with the site origin", () => {
    const xml = buildSitemapXml(SITE, [...STATIC_ROUTES, ...PROJECT_ROUTES]);
    const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
    for (const loc of locs) {
      expect(loc).toMatch(/^https:\/\/link\.nickcardoso\.com/);
    }
  });
});

describe("sitemap-index.xml", () => {
  it("produces valid XML declaration", () => {
    const xml = buildSitemapIndexXml(SITE);
    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  });

  it("wraps in sitemapindex with correct namespace", () => {
    const xml = buildSitemapIndexXml(SITE);
    expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    expect(xml).toContain("<sitemapindex");
  });

  it("points to sitemap.xml at the site root", () => {
    const xml = buildSitemapIndexXml(SITE);
    expect(xml).toContain("<loc>https://link.nickcardoso.com/sitemap.xml</loc>");
  });
});
