/**
 * Tests for src/utils/scene-palette.ts. The per-background checks re-derive
 * each surface from the emitted CSS tokens and the measured darkest color,
 * so they verify what the browser will actually draw, not just the module's
 * own report.
 */
import { describe, it, expect } from 'vitest';
import backgroundColors from '../../src/data/background-colors.json';
import type { BackgroundColor } from '../../src/types/client';
import {
  CONTRAST_TARGETS,
  buildScenePalette,
  composite,
  contrastRatio,
  fromOklch,
  parseHex,
  toHex,
  toOklch,
} from '../../src/utils/scene-palette';

const colors = backgroundColors as Record<string, BackgroundColor>;

/** Parses `#rrggbb`, `rgb(r g b)` or `rgb(r g b / a)`. */
const parseColor = (value: string) => {
  if (value.startsWith('#')) {
    return { rgb: parseHex(value), alpha: 1 };
  }
  const m = /^rgb\((\d+) (\d+) (\d+)(?: \/ ([\d.]+))?\)$/.exec(value);
  if (!m) {
    throw new Error(`Unexpected color ${value}`);
  }
  return {
    rgb: [Number(m[1]), Number(m[2]), Number(m[3])] as const,
    alpha: m[4] === undefined ? 1 : Number(m[4]),
  };
};

describe('color math', () => {
  it('contrast ratio spans 1 to 21', () => {
    expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 5);
    expect(contrastRatio([90, 90, 90], [90, 90, 90])).toBe(1);
  });

  it('matches a known WCAG value (#767676 on white is 4.54:1)', () => {
    expect(contrastRatio(parseHex('#767676'), [255, 255, 255])).toBeCloseTo(
      4.54,
      2
    );
  });

  it('round-trips through OKLCH', () => {
    for (const hex of ['#3c62b7', '#fb4638', '#ece9e3', '#0f2172']) {
      expect(toHex(fromOklch(toOklch(parseHex(hex))))).toBe(hex);
    }
  });

  it('composites like the browser', () => {
    expect(composite([255, 255, 255], [0, 0, 0], 0.5)).toEqual([
      127.5, 127.5, 127.5,
    ]);
  });
});

describe.each(Object.keys(colors).sort())('palette for %s', (name) => {
  const stats = colors[name]!;
  const palette = buildScenePalette(stats);
  const t = (token: string) => parseColor(palette.tokens[token]!);
  const shade = parseHex(stats.shade!);

  it('has the measured inputs from the optimizer', () => {
    expect(stats.accent).toMatch(/^#[0-9a-f]{6}$/);
    expect(stats.shade).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('keeps all text readable on the weakest glass over the darkest area', () => {
    const tint = t('--button-bg').rgb;
    const weakest = Math.min(
      t('--button-bg').alpha * 0.74,
      t('--bg-secondary').alpha * 0.64
    );
    const surface = composite(tint, shade, weakest);
    expect(contrastRatio(t('--text-main').rgb, surface)).toBeGreaterThanOrEqual(
      CONTRAST_TARGETS.main
    );
    for (const token of ['--text-muted', '--text-soft', '--button-text']) {
      expect(contrastRatio(t(token).rgb, surface)).toBeGreaterThanOrEqual(
        CONTRAST_TARGETS.text
      );
    }
  });

  it('keeps header text on the photo readable over its backing', () => {
    const scrim = t('--header-scrim');
    // global.css blurs the backing; at least 75% of it remains behind text.
    const surface = composite(scrim.rgb, shade, scrim.alpha * 0.75);
    for (const token of ['--text-main', '--text-muted']) {
      expect(contrastRatio(t(token).rgb, surface)).toBeGreaterThanOrEqual(
        CONTRAST_TARGETS.text
      );
    }
  });

  it('keeps active pill text readable', () => {
    expect(
      contrastRatio(t('--button-bg-active').rgb, t('--button-text-active').rgb)
    ).toBeGreaterThanOrEqual(CONTRAST_TARGETS.text);
  });

  it('keeps the text tiers in order (main darkest)', () => {
    const lum = (token: string) => toOklch(t(token).rgb).l;
    expect(lum('--text-main')).toBeLessThan(lum('--text-muted'));
    expect(lum('--text-muted')).toBeLessThan(lum('--text-soft'));
  });
});

describe('palettes follow the photo', () => {
  it('gives different photos different accents', () => {
    const actives = new Set(
      Object.values(colors).map(
        (stats) => buildScenePalette(stats).tokens['--button-bg-active']
      )
    );
    expect(actives.size).toBeGreaterThan(Object.keys(colors).length / 2);
  });
});
