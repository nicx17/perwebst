/**
 * Tests for src/utils/background-rotation.ts: the pool comes from the
 * optimizer's background-colors.json, so removing a background there removes
 * it from the rotation with no other edits.
 */
import { describe, it, expect } from 'vitest';
import backgroundColors from '../../src/data/background-colors.json';
import {
  backgroundCredit,
  backgroundPool,
  dayOfWeekOverrides,
  selectBackground,
} from '../../src/utils/background-rotation';

const DAY = 86_400_000;
/** Midnight UTC on a Monday. */
const MONDAY = Date.UTC(2026, 9, 19);
const SATURDAY_OVERRIDE = dayOfWeekOverrides[6]!;

describe('backgroundPool', () => {
  it('is exactly the backgrounds the optimizer found', () => {
    expect([...backgroundPool]).toEqual(Object.keys(backgroundColors).sort());
  });

  it('has no duplicates and only Unsplash file names', () => {
    expect(new Set(backgroundPool).size).toBe(backgroundPool.length);
    for (const name of backgroundPool) {
      expect(name).toMatch(/^[A-Za-z0-9_-]+-unsplash$/);
    }
  });

  it('contains every day-of-week override', () => {
    for (const name of Object.values(dayOfWeekOverrides)) {
      expect(backgroundPool).toContain(name);
    }
  });
});

describe('selectBackground', () => {
  it('always returns a member of the pool', () => {
    for (let d = 0; d < 400; d++) {
      expect(backgroundPool).toContain(
        selectBackground(new Date(MONDAY + d * DAY))
      );
    }
  });

  it('is the same all day (UTC) and changes at UTC midnight', () => {
    const morning = selectBackground(new Date(MONDAY + 1000));
    expect(selectBackground(new Date(MONDAY + DAY - 1000))).toBe(morning);
    expect(selectBackground(new Date(MONDAY + DAY + 1000))).not.toBe(morning);
  });

  it('uses the Saturday override', () => {
    expect(selectBackground(new Date(MONDAY + 5 * DAY))).toBe(
      SATURDAY_OVERRIDE
    );
  });

  it('ignores an override that is no longer in the pool', () => {
    const pool = ['a-unsplash', 'b-unsplash'];
    const saturday = selectBackground(new Date(MONDAY + 5 * DAY), pool);
    expect(pool).toContain(saturday);
  });

  it('gives every background a turn over one cycle', () => {
    const pool = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];
    const seen = new Set<string>();
    for (let d = 0; d < pool.length; d++) {
      seen.add(selectBackground(new Date(MONDAY + d * DAY), pool));
    }
    expect(seen.size).toBe(pool.length);
  });

  it('throws when there are no backgrounds', () => {
    expect(() => selectBackground(new Date(MONDAY), [])).toThrow(
      /optimize:backgrounds/
    );
  });
});

describe('backgroundCredit', () => {
  it.each([
    ['sean-sinclair-C_NJKfnTR5A-unsplash', 'Sean Sinclair'],
    // Photo IDs can contain dashes; the author must not swallow part of one.
    ['eve-Fp96C-6Wd6o-unsplash', 'Eve'],
    ['plufow-le-studio-aE8Mx8-vQss-unsplash', 'Plufow Le Studio'],
    ['dirk-lach-_uamwvb8UlI-unsplash', 'Dirk Lach'],
  ])('%s is by %s', (name, author) => {
    expect(backgroundCredit(name).author).toBe(author);
  });

  it('links to the photo', () => {
    expect(backgroundCredit('eve-Fp96C-6Wd6o-unsplash').url).toBe(
      'https://unsplash.com/photos/eve-Fp96C-6Wd6o'
    );
  });
});
