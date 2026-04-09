(() => {
	/**
	 * Background Loader orchestrates the progressive loading of theme-specific imagery.
	 * Strategy:
	 * 1. Initial display uses a 'tiny' 72px placeholder.
	 * 2. Asynchronously attempts to load the 'avif' high-quality version.
	 * 3. Falls back to 'webp' if avif fails or is unsupported.
	 * 4. Falls back to original 'jpg' as the final legacy recovery.
	 */
	const root = document.documentElement;
	const backgroundAssetVersion = "20260404hq";
	const sceneQualityKey = (theme) => `bg-scene-quality-${backgroundAssetVersion}-${theme}`;
	let activeLoadToken = 0;

	const backgrounds = globalThis.__BACKGROUND_CONFIG ?? {
		ivory: "/backgrounds/light/eve-jCBLFtjpXfw-unsplash.jpg",
		midnight: "/backgrounds/dark/jan-kopriva-L-bVMhRb5cs-unsplash.jpg"
	};

	const currentTheme = () => {
		if (root.dataset.theme === "ivory" || root.dataset.theme === "midnight") {
			return root.dataset.theme;
		}

		/** Default to system preference if no dataset theme is explicitly set. */
		return globalThis.matchMedia("(prefers-color-scheme: dark)").matches ? "midnight" : "ivory";
	};

	/** Retrieves the base image path for a given theme. */
	const imageFor = (theme) => backgrounds[theme] ?? backgrounds.ivory;

	/** Removes file extension from a path. */
	const basePathFor = (image) => image.replace(/\.[^.]+$/, "");

	const avifPath = (image) => `${basePathFor(image)}.avif`;

	const webpPath = (image) => `${basePathFor(image)}.webp`;

	/** Appends a cache-busting version query parameter to an asset path. */
	const withVersion = (assetPath) => `${assetPath}?v=${backgroundAssetVersion}`;

	/** Ensures quality values are within the allowed set. */
	const normalizeQuality = (value) => {
		if (value === "tiny" || value === "avif" || value === "webp" || value === "default") {
			return value;
		}

		return null;
	};

	/** Updates the [data-scene-quality] attribute on the root element. */
	const applySceneQuality = (value) => {
		const normalized = normalizeQuality(value) ?? "default";
		root.dataset.sceneQuality = normalized;
	};

	/** Reads the last successful quality level for a theme from sessionStorage. */
	const readSessionSceneQuality = (theme) => {
		try {
			return normalizeQuality(sessionStorage.getItem(sceneQualityKey(theme)));
		} catch {
			return null;
		}
	};

	/** Persists the last successful quality level for a theme to sessionStorage. */
	const writeSessionSceneQuality = (theme, quality) => {
		try {
			sessionStorage.setItem(sceneQualityKey(theme), quality);
		} catch {
			// Ignore storage write failures and keep runtime behavior functional.
		}
	};

	/**
	 * Sequentially attempts to load higher quality background assets.
	 * @param {string} theme - 'ivory' or 'midnight'
	 * @param {object} options - Configuration for loading behavior.
	 */
	const applyBackground = (theme, options = {}) => {
		const { progressive = true, useTinyPlaceholder = true } = options;
		const image = imageFor(theme);
		if (!image) {
			return;
		}

		if (!progressive) {
			applySceneQuality("default");
			writeSessionSceneQuality(theme, "default");
			return;
		}

		if (useTinyPlaceholder) {
			applySceneQuality("tiny");
		}

		/** 
		 * Token validation ensures that if a theme switch happens while an image 
		 * is loading, the stale 'onload' callback doesn't overwrite a newer theme.
		 */
		const loadToken = ++activeLoadToken;
		const loader = new Image();
		loader.decoding = "async";
		loader.src = withVersion(avifPath(image));

		loader.onload = () => {
			if (loadToken !== activeLoadToken) {
				return;
			}

			applySceneQuality("avif");
			writeSessionSceneQuality(theme, "avif");
		};

		loader.onerror = () => {
			if (loadToken !== activeLoadToken) {
				return;
			}

			// AVIF failed/unsupported, fall back to WebP.
			const webpLoader = new Image();
			webpLoader.decoding = "async";
			webpLoader.src = withVersion(webpPath(image));

			webpLoader.onload = () => {
				if (loadToken !== activeLoadToken) {
					return;
				}

				applySceneQuality("webp");
				writeSessionSceneQuality(theme, "webp");
			};

			webpLoader.onerror = () => {
				if (loadToken !== activeLoadToken) {
					return;
				}

				// WebP failed, fall back to the original JPG.
				applySceneQuality("default");
				writeSessionSceneQuality(theme, "default");
			};
		};
	};

	// --- Initialization ---

	const firstTheme = currentTheme();
	const cachedSceneQuality = readSessionSceneQuality(firstTheme);
	if (cachedSceneQuality) {
		applySceneQuality(cachedSceneQuality);
	}

	applyBackground(firstTheme, {
		progressive: true,
		useTinyPlaceholder: !cachedSceneQuality
	});

	/** Listen for custom themechange events to swap the background accordingly. */
	document.addEventListener("themechange", (event) => {
		const theme = event?.detail?.theme;
		if (theme !== "ivory" && theme !== "midnight") {
			return;
		}

		const cachedQuality = readSessionSceneQuality(theme);
		if (cachedQuality) {
			applySceneQuality(cachedQuality);
			applyBackground(theme, { progressive: true, useTinyPlaceholder: false });
			return;
		}

		applyBackground(theme, { progressive: true, useTinyPlaceholder: true });
	});
})();
