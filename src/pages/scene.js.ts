/**
 * Today's background and palette for the standalone pages in public/projects,
 * which can't use BaseLayout. They load it as a classic script in <head>, so
 * it runs before first paint. Prerendered: the daily rebuild rotates it.
 */
import type { APIRoute } from 'astro';
import {
  backgroundColorFor,
  backgroundCredit,
  selectBackground,
} from '../utils/background-rotation';
import { buildScenePalette } from '../utils/scene-palette';

/** The standalone pages' own names for the site tokens they mirror. */
const STANDALONE_TOKENS: Record<string, string> = {
  '--bg': '--bg-primary',
  '--glass': '--bg-secondary',
  '--glass-strong': '--glass-bg-strong',
  '--ink': '--text-main',
  '--muted': '--text-muted',
  '--soft': '--text-soft',
  '--rule': '--border-color',
  '--rule-strong': '--border-hover',
  '--btn': '--button-bg',
  '--btn-hover': '--button-bg-hover',
  '--btn-active': '--button-bg-active',
  '--btn-ink': '--button-text',
  '--btn-ink-active': '--button-text-active',
  '--warm': '--ambient-a',
  '--cool': '--ambient-b',
  '--glow': '--card-glow',
  '--shadow': '--shadow-main',
  '--grid': '--grid-line',
  '--scene-wash': '--scene-wash',
};

const BACKGROUND_VERSION = '20260404hq';

export const GET: APIRoute = () => {
  const name = selectBackground(new Date());
  const palette = buildScenePalette(backgroundColorFor(name));
  const scene = {
    base: `/backgrounds/light/${name}`,
    version: BACKGROUND_VERSION,
    tokens: Object.fromEntries(
      Object.entries(STANDALONE_TOKENS).map(([local, site]) => [
        local,
        palette.tokens[site]!,
      ])
    ),
    themeColor: palette.themeColor,
    credit: backgroundCredit(name),
  };

  const script = `(() => {
  const scene = ${JSON.stringify(scene)};
  const root = document.documentElement;
  const v = '?v=' + scene.version;
  root.style.setProperty(
    '--scene-image',
    'image-set(url("' + scene.base + '.avif' + v + '") type("image/avif"), url("' + scene.base + '.webp' + v + '") type("image/webp"), url("' + scene.base + '.jpg' + v + '") type("image/jpeg"))'
  );
  for (const [name, value] of Object.entries(scene.tokens)) {
    root.style.setProperty(name, value);
  }
  // Fetch the photo now: CSS only requests it at the first style pass.
  const preload = document.createElement('link');
  preload.rel = 'preload';
  preload.as = 'image';
  preload.type = 'image/avif';
  preload.href = scene.base + '.avif' + v;
  document.head.append(preload);
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', scene.themeColor);
    const credit = document.querySelector('.bg-credit');
    if (!credit) return;
    credit.href = scene.credit.url;
    credit.textContent = 'Background by ' + scene.credit.author;
  });
})();
`;

  return new Response(script, {
    headers: { 'Content-Type': 'text/javascript; charset=utf-8' },
  });
};
