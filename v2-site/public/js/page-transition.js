(() => {
  const root = document.documentElement;
  const navFlag = "nav-transition-pending";

  // If previous page marked a transition, start hidden and reveal smoothly.
  try {
    if (sessionStorage.getItem(navFlag) === "1") {
      root.classList.add("is-nav-loading");
      sessionStorage.removeItem(navFlag);
    }
  } catch {
    // Ignore storage access failures in restricted browser modes.
  }

  const reveal = () => {
    // Let the browser paint once, then animate in to avoid flash between pages.
    globalThis.requestAnimationFrame(() => {
      root.classList.remove("is-nav-loading");
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", reveal, { once: true });
  } else {
    reveal();
  }

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

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const anchor = target.closest("a[href]");
    if (!(anchor instanceof HTMLAnchorElement)) return;
    if (!shouldHandle(anchor, event)) return;

    event.preventDefault();

    try {
      sessionStorage.setItem(navFlag, "1");
    } catch {
      // Ignore storage access failures in restricted browser modes.
    }

    root.classList.add("is-nav-exiting");

    // Keep the delay short to preserve responsiveness while allowing fade-out.
    globalThis.setTimeout(() => {
      globalThis.location.href = anchor.href;
    }, 165);
  });
})();
