(() => {
  /**
   * Page Transition orchestrates a manual exit animation when navigating between pages.
   * It targets standard links and applies a CSS class to the root element to trigger
   * transitions defined in CSS (e.g., opacity or scale shifts).
   */
  const root = document.documentElement;
  const NAV_EXIT_RESET_MS = 900;
  let exitResetTimer = 0;

  /**
   * Logic to determine if a click on an anchor should trigger an animated navigation.
   * Filters out external links, downloads, hash links, and special key combinations (Cmd/Ctrl).
   */
  const shouldHandle = (anchor, event) => {
    if (!anchor || event.defaultPrevented) return false;
    if (event.button !== 0) return false;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    if (anchor.target && anchor.target !== "_self") return false;
    if (anchor.hasAttribute("download")) return false;

    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("#")) return false;

    const url = new URL(anchor.href, globalThis.location.href);
    if (url.origin !== globalThis.location.origin) return false;
    if (url.href === globalThis.location.href) return false;

    return true;
  };

  const markNavigation = (anchor) => {
    if (!(anchor instanceof HTMLAnchorElement)) return;
    
    // Trigger the CSS exit animation.
    root.classList.add("is-nav-exiting");

    if (exitResetTimer) {
      globalThis.clearTimeout(exitResetTimer);
    }

    /**
     * Stale State Guard:
     * If navigation is canceled (e.g. 404, network error, or user stop),
     * we must clear the 'is-nav-exiting' tag after a timeout so the UI doesn't 
     * remain stuck in a transitioned-out/hidden state.
     */
    exitResetTimer = globalThis.setTimeout(() => {
      root.classList.remove("is-nav-exiting");
      exitResetTimer = 0;
    }, NAV_EXIT_RESET_MS);
  };

  /** Global click listener for progressive enhancement of link navigation. */
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const anchor = target.closest("a[href]");
    if (!(anchor instanceof HTMLAnchorElement)) return;
    if (!shouldHandle(anchor, event)) return;

    markNavigation(anchor);
  });

  const clearExitState = () => {
    root.classList.remove("is-nav-exiting");
    if (exitResetTimer) {
      globalThis.clearTimeout(exitResetTimer);
      exitResetTimer = 0;
    }
  };

  // Restoration Handling:
  // When a user goes "Back" or "Forward", the browser might restore a page 
  // from the Back-Forward Cache (bfcache). We must ensure visibility is reset.
  globalThis.addEventListener("pageshow", () => {
    clearExitState();
  });

  // Ensure state is clean before the page is hidden.
  globalThis.addEventListener("pagehide", () => {
    clearExitState();
  });

  // Re-enable visibility if the user switches back to this tab.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      clearExitState();
    }
  });
})();
