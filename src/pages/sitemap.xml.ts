/**
 * Generates the primary sitemap.xml containing all static and dynamic project routes.
 */
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

const XML_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8"
};

/**
 * GET handler to dynamically build and serve the XML sitemap.
 */
export const GET: APIRoute = async ({ site }) => {
  if (!site) {
    return new Response("Site URL is not configured.", { status: 500 });
  }

  const projects = await getCollection("projects");
  const staticRoutes = ["/", "/about/", "/projects/"];
  const projectRoutes = projects.map((project) => project.data.canonicalPath);
  const allRoutes = [...staticRoutes, ...projectRoutes];

  const urlEntries = allRoutes
    .map((route) => `<url><loc>${new URL(route, site).toString()}</loc></url>`)
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlEntries}</urlset>`;

  return new Response(xml, { headers: XML_HEADERS });
};
