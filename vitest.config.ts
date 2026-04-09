/**
 * Vitest configuration file.
 * Manages unit and integration testing environments, including coverage reporting.
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    /** Pattern for finding test files. */
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    /** Enables jest-like global APIs (describe, it, expect). */
    globals: true,
    /** Default environment for tests. */
    environment: "node",
    /** Configuration for code coverage analysis. */
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/env.d.ts"],
    },
  },
});
