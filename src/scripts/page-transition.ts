import type { TransitionBeforeSwapEvent } from 'astro:transitions/client';

(() => {
  if (globalThis.__persPageTransitionInitialized) {
    return;
  }
  globalThis.__persPageTransitionInitialized = true;

  /**
   * Page Transition coordinates navigation feedback for Astro's ClientRouter so
   * page switches feel like an app rather than a reload:
   *
   * - Documents reached from another page of the site are flagged with
   *   `data-site-nav` on <html> (here for router swaps; full loads, e.g. back
   *   from a standalone project page, are flagged by BaseLayout's inline head
   *   script). CSS uses it to skip the first-load entrance animations and run a
   *   single content transition instead, while the chrome stays perfectly still.
   * - A slim progress bar appears only when a navigation is slow (e.g. a
   *   Worker cold start), so typical swaps never flash a loading state.
   * - Only in-page anchor jumps scroll smoothly (see below).
   */
  const PROGRESS_DELAY_MS = 150;
  let progressTimer = 0;

  const getProgressBar = () => document.getElementById('nav-progress');

  const startProgress = () => {
    globalThis.clearTimeout(progressTimer);
    progressTimer = globalThis.setTimeout(() => {
      getProgressBar()?.setAttribute('data-state', 'loading');
    }, PROGRESS_DELAY_MS);
  };

  const stopProgress = () => {
    globalThis.clearTimeout(progressTimer);
    progressTimer = 0;
    getProgressBar()?.removeAttribute('data-state');
  };

  /**
   * Astro replaces all <html> attributes with the incoming document's during a
   * swap, so the flag must be written onto the new document before it lands.
   */
  const flagClientNavigation = (event: Event) => {
    const { newDocument } = event as TransitionBeforeSwapEvent;
    newDocument.documentElement.dataset.siteNav = '';
  };

  /**
   * Smooth-scroll in-page anchor jumps (e.g. a table of contents) only. A
   * global `scroll-behavior: smooth` also animates the router's scroll
   * restores, so after Back or a reload the page would visibly glide down from
   * the top. The behavior is read when a scroll starts, so clearing it once the
   * jump has begun cannot cut it short.
   */
  const SMOOTH_SCROLL_RESET_MS = 1000;
  const prefersReducedMotion = globalThis.matchMedia(
    '(prefers-reduced-motion: reduce)'
  );

  const smoothScrollAnchorJump = (event: MouseEvent) => {
    if (prefersReducedMotion.matches || !(event.target instanceof Element)) {
      return;
    }
    if (!event.target.closest('a[href^="#"]')) {
      return;
    }

    const root = document.documentElement;
    const reset = () => root.style.removeProperty('scroll-behavior');
    root.style.scrollBehavior = 'smooth';
    globalThis.addEventListener('scrollend', reset, { once: true });
    globalThis.setTimeout(reset, SMOOTH_SCROLL_RESET_MS);
  };

  document.addEventListener('astro:before-preparation', startProgress);
  document.addEventListener('astro:before-swap', flagClientNavigation);
  document.addEventListener('astro:after-swap', stopProgress);
  // Capture phase: must run before the ClientRouter's click handler performs
  // the fragment navigation.
  document.addEventListener('click', smoothScrollAnchorJump, true);

  // A page restored from the back-forward cache may have been frozen mid-load.
  globalThis.addEventListener('pageshow', stopProgress);
})();
