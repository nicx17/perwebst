/**
 * Theme initialization ensures ivory is always applied.
 * No toggle functionality -- the site is ivory-only.
 */
(() => {
  if (globalThis.__persThemeToggleInitialized) {
    return;
  }
  globalThis.__persThemeToggleInitialized = true;

  const root = document.documentElement;

  const applyIvory = () => {
    root.dataset.theme = 'ivory';
    try {
      localStorage.setItem('theme', 'ivory');
    } catch {
      // Ignore localStorage failures in restricted browser modes.
    }
    document.dispatchEvent(
      new CustomEvent('themechange', { detail: { theme: 'ivory' } })
    );
  };

  applyIvory();

  /**
   * Handler for Astro's View Transitions to ensure the theme state is preserved
   * when the document body is replaced.
   */
  const persistThemeAcrossSwap = (event: Event) => {
    const swapEvent = event as Event & { newDocument?: Document };
    const nextRoot = swapEvent.newDocument?.documentElement;
    if (!nextRoot) {
      return;
    }

    nextRoot.dataset.theme = 'ivory';

    const activeSceneQuality = root.dataset.sceneQuality;
    if (activeSceneQuality) {
      nextRoot.dataset.sceneQuality = activeSceneQuality;
    }
  };

  document.addEventListener('astro:before-swap', persistThemeAcrossSwap);
})();
