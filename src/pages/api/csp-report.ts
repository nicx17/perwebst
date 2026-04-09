/**
 * API route for receiving Content Security Policy (CSP) violation reports.
 * It enforces payload size limits and verifies content length to protect 
 * against potential Denial of Service (DoS) or reflection attacks.
 */
import type { APIRoute } from "astro";

export const prerender = false;

/** Maximum allowed size for a CSP report payload (32KB). */
const MAX_REPORT_BYTES = 32 * 1024;

/** Validates and parses the Content-Length header. */
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

/**
 * Safely consumes the request body up to the MAX_REPORT_BYTES limit.
 * This provides an additional layer of protection if the Content-Length header 
 * is missing or forged.
 */
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

/**
 * Processes the report request and returns a 204 No Content on success,
 * or a 413 Payload Too Large if the limits are exceeded.
 */
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
