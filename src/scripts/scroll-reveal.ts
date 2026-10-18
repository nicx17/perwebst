/**
 * Scroll-driven reveal animation system.
 *
 * Uses IntersectionObserver to animate elements into view as the user scrolls.
 * Elements with [data-reveal] start invisible and transition in when they enter
 * the viewport. Children of [data-reveal-stagger] containers are animated
 * sequentially with configurable delay.
 *
 * Additionally, headings inside .article-content and .project-detail-content
 * are auto-observed for the decorative underline animation (is-revealed class).
 *
 * CSP-safe: no inline handlers, no eval, no dynamic style injection.
 */
(() => {
  if (globalThis.__persScrollRevealInitialized) return;
  globalThis.__persScrollRevealInitialized = true;

  const REVEAL_CLASS = 'is-revealed';
  const ATTR_REVEAL = 'data-reveal';
  const ATTR_STAGGER = 'data-reveal-stagger';
  const ATTR_INSTANT = 'data-reveal-instant';
  const STAGGER_BASE_MS = 65;
  const ROOT_MARGIN = '0px 0px -60px 0px';
  const THRESHOLD = 0.08;

  const prefersReduced = globalThis.matchMedia?.(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  const applyReveal = (el: Element) => {
    el.classList.add(REVEAL_CLASS);
  };

  const isInViewport = (el: Element) => {
    const rect = el.getBoundingClientRect();
    return rect.top < globalThis.innerHeight && rect.bottom > 0;
  };

  /**
   * After a client-side navigation the page transition already animates the
   * incoming content, so anything on screen is shown as-is (CSS drops the
   * transition via ATTR_INSTANT) instead of fading in a second time.
   */
  const revealInstantly = (el: Element) => {
    el.setAttribute(ATTR_INSTANT, '');
    el.classList.add(REVEAL_CLASS);
    if (el.hasAttribute(ATTR_STAGGER)) {
      el.querySelectorAll(`:scope > *`).forEach(applyReveal);
    }
  };

  const applyStaggeredReveal = (container: Element) => {
    const children = container.querySelectorAll(`:scope > *`);
    children.forEach((child, i) => {
      const delay = i * STAGGER_BASE_MS;
      if (child instanceof HTMLElement) {
        child.style.transitionDelay = `${delay}ms`;
      }
      // Use rAF to batch class additions after delay is set
      requestAnimationFrame(() => {
        child.classList.add(REVEAL_CLASS);
      });
    });
  };

  const initReveal = () => {
    const revealEls = document.querySelectorAll(
      `[${ATTR_REVEAL}]:not(.${REVEAL_CLASS})`
    );
    const staggerEls = document.querySelectorAll(
      `[${ATTR_STAGGER}]:not(.${REVEAL_CLASS})`
    );

    // Auto-detect content headings for the underline reveal
    const contentHeadings = document.querySelectorAll(
      `.article-content h2:not(.${REVEAL_CLASS}), .project-detail-content h2:not(.${REVEAL_CLASS})`
    );

    const allEmpty =
      revealEls.length === 0 &&
      staggerEls.length === 0 &&
      contentHeadings.length === 0;

    if (allEmpty) return;

    if (prefersReduced) {
      revealEls.forEach(applyReveal);
      staggerEls.forEach((container) => {
        container.classList.add(REVEAL_CLASS);
        container.querySelectorAll(`:scope > *`).forEach(applyReveal);
      });
      contentHeadings.forEach(applyReveal);
      return;
    }

    const isClientNavigation =
      document.documentElement.hasAttribute('data-client-nav');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const el = entry.target;
          observer.unobserve(el);

          if (el.hasAttribute(ATTR_STAGGER)) {
            el.classList.add(REVEAL_CLASS);
            applyStaggeredReveal(el);
          } else {
            applyReveal(el);
          }
        });
      },
      { rootMargin: ROOT_MARGIN, threshold: THRESHOLD }
    );

    [...revealEls, ...staggerEls, ...contentHeadings].forEach((el) => {
      if (isClientNavigation && isInViewport(el)) {
        revealInstantly(el);
      } else {
        observer.observe(el);
      }
    });
  };

  // Run on initial load and after Astro client-side navigations.
  // `astro:after-swap` fires after scroll restoration but before the new view
  // is revealed, so on-screen elements are settled before anyone sees them.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReveal, { once: true });
  } else {
    initReveal();
  }

  document.addEventListener('astro:after-swap', initReveal);
})();
