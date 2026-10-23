/**
 * Daily background rotation. The pool is every image the optimizer found in
 * public/backgrounds/light (the keys of background-colors.json), so adding or
 * deleting a source .jpg and re-running `npm run optimize:backgrounds` is the
 * only step needed to change the rotation.
 */
import backgroundColorsData from '../data/background-colors.json';
import type { BackgroundColor } from '../types/client';

const backgroundColors: Record<string, BackgroundColor> =
  backgroundColorsData as Record<string, BackgroundColor>;

/** Every background currently on disk, sorted so the order is stable. */
export const backgroundPool: readonly string[] =
  Object.keys(backgroundColors).sort();

/**
 * Day-of-week overrides for specific backgrounds.
 * Key: JS day-of-week number (0=Sunday, 6=Saturday). Ignored if the image
 * has been removed from the pool.
 */
export const dayOfWeekOverrides: Readonly<Record<number, string>> = {
  6: 'pawel-czerwinski-z4n8CGRuzOA-unsplash', // Saturday
};

const MS_PER_DAY = 86_400_000;

/**
 * Picks the background for a date. Uses whole UTC days since the epoch, so
 * every image gets an equal turn and a build anywhere picks the same image.
 */
export const selectBackground = (
  date: Date,
  pool: readonly string[] = backgroundPool
): string => {
  if (pool.length === 0) {
    throw new Error('No backgrounds: run `npm run optimize:backgrounds`.');
  }

  const override = dayOfWeekOverrides[date.getUTCDay()];
  if (override && pool.includes(override)) {
    return override;
  }

  const dayNumber = Math.floor(date.getTime() / MS_PER_DAY);
  return pool[dayNumber % pool.length]!;
};

const FALLBACK_COLOR: BackgroundColor = {
  dominant: '#ece9e3',
  average: '#ece9e3',
  luminance: 220,
  isDark: false,
};

/** Unsplash photo IDs are 11 characters and may themselves contain dashes. */
const UNSPLASH_ID_LENGTH = 11;

/**
 * Unsplash photo link and author for a background, parsed from its file
 * name (`<author-slug>-<photo-id>-unsplash`).
 */
export const backgroundCredit = (
  name: string
): { url: string; author: string } => {
  const clean = name.replace('-unsplash', '').replace(/\(\d+\)$/, '');
  const url = `https://unsplash.com/photos/${clean}`;
  const authorSlug = clean.slice(0, -(UNSPLASH_ID_LENGTH + 1));

  if (clean.length <= UNSPLASH_ID_LENGTH + 1 || !authorSlug) {
    return { url, author: 'Unknown' };
  }

  const author = authorSlug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return { url, author };
};

/** Color statistics for a background, with a neutral fallback. */
export const backgroundColorFor = (name: string): BackgroundColor =>
  backgroundColors[name] ?? FALLBACK_COLOR;
