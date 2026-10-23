/** Color statistics written by scripts/optimize-backgrounds.py. */
export interface BackgroundColor {
  average: string;
  dominant: string;
  isDark: boolean;
  luminance: number;
  /** Most prominent vivid hue. */
  accent?: string;
  /** Second vivid hue at least 35° from the accent, if the photo has one. */
  accentAlt?: string | null;
  /** Mean of the darkest 3% of the photo: the worst case for readability. */
  shade?: string;
}

export type SiteTheme = 'ivory';

export type BackgroundConfig = Partial<Record<SiteTheme, string>>;

export type SceneQuality = 'tiny' | 'avif' | 'webp' | 'default';

export const SITE_THEMES = ['ivory'] as const;

export const isSiteTheme = (
  value: string | null | undefined
): value is SiteTheme => value === 'ivory';
