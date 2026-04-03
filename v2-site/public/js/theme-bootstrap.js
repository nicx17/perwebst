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
    const cachedScene = sessionStorage.getItem(`bg-scene-${activeTheme}`);
    if (cachedScene) {
      root.style.setProperty("--scene-image", cachedScene);
    }
  } catch {
    // Ignore storage access failures in restricted browser modes.
  }
})();
