import { isSiteTheme, type SceneQuality, type SiteTheme } from "../types/client";

(() => {
  /**
   * Background Loader orchestrates the progressive loading of theme-specific imagery.
   * Strategy:
   * 1. Initial display uses a 'tiny' 72px placeholder.
   * 2. Asynchronously attempts to load the 'avif' high-quality version.
   * 3. Falls back to 'webp' if avif fails or is unsupported.
   * 4. Falls back to original 'jpg' as the final legacy recovery.
   */
  if (globalThis.__persBackgroundLoaderInitialized) {
    return;
  }
  globalThis.__persBackgroundLoaderInitialized = true;

  const root = document.documentElement;
  const backgroundAssetVersion = "20260404hq";
  const sceneQualityKey = (theme: SiteTheme) => `bg-scene-quality-${backgroundAssetVersion}-${theme}`;
  let activeLoadToken = 0;

  const backgrounds = globalThis.__BACKGROUND_CONFIG ?? {
    ivory: "/backgrounds/light/eve-jCBLFtjpXfw-unsplash.jpg",
    midnight: "/backgrounds/dark/jan-kopriva-L-bVMhRb5cs-unsplash.jpg"
  };

  const currentTheme = (): SiteTheme => {
    if (isSiteTheme(root.dataset.theme)) {
      return root.dataset.theme;
    }

    return globalThis.matchMedia("(prefers-color-scheme: dark)").matches ? "midnight" : "ivory";
  };

  const imageFor = (theme: SiteTheme): string | undefined => backgrounds[theme] ?? backgrounds.ivory;

  const basePathFor = (image: string) => image.replace(/\.[^.]+$/, "");

  const avifPath = (image: string) => `${basePathFor(image)}.avif`;

  const webpPath = (image: string) => `${basePathFor(image)}.webp`;

  const withVersion = (assetPath: string) => `${assetPath}?v=${backgroundAssetVersion}`;

  const normalizeQuality = (value: string | null): SceneQuality | null => {
    if (value === "tiny" || value === "avif" || value === "webp" || value === "default") {
      return value;
    }

    return null;
  };

  const applySceneQuality = (value: string | null) => {
    root.dataset.sceneQuality = normalizeQuality(value) ?? "default";
  };

  const readSessionSceneQuality = (theme: SiteTheme) => {
    try {
      return normalizeQuality(sessionStorage.getItem(sceneQualityKey(theme)));
    } catch {
      return null;
    }
  };

  const writeSessionSceneQuality = (theme: SiteTheme, quality: SceneQuality) => {
    try {
      sessionStorage.setItem(sceneQualityKey(theme), quality);
    } catch {
      // Ignore storage write failures and keep runtime behavior functional.
    }
  };

  const loadImage = (src: string, quality: SceneQuality, theme: SiteTheme, loadToken: number, onError: () => void) => {
    const loader = new Image();
    loader.decoding = "async";
    loader.src = src;

    loader.onload = () => {
      if (loadToken !== activeLoadToken) {
        return;
      }

      applySceneQuality(quality);
      writeSessionSceneQuality(theme, quality);
    };

    loader.onerror = () => {
      if (loadToken !== activeLoadToken) {
        return;
      }

      onError();
    };
  };

  const applyBackground = (
    theme: SiteTheme,
    options: { progressive?: boolean; useTinyPlaceholder?: boolean } = {}
  ) => {
    const { progressive = true, useTinyPlaceholder = true } = options;
    const image = imageFor(theme);
    if (!image) {
      return;
    }

    if (!progressive) {
      applySceneQuality("default");
      writeSessionSceneQuality(theme, "default");
      return;
    }

    if (useTinyPlaceholder) {
      applySceneQuality("tiny");
    }

    const loadToken = ++activeLoadToken;
    loadImage(withVersion(avifPath(image)), "avif", theme, loadToken, () => {
      loadImage(withVersion(webpPath(image)), "webp", theme, loadToken, () => {
        applySceneQuality("default");
        writeSessionSceneQuality(theme, "default");
      });
    });
  };

  const syncThemeBackground = (theme: SiteTheme) => {
    const cachedQuality = readSessionSceneQuality(theme);
    if (cachedQuality) {
      applySceneQuality(cachedQuality);
      applyBackground(theme, { progressive: true, useTinyPlaceholder: false });
      return;
    }

    applyBackground(theme, { progressive: true, useTinyPlaceholder: true });
  };

  const firstTheme = currentTheme();
  const cachedSceneQuality = readSessionSceneQuality(firstTheme);
  if (cachedSceneQuality) {
    applySceneQuality(cachedSceneQuality);
  }

  applyBackground(firstTheme, {
    progressive: true,
    useTinyPlaceholder: !cachedSceneQuality
  });

  document.addEventListener("themechange", (event) => {
    syncThemeBackground(event.detail.theme);
  });
})();
