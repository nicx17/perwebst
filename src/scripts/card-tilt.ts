/**
 * 3D perspective tilt effect for project cards.
 *
 * Tracks mouse position within [data-card-tilt] elements and applies
 * subtle rotateX/rotateY transforms to create a parallax depth effect.
 * Desktop-only (no touch), respects prefers-reduced-motion.
 *
 * CSP-safe: no inline handlers, no eval.
 */
(() => {
  if (globalThis.__persCardTiltInitialized) return;
  globalThis.__persCardTiltInitialized = true;

  const MAX_ROTATION = 2.5; // degrees
  const RESET_DURATION = 400; // ms for smooth reset

  const prefersReduced = globalThis.matchMedia?.(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const isTouchDevice = () =>
    "ontouchstart" in globalThis || navigator.maxTouchPoints > 0;

  const initTilt = () => {
    if (prefersReduced || isTouchDevice()) return;

    const cards = document.querySelectorAll<HTMLElement>("[data-card-tilt]");

    cards.forEach((card) => {
      // Skip if already initialized
      if (card.dataset.tiltBound) return;
      card.dataset.tiltBound = "1";

      card.addEventListener("mousemove", (e: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        // Map 0-1 range to -MAX to +MAX degrees
        const rotateY = (x - 0.5) * MAX_ROTATION * 2;
        const rotateX = (0.5 - y) * MAX_ROTATION * 2;

        card.style.transform = `perspective(800px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px) scale(1.008)`;
        card.style.transition = "transform 80ms ease-out";
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "";
        card.style.transition = `transform ${RESET_DURATION}ms cubic-bezier(0.22, 0.61, 0.36, 1)`;
      });
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTilt, { once: true });
  } else {
    initTilt();
  }

  document.addEventListener("astro:page-load", initTilt);
})();
