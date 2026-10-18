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
   * - Documents reached via client-side navigation are flagged with
   *   `data-client-nav` on <html>. CSS uses it to skip the first-load entrance
   *   animations and run a single content transition instead, while the
   *   persisted chrome (topbar, background) stays perfectly still.
   * - A slim progress bar appears only when a navigation is slow (e.g. a
   *   Worker cold start), so typical swaps never flash a loading state.
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
    newDocument.documentElement.dataset.clientNav = '';
  };

  document.addEventListener('astro:before-preparation', startProgress);
  document.addEventListener('astro:before-swap', flagClientNavigation);
  document.addEventListener('astro:after-swap', stopProgress);

  // A page restored from the back-forward cache may have been frozen mid-load.
  globalThis.addEventListener('pageshow', stopProgress);
})();
