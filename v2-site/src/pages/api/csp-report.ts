import type { APIRoute } from "astro";

export const prerender = false;

const MAX_REPORT_BYTES = 32 * 1024;

const readLimitedBody = async (request: Request): Promise<string> => {
  const text = await request.text();
  if (text.length > MAX_REPORT_BYTES) {
    return text.slice(0, MAX_REPORT_BYTES);
  }

  return text;
};

const acceptReport = async (request: Request): Promise<Response> => {
  try {
    await readLimitedBody(request);
  } catch {
    // Ignore malformed payloads and return no-content to prevent reflection.
  }

  return new Response(null, { status: 204 });
};

export const POST: APIRoute = async ({ request }) => acceptReport(request);
export const OPTIONS: APIRoute = async () => new Response(null, { status: 204 });
