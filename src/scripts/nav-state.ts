import type { TransitionBeforePreparationEvent } from 'astro:transitions/client';
import { isActiveRoute } from '../utils/nav-state';

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

  const syncNavState = (pathname = globalThis.location.pathname) => {
    document
      .querySelectorAll<HTMLElement>('[data-nav-link]')
      .forEach((link) => {
        const href =
          link.getAttribute('data-nav-href') || link.getAttribute('href');
        if (!href) {
          return;
        }

        const isActive = isActiveRoute(href, pathname);
        link.classList.toggle('is-active', isActive);

        if (isActive) {
          link.setAttribute('aria-current', 'page');
        } else {
          link.removeAttribute('aria-current');
        }
      });
  };

  /**
   * Highlight the destination tab as soon as a navigation starts, like a native
   * tab bar, instead of waiting for the next page to arrive. If the navigation
   * is abandoned, the next page load reconciles the state again.
   */
  const syncToDestination = (event: Event) => {
    const { to } = event as TransitionBeforePreparationEvent;
    if (to.origin === globalThis.location.origin) {
      syncNavState(to.pathname);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => syncNavState(), {
      once: true,
    });
  } else {
    syncNavState();
  }

  document.addEventListener('astro:before-preparation', syncToDestination);
  document.addEventListener('astro:page-load', () => syncNavState());
  globalThis.addEventListener('pageshow', () => syncNavState());
})();
