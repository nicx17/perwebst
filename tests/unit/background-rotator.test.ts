/**
 * Unit tests for the day-based background image rotator.
 *
 * The selection logic lives in the BaseLayout.astro frontmatter and cannot be
 * imported directly. We replicate and test the pure arrays-and-modulo logic
 * here against the same contract so that regressions are caught immediately.
 *
 * Rules that must always hold:
 *   - Every day value (1-31) maps to a defined, non-empty string.
 *   - The result is always a member of the correct pool.
 *   - No two consecutive days in a 31-day month produce the same image
 *     (unless the pool is smaller than 2, which it never should be).
 *   - Light and dark pools cycle independently.
 */
import { describe, it, expect } from "vitest";

// ── Replicated from src/layouts/BaseLayout.astro ──────────────────────────────

const lightImages: string[] = [
  "antonius-harel-2rkqE7SgcE8-unsplash",
  "antonius-harel-VbOjY42c6a4-unsplash",
  "antonius-harel-WsaPcg512jE-unsplash",
  "asi-mong-Gf5Q_5UF3vs-unsplash",
  "dirk-lach--IZ8j4_xgQ8-unsplash",
  "eve-9xY__xnwCy0-unsplash",
  "eve-bKOpGRbHBGs-unsplash",
  "eve-Fp96C-6Wd6o-unsplash",
  "eve-jCBLFtjpXfw-unsplash",
  "eve-lP_4h4oVO1E-unsplash",
  "eve-lxepp3ZUxTs-unsplash",
  "eve-WK9sTh1FiSs-unsplash",
  "iklas-FeNrGgQ1Tu8-unsplash",
  "iklas-OSoICiA8F4M-unsplash",
  "iklas-xjSu2KbJlAg-unsplash",
  "iklas-y9Ujplj3KIU-unsplash",
  "rohit-choudhari-_E6sXQHsgQc-unsplash",
  "sean-sinclair-C_NJKfnTR5A-unsplash",
];

const darkImages: string[] = [
  "aedrian-salazar-kVENOffxjZg-unsplash",
  "alexander-x-M4L2tlmqVus-unsplash",
  "antonius-harel-4LY13pRPXSo-unsplash",
  "antonius-harel-HaJoTW4ip-Y-unsplash",
  "antonius-harel-MWzVeAb34P8-unsplash",
  "antonius-harel-n-Tyeypj9hU-unsplash",
  "antonius-harel-r1hj0fblqkY-unsplash",
  "bill-hamway-24Uv4wRJ95A-unsplash",
  "codioful-formerly-gradienta-1Ec-3-OuvPE-unsplash",
  "codioful-formerly-gradienta-1nqc_X3IWMg-unsplash",
  "codioful-formerly-gradienta-RiUKrRjZud0-unsplash",
  "jan-kopriva-L-bVMhRb5cs-unsplash",
  "lucrezia-carnelos-Sp6MXlY_2wc-unsplash",
  "mohammed-kara-LpYWTqT4Ff0-unsplash",
  "mohammed-kara--n9dcIoAIuE-unsplash",
  "valentin-NT9QgSMddNg-unsplash",
];

/** Mirrors the SSR selection in BaseLayout.astro exactly. */
const selectImage = (pool: string[], day: number): string => pool[day % pool.length]!;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** 
 * All valid calendar days returned by Date.getDate() for a maximum month length.
 * Used to verify the rotator's coverage and deterministic properties.
 */
const CALENDAR_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

// ── Tests ─────────────────────────────────────────────────────────────────────

/**
 * Validates the integrity of the data pools.
 * Ensures images are correctly named and formatted as expected by the build scripts.
 */
describe("lightImages pool", () => {
  it("contains 18 entries", () => {
    expect(lightImages).toHaveLength(18);
  });

  it("has no empty strings", () => {
    for (const name of lightImages) {
      expect(name.trim().length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate filenames", () => {
    expect(new Set(lightImages).size).toBe(lightImages.length);
  });

  it("every entry ends with -unsplash", () => {
    for (const name of lightImages) {
      expect(name).toMatch(/-unsplash$/);
    }
  });
});

describe("darkImages pool", () => {
  it("contains 16 entries", () => {
    expect(darkImages).toHaveLength(16);
  });

  it("has no empty strings", () => {
    for (const name of darkImages) {
      expect(name.trim().length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate filenames", () => {
    expect(new Set(darkImages).size).toBe(darkImages.length);
  });

  it("every entry ends with -unsplash", () => {
    for (const name of darkImages) {
      expect(name).toMatch(/-unsplash$/);
    }
  });
});

/**
 * Verifies the selection logic for the light theme pool.
 * Focuses on range safety, deterministic output, and lack of immediate repeats.
 */
describe("selectImage — light pool", () => {
  it("returns a defined string for every calendar day (1-31)", () => {
    for (const day of CALENDAR_DAYS) {
      const result = selectImage(lightImages, day);
      expect(result).toBeTypeOf("string");
      expect(result.length).toBeGreaterThan(0);
    }
  });

  it("always returns a member of the light pool", () => {
    for (const day of CALENDAR_DAYS) {
      expect(lightImages).toContain(selectImage(lightImages, day));
    }
  });

  it("cycles back to the pool start after one full rotation", () => {
    const len = lightImages.length;
    for (let day = 1; day <= 31; day++) {
      expect(selectImage(lightImages, day)).toBe(selectImage(lightImages, day + len));
    }
  });

  it("never returns the same image on two consecutive days within a 31-day window", () => {
    for (let day = 1; day < 31; day++) {
      expect(selectImage(lightImages, day)).not.toBe(selectImage(lightImages, day + 1));
    }
  });
});

/**
 * Verifies the selection logic for the dark theme pool.
 */
describe("selectImage — dark pool", () => {
  it("returns a defined string for every calendar day (1-31)", () => {
    for (const day of CALENDAR_DAYS) {
      const result = selectImage(darkImages, day);
      expect(result).toBeTypeOf("string");
      expect(result.length).toBeGreaterThan(0);
    }
  });

  it("always returns a member of the dark pool", () => {
    for (const day of CALENDAR_DAYS) {
      expect(darkImages).toContain(selectImage(darkImages, day));
    }
  });

  it("cycles back to the pool start after one full rotation", () => {
    const len = darkImages.length;
    for (let day = 1; day <= 31; day++) {
      expect(selectImage(darkImages, day)).toBe(selectImage(darkImages, day + len));
    }
  });

  it("never returns the same image on two consecutive days within a 31-day window", () => {
    for (let day = 1; day < 31; day++) {
      expect(selectImage(darkImages, day)).not.toBe(selectImage(darkImages, day + 1));
    }
  });
});

/**
 * Validates that light and dark selection stay out of phase.
 * This ensures that users see a unique pair of images across the month
 * when they toggle themes.
 */
describe("independent pool cycling", () => {
  it("light and dark pools have different lengths so they cycle independently", () => {
    expect(lightImages.length).not.toBe(darkImages.length);
  });

  it("produces at least 16 unique light+dark pairings across a 31-day month", () => {
    const pairs = new Set(
      CALENDAR_DAYS.map((d) => `${selectImage(lightImages, d)}|${selectImage(darkImages, d)}`)
    );
    expect(pairs.size).toBeGreaterThanOrEqual(16);
  });

  it("the full repeat cycle (LCM) is longer than a single calendar month", () => {
    const lcm = (a: number, b: number): number => (a * b) / gcd(a, b);
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const repeatAfter = lcm(lightImages.length, darkImages.length);
    // LCM(18, 16) = 144 — well beyond the 31 days of the longest month
    expect(repeatAfter).toBeGreaterThan(31);
  });
});
