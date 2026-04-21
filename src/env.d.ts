/// <reference types="astro/client" />

import type { BackgroundConfig, SiteTheme } from "./types/client";

declare namespace App {
	interface Locals {
		cspNonce?: string;
	}
}

declare global {
	var __BACKGROUND_CONFIG: BackgroundConfig | undefined;
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
