/**
 * Returns a stable persistence key for the topbar variant being rendered.
 * The plain and shell headers must not share a key, or Astro may preserve
 * the wrong header DOM when navigating between pages with different shells.
 */
export const getTopbarPersistKey = (shell: boolean): string =>
  shell ? "site-topbar-shell" : "site-topbar-plain";
