import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const DEFAULT_ORIGIN = "https://link.nickcardoso.com";

const normalizeOrigin = (value) => value?.trim().replace(/\/+$/, "");

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
  site,
  devToolbar: { enabled: false },
  output: "server",
  adapter: node({ mode: "standalone" }),
  trailingSlash: "always",
  vite: {
    build: {
      rollupOptions: {
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
