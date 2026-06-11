import { type SceneQuality } from "../types/client";

(() => {
  /**
   * Background Loader orchestrates the progressive loading of the ivory theme imagery.
   *
   * Progressive encoding strategy:
   * 1. Immediately show a 72px 'tiny' placeholder (already blurred at CSS level).
   * 2. Asynchronously load the best supported format (AVIF > WebP > JPG).
   * 3. Once loaded, crossfade from the placeholder to the high-quality image
   *    using a layered element approach for a smooth visual transition.
   */
  if (globalThis.__persBackgroundLoaderInitialized) {
    return;
  }
  globalThis.__persBackgroundLoaderInitialized = true;

  const root = document.documentElement;
  const backgroundAssetVersion = "20260404hq";
  const sceneQualityKey = `bg-scene-quality-${backgroundAssetVersion}-ivory`;
  let activeLoadToken = 0;

  const backgrounds = globalThis.__BACKGROUND_CONFIG ?? {
    ivory: "/backgrounds/light/eve-jCBLFtjpXfw-unsplash.jpg",
  };

  const image: string | undefined = backgrounds.ivory;

  const basePathFor = (img: string) => img.replace(/\.[^.]+$/, "");

  const avifPath = (img: string) => `${basePathFor(img)}.avif`;

  const webpPath = (img: string) => `${basePathFor(img)}.webp`;

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

  const readSessionSceneQuality = () => {
    try {
      return normalizeQuality(sessionStorage.getItem(sceneQualityKey));
    } catch {
      return null;
    }
  };

  const writeSessionSceneQuality = (quality: SceneQuality) => {
    try {
      sessionStorage.setItem(sceneQualityKey, quality);
    } catch {
      // Ignore storage write failures and keep runtime behavior functional.
    }
  };

  /**
   * Crossfades from the current background to a newly loaded high-quality image.
   * Creates a temporary overlay element that fades in with the new image, then
   * updates the CSS variable and removes the overlay for a seamless transition.
   */
  const crossfadeToImage = (imageSrc: string, quality: SceneQuality) => {
    const sceneBg = document.getElementById("scene-bg");
    if (!sceneBg) {
      applySceneQuality(quality);
      writeSessionSceneQuality(quality);
      return;
    }

    // If the current quality is already high-res (not tiny), skip the animation
    const currentQuality = normalizeQuality(root.dataset.sceneQuality ?? null);
    if (currentQuality && currentQuality !== "tiny") {
      applySceneQuality(quality);
      writeSessionSceneQuality(quality);
      return;
    }

    // Create a crossfade overlay that will hold the high-res image
    const overlay = document.createElement("div");
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.cssText = [
      "position: fixed",
      "inset: 0",
      "z-index: -2",
      `background-image: url("${imageSrc}")`,
      "background-position: center center",
      "background-size: cover",
      "background-repeat: no-repeat",
      "opacity: 0",
      "transition: opacity 600ms cubic-bezier(0.22, 0.61, 0.36, 1)",
      "pointer-events: none",
    ].join("; ");

    sceneBg.parentElement?.insertBefore(overlay, sceneBg.nextSibling);

    // Force a layout flush before triggering the transition
    void overlay.offsetHeight;

    overlay.style.opacity = "1";

    const onTransitionDone = () => {
      overlay.removeEventListener("transitionend", onTransitionDone);

      // Update the CSS variable to point to the high-res image, then remove overlay
      applySceneQuality(quality);
      writeSessionSceneQuality(quality);

      // Small delay to ensure the CSS variable has taken effect before removing overlay
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          overlay.remove();
        });
      });
    };

    overlay.addEventListener("transitionend", onTransitionDone);

    // Safety timeout in case transitionend doesn't fire (e.g., reduced motion)
    globalThis.setTimeout(() => {
      if (overlay.parentElement) {
        onTransitionDone();
      }
    }, 800);
  };

  const loadImage = (src: string, quality: SceneQuality, loadToken: number, onError: () => void) => {
    const loader = new Image();
    loader.decoding = "async";
    loader.src = src;

    loader.onload = () => {
      if (loadToken !== activeLoadToken) {
        return;
      }

      crossfadeToImage(src, quality);
    };

    loader.onerror = () => {
      if (loadToken !== activeLoadToken) {
        return;
      }

      onError();
    };
  };

  const applyBackground = (
    options: { progressive?: boolean; useTinyPlaceholder?: boolean } = {}
  ) => {
    const { progressive = true, useTinyPlaceholder = true } = options;
    if (!image) {
      return;
    }

    if (!progressive) {
      applySceneQuality("default");
      writeSessionSceneQuality("default");
      return;
    }

    if (useTinyPlaceholder) {
      applySceneQuality("tiny");
    }

    const loadToken = ++activeLoadToken;
    loadImage(withVersion(avifPath(image)), "avif", loadToken, () => {
      loadImage(withVersion(webpPath(image)), "webp", loadToken, () => {
        // Final fallback: crossfade to the original JPG
        if (loadToken === activeLoadToken) {
          crossfadeToImage(withVersion(image), "default");
        }
      });
    });
  };

  const cachedSceneQuality = readSessionSceneQuality();
  if (cachedSceneQuality) {
    applySceneQuality(cachedSceneQuality);
  }

  applyBackground({
    progressive: true,
    useTinyPlaceholder: !cachedSceneQuality
  });

  document.addEventListener("themechange", () => {
    const cached = readSessionSceneQuality();
    if (cached) {
      applySceneQuality(cached);
      applyBackground({ progressive: true, useTinyPlaceholder: false });
      return;
    }

    applyBackground({ progressive: true, useTinyPlaceholder: true });
  });
})();
