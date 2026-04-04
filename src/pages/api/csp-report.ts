import type { APIRoute } from "astro";

export const prerender = false;

const MAX_REPORT_BYTES = 32 * 1024;

const parseContentLength = (request: Request): number | null => {
  const raw = request.headers.get("content-length");
  if (!raw) {
    return null;
  }

  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    return null;
  }

  return value;
};

const consumeBodyWithinLimit = async (request: Request): Promise<boolean> => {
  if (!request.body) {
    return true;
  }

  const reader = request.body.getReader();
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        return true;
      }

      total += value.byteLength;
      if (total > MAX_REPORT_BYTES) {
        try {
          await reader.cancel();
        } catch {
          // Ignore cancellation failures; payload is already rejected.
        }

        return false;
      }
    }
  } catch {
    // Ignore malformed payloads and return no-content to prevent reflection.
    return true;
  } finally {
    reader.releaseLock();
  }
};

const acceptReport = async (request: Request): Promise<Response> => {
  const contentLength = parseContentLength(request);
  if (contentLength !== null && contentLength > MAX_REPORT_BYTES) {
    return new Response(null, { status: 413 });
  }

  const withinLimit = await consumeBodyWithinLimit(request);
  if (!withinLimit) {
    return new Response(null, { status: 413 });
  }

  return new Response(null, { status: 204 });
};

export const POST: APIRoute = async ({ request }) => acceptReport(request);
export const OPTIONS: APIRoute = async () => new Response(null, { status: 204 });
