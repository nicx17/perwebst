(() => {
  const root = document.documentElement;

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
  };

  // Mark outgoing navigation as early as possible without delaying native navigation.
  document.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;

    const target = event.target;
    if (!(target instanceof Element)) return;

    const anchor = target.closest("a[href]");
    if (!(anchor instanceof HTMLAnchorElement)) return;
    if (!shouldHandle(anchor, event)) return;

    markNavigation(anchor);
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const anchor = target.closest("a[href]");
    if (!(anchor instanceof HTMLAnchorElement)) return;
    if (!shouldHandle(anchor, event)) return;

    markNavigation(anchor);
  });

  // Ensure restored pages from bfcache are visible immediately.
  globalThis.addEventListener("pageshow", () => {
    root.classList.remove("is-nav-exiting");
  });
})();
