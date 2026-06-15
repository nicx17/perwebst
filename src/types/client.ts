export interface BackgroundColor {
  average: string;
  dominant: string;
  isDark: boolean;
  luminance: number;
}

export type SiteTheme = 'ivory';

export type BackgroundConfig = Partial<Record<SiteTheme, string>>;

export type SceneQuality = 'tiny' | 'avif' | 'webp' | 'default';

export const SITE_THEMES = ['ivory'] as const;

export const isSiteTheme = (
  value: string | null | undefined
): value is SiteTheme => value === 'ivory';
