/// <reference types="astro/client" />

import type { SiteTheme } from './types/client';

declare global {
  var __persBackgroundLoaderInitialized: boolean | undefined;
  var __persNavStateInitialized: boolean | undefined;
  var __persPageTransitionInitialized: boolean | undefined;
  var __persThemeToggleInitialized: boolean | undefined;
  var __persScrollRevealInitialized: boolean | undefined;
  var __persCardTiltInitialized: boolean | undefined;

  interface DocumentEventMap {
    themechange: CustomEvent<{ theme: SiteTheme }>;
  }
}

export {};
