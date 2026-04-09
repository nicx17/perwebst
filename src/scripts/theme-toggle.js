(() => {
  /**
   * Theme Toggle manages the state and persistence of the site's ivory/midnight themes.
   * It ensures that theme changes are reflected across the UI, persisted to localStorage,
   * and synchronized with Astro's View Transitions lifecycle.
   */
  if (globalThis.__persThemeToggleInitialized) {
    return;
  }
  globalThis.__persThemeToggleInitialized = true;

  const themes = new Set(["ivory", "midnight"]);
  const root = document.documentElement;
  const switchingTimers = new WeakMap();

  /** Dispatches a cross-application event when the theme is updated. */
  const emitThemeChange = (theme) => {
    document.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
  };

  /** Reads the current theme from the root element's dataset. */
  const readTheme = () => {
    const current = root.dataset.theme;
    return current && themes.has(current) ? current : "ivory";
  };

  /** Updates attributes on all toggle buttons to reflect the current state. */
  const updateToggleUI = () => {
    const activeTheme = readTheme();
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      const nextTheme = activeTheme === "ivory" ? "midnight" : "ivory";
      button.dataset.themeState = activeTheme;
      button.setAttribute("aria-label", `Theme is ${activeTheme}. Switch to ${nextTheme}.`);
      button.setAttribute("aria-pressed", activeTheme === "midnight" ? "true" : "false");
    });
  };

  /** Hydrates the application theme from localStorage on initial load. */
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

  /**
   * Toggles the theme, persists it, and manages the 'switching' state for CSS animations.
   */
  const toggleTheme = () => {
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      const existingTimer = switchingTimers.get(button);
      if (existingTimer) {
        globalThis.clearTimeout(existingTimer);
      }

      // Indicate 'switching' state to CSS to disable transitions during the swap
      // or to trigger specific 'click' animations.
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

  /** Binds the toggle logic to any buttons found in the DOM. */
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

  /**
   * Handlers for Astro's View Transitions to ensure the theme state is preserved
   * when the document body is replaced.
   */
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
  document.addEventListener("astro:page-load", bindToggle);
})();
