(() => {
  try {
    const root = document.documentElement;
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "ivory" || savedTheme === "midnight") {
      root.dataset.theme = savedTheme;
    }

    const activeTheme =
      root.dataset.theme === "ivory" || root.dataset.theme === "midnight"
        ? root.dataset.theme
        : "ivory";
    const cacheKey = `bg-scene-${activeTheme}`;
    const cachedScene = sessionStorage.getItem(cacheKey);
    const isLegacyImageSet = typeof cachedScene === "string" && cachedScene.includes("image-set(");
    if (isLegacyImageSet) {
      sessionStorage.removeItem(cacheKey);
    } else if (cachedScene) {
      root.style.setProperty("--scene-image", cachedScene);
    }
  } catch {
    // Ignore storage access failures in restricted browser modes.
  }
})();
