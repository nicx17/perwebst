(() => {
  if (globalThis.__persThemeToggleInitialized) {
    return;
  }
  globalThis.__persThemeToggleInitialized = true;

  const themes = new Set(["ivory", "midnight"]);
  const root = document.documentElement;
  const switchingTimers = new WeakMap();

  const emitThemeChange = (theme) => {
    document.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
  };

  const readTheme = () => {
    const current = root.dataset.theme;
    return current && themes.has(current) ? current : "ivory";
  };

  const updateToggleUI = () => {
    const activeTheme = readTheme();
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      const nextTheme = activeTheme === "ivory" ? "midnight" : "ivory";
      button.dataset.themeState = activeTheme;
      button.setAttribute("aria-label", `Theme is ${activeTheme}. Switch to ${nextTheme}.`);
      button.setAttribute("aria-pressed", activeTheme === "midnight" ? "true" : "false");
    });
  };

  const applySavedTheme = () => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved && themes.has(saved)) {
        root.dataset.theme = saved;
      }
    } catch {
      // Ignore localStorage failures in restricted browser modes.
    }

    emitThemeChange(readTheme());
  };

  const toggleTheme = () => {
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      const existingTimer = switchingTimers.get(button);
      if (existingTimer) {
        globalThis.clearTimeout(existingTimer);
      }

      button.dataset.themeSwitching = "true";
      const timer = globalThis.setTimeout(() => {
        delete button.dataset.themeSwitching;
        switchingTimers.delete(button);
      }, 430);
      switchingTimers.set(button, timer);
    });

    const nextTheme = readTheme() === "ivory" ? "midnight" : "ivory";
    root.dataset.theme = nextTheme;
    try {
      localStorage.setItem("theme", nextTheme);
    } catch {
      // Ignore localStorage failures in restricted browser modes.
    }
    updateToggleUI();
    emitThemeChange(nextTheme);
  };

  const bindToggle = () => {
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      if (button.dataset.themeBound === "true") {
        return;
      }

      button.addEventListener("click", toggleTheme);
      button.dataset.themeBound = "true";
    });
    updateToggleUI();

    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      if (button.dataset.themeReady === "true") {
        return;
      }

      button.dataset.themeReady = "true";
    });
  };

  const beginRouteTransition = () => {
    root.classList.add("is-route-transitioning");
  };

  const endRouteTransition = () => {
    globalThis.requestAnimationFrame(() => {
      root.classList.remove("is-route-transitioning");
    });
  };

  const persistThemeAcrossSwap = (event) => {
    const nextRoot = event?.newDocument?.documentElement;
    if (!nextRoot) {
      return;
    }

    const activeTheme = readTheme();
    nextRoot.dataset.theme = activeTheme;

    const activeSceneQuality = root.dataset.sceneQuality;
    if (activeSceneQuality) {
      nextRoot.dataset.sceneQuality = activeSceneQuality;
    }
  };

  applySavedTheme();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindToggle, { once: true });
  } else {
    bindToggle();
  }

  document.addEventListener("astro:before-swap", persistThemeAcrossSwap);
  document.addEventListener("astro:before-preparation", beginRouteTransition);
  document.addEventListener("astro:page-load", bindToggle);
  document.addEventListener("astro:page-load", endRouteTransition);
})();
