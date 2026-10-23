/**
 * Per-background site palette. The optimizer measures each photo (average
 * color, the most prominent vivid hues, and `shade`: its darkest area); this
 * module turns those into the color tokens global.css uses, so glass, text,
 * accents and glows follow the photo.
 *
 * Readability is computed, not assumed: every text color is checked with the
 * WCAG 2 contrast formula against its surface blended over `shade`, the worst
 * case anywhere on the page. When a check fails, glass gets more opaque, then
 * text gets darker, until it passes.
 */
import type { BackgroundColor } from '../types/client';

type Rgb = readonly [number, number, number];

// ── Color math ────────────────────────────────────────────────────────────────

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

export const parseHex = (hex: string): Rgb => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) {
    throw new Error(`Not a #rrggbb color: ${hex}`);
  }
  const n = parseInt(m[1]!, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export const toHex = (rgb: Rgb): string =>
  `#${rgb
    .map((c) =>
      Math.round(clamp(c, 0, 255))
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`;

const toLinear = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

const fromLinear = (v: number) =>
  255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);

/** WCAG 2 relative luminance. */
export const relativeLuminance = (rgb: Rgb): number => {
  const [r, g, b] = rgb.map(toLinear) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** WCAG 2 contrast ratio, 1 to 21. */
export const contrastRatio = (a: Rgb, b: Rgb): number => {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x
  ) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

/** `fg` at `alpha` over opaque `bg`, blended in sRGB as browsers do. */
export const composite = (fg: Rgb, bg: Rgb, alpha: number): Rgb =>
  [0, 1, 2].map((i) => fg[i]! * alpha + bg[i]! * (1 - alpha)) as unknown as Rgb;

interface Oklch {
  l: number;
  c: number;
  h: number;
}

export const toOklch = (rgb: Rgb): Oklch => {
  const [r, g, b] = rgb.map(toLinear) as [number, number, number];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return {
    l: L,
    c: Math.hypot(A, B),
    h: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360,
  };
};

const oklchToLinear = ({ l, c, h }: Oklch): [number, number, number] => {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
};

/**
 * OKLCH to sRGB, lowering chroma until the color fits the sRGB gamut.
 * Channels are rounded to whole numbers, as emitted in CSS, so contrast is
 * checked on exactly the colors the browser gets.
 */
export const fromOklch = (color: Oklch): Rgb => {
  let { c } = color;
  for (let i = 0; i < 40; i++) {
    const lin = oklchToLinear({ ...color, c });
    if (lin.every((v) => v >= -1e-4 && v <= 1 + 1e-4)) {
      return lin.map((v) =>
        Math.round(fromLinear(clamp(v, 0, 1)))
      ) as unknown as Rgb;
    }
    c *= 0.9;
  }
  return oklchToLinear({ ...color, c: 0 }).map((v) =>
    Math.round(fromLinear(clamp(v, 0, 1)))
  ) as unknown as Rgb;
};

const rgba = (rgb: Rgb, alpha = 1) => {
  const [r, g, b] = rgb.map((v) => Math.round(clamp(v, 0, 255)));
  return alpha >= 1
    ? `rgb(${r} ${g} ${b})`
    : `rgb(${r} ${g} ${b} / ${Number(alpha.toFixed(3))})`;
};

// ── Palette ───────────────────────────────────────────────────────────────────

/** Contrast targets (WCAG 2.2): AA body text 4.5:1, AAA 7:1 for main text. */
export const CONTRAST_TARGETS = {
  main: 7,
  text: 4.5,
} as const;

/**
 * Default glass opacities from global.css. The weakest text-bearing surfaces
 * are project cards (button-bg mixed at 74%) and home links (bg-secondary at
 * 64%).
 */
const GLASS = {
  glassBg: 0.66,
  glassBgStrong: 0.78,
  bgSecondary: 0.84,
  buttonBg: 0.7,
  buttonBgHover: 0.86,
} as const;
const weakestSurface = (g: Record<keyof typeof GLASS, number>) =>
  Math.min(g.buttonBg * 0.74, g.bgSecondary * 0.64);

/**
 * The header backing is a blurred rounded box (global.css); text sits inside
 * the inset, where at least this share of its opacity remains. Measured
 * minimum is 0.79 (home and Projects headers, 1440 and 390 px wide).
 */
const SCRIM_COVERAGE = 0.75;

export interface ContrastReport {
  main: number;
  muted: number;
  soft: number;
  buttonText: number;
  headerMain: number;
  headerMuted: number;
  activeText: number;
}

export interface ScenePalette {
  /** CSS custom properties, overriding the defaults in global.css. */
  tokens: Record<string, string>;
  /** For <meta name="theme-color">. */
  themeColor: string;
  /** Worst-case contrast ratios, for tests and the build log. */
  contrast: ContrastReport;
}

const hueDistance = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

export const buildScenePalette = (stats: BackgroundColor): ScenePalette => {
  const average = toOklch(parseHex(stats.average));
  const accent = toOklch(parseHex(stats.accent ?? stats.average));
  const shade = parseHex(stats.shade ?? '#7f7f7f');
  // A near-gray photo has no meaningful hue of its own; borrow the accent's.
  const moodHue = average.c < 0.02 ? accent.h : average.h;
  const alt = stats.accentAlt
    ? toOklch(parseHex(stats.accentAlt))
    : { l: accent.l, c: accent.c * 0.8, h: (accent.h + 48) % 360 };
  const altHue =
    hueDistance(alt.h, accent.h) < 20 ? (accent.h + 48) % 360 : alt.h;

  // Glass: near-white, faintly tinted with the photo's overall color.
  const tint = fromOklch({
    l: 0.975,
    c: clamp(average.c * 0.3, 0.006, 0.02),
    h: moodHue,
  });

  // Ink: dark neutrals leaning toward the accent hue.
  const ink = { l: 0.235, c: 0.028, h: accent.h };
  const muted = { l: 0.415, c: 0.035, h: accent.h };
  const soft = { l: 0.47, c: 0.035, h: accent.h };
  const buttonText = { l: 0.43, c: 0.04, h: accent.h };

  // Make all text pass on the weakest surface over the darkest part of the
  // photo. Darken the lighter text tiers first, but only as far as keeps them
  // visibly lighter than the main ink; then make the glass more opaque, so it
  // stays translucent wherever the photo allows.
  let glass = { ...GLASS };
  const passes = () => {
    const surface = composite(tint, shade, weakestSurface(glass));
    return (
      contrastRatio(fromOklch(ink), surface) >= CONTRAST_TARGETS.main &&
      [muted, soft, buttonText].every(
        (c) => contrastRatio(fromOklch(c), surface) >= CONTRAST_TARGETS.text
      )
    );
  };
  const TIER_FLOORS = new Map([
    [muted, 0.35],
    [soft, 0.39],
    [buttonText, 0.36],
  ]);
  for (let i = 0; !passes() && i < 12; i++) {
    for (const [c, floor] of TIER_FLOORS) {
      c.l = Math.max(floor, c.l - 0.01);
    }
  }
  for (let keep = 1; !passes() && keep > 0.12; keep -= 0.02) {
    glass = Object.fromEntries(
      // Rounded to the 3 decimals rgba() emits.
      Object.entries(GLASS).map(([k, a]) => [
        k,
        Math.round((1 - (1 - a) * keep) * 1000) / 1000,
      ])
    ) as typeof glass;
  }
  for (let i = 0; !passes() && i < 30; i++) {
    for (const c of [ink, muted, soft, buttonText]) {
      c.l = Math.max(0.12, c.l - 0.01);
    }
  }

  // Header backing for the title/subtitle drawn straight on the photo.
  let scrim = 0.3;
  const headerSurface = () => composite(tint, shade, scrim * SCRIM_COVERAGE);
  while (
    scrim < 0.98 &&
    (contrastRatio(fromOklch(ink), headerSurface()) < CONTRAST_TARGETS.text ||
      contrastRatio(fromOklch(muted), headerSurface()) < CONTRAST_TARGETS.text)
  ) {
    scrim = Math.round((scrim + 0.02) * 100) / 100;
  }

  // Active pills / primary buttons: a deep version of the accent.
  const activeText = fromOklch({ l: 0.985, c: 0.006, h: accent.h });
  const active = { l: 0.42, c: Math.min(accent.c, 0.13), h: accent.h };
  while (contrastRatio(fromOklch(active), activeText) < CONTRAST_TARGETS.text) {
    active.l -= 0.01;
  }

  const line = fromOklch({
    l: 0.47,
    c: clamp(accent.c * 0.35, 0.02, 0.05),
    h: moodHue,
  });
  const shadow = fromOklch({ l: 0.3, c: 0.04, h: accent.h });
  const glowA = fromOklch({ l: 0.8, c: Math.min(accent.c, 0.14), h: accent.h });
  const glowB = fromOklch({ l: 0.79, c: clamp(alt.c, 0.06, 0.12), h: altHue });
  const pageBase = fromOklch({
    l: 0.93,
    c: Math.min(average.c, 0.035),
    h: moodHue,
  });

  const surface = composite(tint, shade, weakestSurface(glass));
  const header = headerSurface();
  const inkRgb = fromOklch(ink);
  const mutedRgb = fromOklch(muted);

  return {
    tokens: {
      '--bg-primary': toHex(pageBase),
      '--bg-secondary': rgba(tint, glass.bgSecondary),
      '--text-main': toHex(inkRgb),
      '--text-muted': toHex(mutedRgb),
      '--text-soft': toHex(fromOklch(soft)),
      '--border-color': rgba(line, 0.18),
      '--border-hover': rgba(line, 0.34),
      '--glass-bg': rgba(tint, glass.glassBg),
      '--glass-bg-strong': rgba(tint, glass.glassBgStrong),
      '--ambient-a': rgba(glowA, 0.42),
      '--ambient-b': rgba(glowB, 0.26),
      '--ambient-c': rgba(glowB, 0.14),
      '--shell-border': rgba(line, 0.22),
      '--shadow-main': rgba(shadow, 0.2),
      '--button-bg': rgba(tint, glass.buttonBg),
      '--button-bg-hover': rgba(tint, glass.buttonBgHover),
      '--button-bg-active': toHex(fromOklch(active)),
      '--button-text': toHex(fromOklch(buttonText)),
      '--button-text-active': toHex(activeText),
      '--button-border': rgba(line, 0.22),
      '--button-border-strong': rgba(line, 0.38),
      '--card-glow': rgba(glowB, 0.2),
      '--grid-line': rgba(line, 0.09),
      '--scene-wash': rgba(tint, 0.15),
      '--header-scrim': rgba(tint, scrim),
    },
    themeColor: toHex(pageBase),
    contrast: {
      main: contrastRatio(inkRgb, surface),
      muted: contrastRatio(mutedRgb, surface),
      soft: contrastRatio(fromOklch(soft), surface),
      buttonText: contrastRatio(fromOklch(buttonText), surface),
      headerMain: contrastRatio(inkRgb, header),
      headerMuted: contrastRatio(mutedRgb, header),
      activeText: contrastRatio(fromOklch(active), activeText),
    },
  };
};

/** The tokens as a CSS rule that beats global.css's `html[data-theme='ivory']`. */
export const scenePaletteCss = (palette: ScenePalette): string =>
  `html[data-theme='ivory']:root{${Object.entries(palette.tokens)
    .map(([k, v]) => `${k}:${v}`)
    .join(';')}}`;
