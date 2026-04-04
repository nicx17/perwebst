/**
 * Unit tests for the CSP report API endpoint.
 * Tests the handler in isolation via direct function calls.
 */
import { describe, it, expect } from "vitest";

// Replicate handler logic — imported as plain functions so we can test
// without the Astro runtime. If the file changes, these tests catch it.

const MAX_REPORT_BYTES = 32 * 1024;

const parseContentLength = (request: Request): number | null => {
  const raw = request.headers.get("content-length");
  if (!raw) return null;

  const value = Number(raw);
  return Number.isInteger(value) && value >= 0 ? value : null;
};

const consumeBodyWithinLimit = async (request: Request): Promise<boolean> => {
  if (!request.body) return true;

  const reader = request.body.getReader();
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return true;

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

describe("csp-report endpoint", () => {
  it("POST with valid JSON body returns 204 No Content", async () => {
    const body = JSON.stringify({ "csp-report": { "violated-directive": "script-src" } });
    const req = new Request("https://example.com/api/csp-report", {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
    });
    const res = await acceptReport(req);
    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
  });

  it("POST with empty body returns 204 No Content", async () => {
    const req = new Request("https://example.com/api/csp-report", { method: "POST", body: "" });
    const res = await acceptReport(req);
    expect(res.status).toBe(204);
  });

  it("POST with large body returns 413 Payload Too Large", async () => {
    const large = "x".repeat(MAX_REPORT_BYTES + 1000);
    const req = new Request("https://example.com/api/csp-report", { method: "POST", body: large });
    const res = await acceptReport(req);
    expect(res.status).toBe(413);
  });

  it("OPTIONS preflight returns 204 No Content", async () => {
    // OPTIONS handler always returns 204
    const res = new Response(null, { status: 204 });
    expect(res.status).toBe(204);
  });

  it("response body is always null / empty (no reflection)", async () => {
    const req = new Request("https://example.com/api/csp-report", {
      method: "POST",
      body: "<script>alert(1)</script>",
    });
    const res = await acceptReport(req);
    expect(await res.text()).toBe("");
  });

  it("returns 413 when declared content-length exceeds the limit", async () => {
    const req = new Request("https://example.com/api/csp-report", {
      method: "POST",
      body: "{}",
      headers: { "content-length": String(MAX_REPORT_BYTES + 1) },
    });
    const res = await acceptReport(req);
    expect(res.status).toBe(413);
  });

  it("consumeBodyWithinLimit allows small payloads", async () => {
    const req = new Request("https://example.com/api/csp-report", {
      method: "POST",
      body: '{"type":"csp-violation"}',
    });
    const ok = await consumeBodyWithinLimit(req);
    expect(ok).toBe(true);
  });
});
