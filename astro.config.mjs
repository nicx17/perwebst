/**
 * Astro configuration file.
 * Handles site URL resolution (with environment variable support),
 * server-side rendering (SSR) setup via Node.js adapter,
 * and Vite-specific build optimizations.
 */
import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const DEFAULT_ORIGIN = "https://link.nickcardoso.com";

/** Normalizes a URL by removing trailing slashes. */
const normalizeOrigin = (value) => value?.trim().replace(/\/+$/, "");

/**
 * Fallback to reading ORIGIN from .env manually if process.env is not yet populated.
 * This is useful during early build stages or specific CLI invocations.
 */
const readOriginFromDotEnv = () => {
  try {
    const dotEnv = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    const match = dotEnv.match(/^\s*ORIGIN\s*=\s*(.*)\s*$/m);
    if (!match) {
      return undefined;
    }

    const value = match[1].trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      return value.slice(1, -1).trim();
    }

    return value;
  } catch {
    return undefined;
  }
};

/**
 * Resolves the final site origin based on environment variables.
 * Enforces HTTPS in production to ensure secure link generation and CSP compliance.
 */
const resolveSiteOrigin = () => {
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const rawOrigin = normalizeOrigin(process.env.ORIGIN ?? readOriginFromDotEnv());

  if (!rawOrigin) {
    if (nodeEnv === "production") {
      throw new Error("Missing ORIGIN: set ORIGIN in .env for production builds.");
    }

    return DEFAULT_ORIGIN;
  }

  let parsed;
  try {
    parsed = new URL(rawOrigin);
  } catch {
    throw new Error(`Invalid ORIGIN: "${rawOrigin}" is not a valid absolute URL.`);
  }

  if (nodeEnv === "production" && parsed.protocol !== "https:") {
    throw new Error(`Invalid ORIGIN: expected an https URL in production, got "${rawOrigin}".`);
  }

  return parsed.origin;
};

const site = resolveSiteOrigin();

export default defineConfig({
  /** The base URL for the built site. */
  site,
  devToolbar: { enabled: false },
  /** Keep client-side navigation, but disable automatic link prefetching. */
  prefetch: false,
  /** Hybrid/Server rendering mode. */
  output: "server",
  /** Standalone Node.js server adapter. */
  adapter: node({ mode: "standalone" }),
  /** Standardizes URLs to always have a trailing slash. */
  trailingSlash: "always",
  vite: {
    build: {
      rollupOptions: {
        /** Custom warning handler to suppress known/expected noise from Astro internals. */
        onwarn(warning, defaultHandler) {
          const isKnownAstroWarning =
            warning.code === "UNUSED_EXTERNAL_IMPORT" &&
            warning.message.includes("@astrojs/internal-helpers/remote") &&
            warning.message.includes("matchHostname");

          if (isKnownAstroWarning) {
            return;
          }

          defaultHandler(warning);
        }
      }
    }
  }
});
