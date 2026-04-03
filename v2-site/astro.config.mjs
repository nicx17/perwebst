import { defineConfig } from "astro/config";
import node from "@astrojs/node";

export default defineConfig({
  site: "https://test.nickcardoso.com",
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
