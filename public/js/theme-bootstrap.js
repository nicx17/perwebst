(() => {
  try {
    const root = document.documentElement;
    const backgroundAssetVersion = "20260404hq";
    const sceneQualityKey = (theme) => `bg-scene-quality-${backgroundAssetVersion}-${theme}`;
    const normalizeQuality = (value) => {
      if (value === "tiny" || value === "avif" || value === "webp" || value === "default") {
        return value;
      }

      return null;
    };

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "ivory" || savedTheme === "midnight") {
      root.dataset.theme = savedTheme;
    }

    const activeTheme =
      root.dataset.theme === "ivory" || root.dataset.theme === "midnight"
        ? root.dataset.theme
        : "ivory";
    const cacheKey = sceneQualityKey(activeTheme);
    const cachedSceneQuality = normalizeQuality(sessionStorage.getItem(cacheKey));
    if (cachedSceneQuality) {
      root.dataset.sceneQuality = cachedSceneQuality;
    }
  } catch {
    // Ignore storage access failures in restricted browser modes.
  }
})();
