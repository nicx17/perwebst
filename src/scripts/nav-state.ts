import { isActiveRoute } from "../utils/nav-state";

(() => {
  /**
   * Nav State keeps the persisted topbar in sync with the current route.
   * When Astro preserves the header across swaps, SSR-computed active classes
   * do not automatically update, so we reconcile them on each page load.
   */
  if (globalThis.__persNavStateInitialized) {
    return;
  }
  globalThis.__persNavStateInitialized = true;

  const syncNavState = () => {
    const { pathname } = globalThis.location;
    document.querySelectorAll<HTMLElement>("[data-nav-link]").forEach((link) => {
      const href = link.getAttribute("data-nav-href") || link.getAttribute("href");
      if (!href) {
        return;
      }

      const isActive = isActiveRoute(href, pathname);
      link.classList.toggle("is-active", isActive);

      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", syncNavState, { once: true });
  } else {
    syncNavState();
  }

  document.addEventListener("astro:page-load", syncNavState);
  globalThis.addEventListener("pageshow", syncNavState);
})();
