/**
 * Determines whether a nav item should be considered active for a pathname.
 */
export const isActiveRoute = (href: string, pathname: string): boolean => {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(href);
};
