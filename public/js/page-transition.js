(() => {
  const root = document.documentElement;
  const NAV_EXIT_RESET_MS = 900;
  let exitResetTimer = 0;

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
    root.classList.add("is-nav-exiting");

    if (exitResetTimer) {
      globalThis.clearTimeout(exitResetTimer);
    }

    // Guard against stale exit state when navigation is canceled or interrupted.
    exitResetTimer = globalThis.setTimeout(() => {
      root.classList.remove("is-nav-exiting");
      exitResetTimer = 0;
    }, NAV_EXIT_RESET_MS);
  };

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

  // Ensure restored pages from bfcache are visible immediately.
  globalThis.addEventListener("pageshow", () => {
    clearExitState();
  });

  // Clean up in non-navigation interaction paths.
  globalThis.addEventListener("pagehide", () => {
    clearExitState();
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      clearExitState();
    }
  });
})();
