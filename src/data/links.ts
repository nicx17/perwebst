/**
 * Defines the structure for primary navigation and social links.
 */
export interface HomeLink {
  label: string;
  href: string;
  external?: boolean;
}

/**
 * The collection of links displayed on the homepage.
 */
export const homeLinks: HomeLink[] = [
  { label: "Projects", href: "/projects/" },
  { label: "GitHub", href: "https://github.com/nicx17", external: true },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/nick-cardoso-b9346324a/",
    external: true
  },
  { label: "Unsplash", href: "https://unsplash.com/@nickcardoso", external: true },
  {
    label: "Instagram",
    href: "https://www.instagram.com/nickcardoso14/",
    external: true
  }
];
