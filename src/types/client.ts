export type SiteTheme = "ivory" | "midnight";

export type BackgroundConfig = Partial<Record<SiteTheme, string>>;

export type SceneQuality = "tiny" | "avif" | "webp" | "default";

export const SITE_THEMES = ["ivory", "midnight"] as const;

export const isSiteTheme = (value: string | null | undefined): value is SiteTheme =>
  value === "ivory" || value === "midnight";
