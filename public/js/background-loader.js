(() => {
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

		return globalThis.matchMedia("(prefers-color-scheme: dark)").matches ? "midnight" : "ivory";
	};

	const imageFor = (theme) => backgrounds[theme] ?? backgrounds.ivory;

	const basePathFor = (image) => image.replace(/\.[^.]+$/, "");

	const avifPath = (image) => `${basePathFor(image)}.avif`;

	const webpPath = (image) => `${basePathFor(image)}.webp`;

	const withVersion = (assetPath) => `${assetPath}?v=${backgroundAssetVersion}`;

	const normalizeQuality = (value) => {
		if (value === "tiny" || value === "avif" || value === "webp" || value === "default") {
			return value;
		}

		return null;
	};

	const applySceneQuality = (value) => {
		const normalized = normalizeQuality(value) ?? "default";
		root.dataset.sceneQuality = normalized;
	};

	const readSessionSceneQuality = (theme) => {
		try {
			return normalizeQuality(sessionStorage.getItem(sceneQualityKey(theme)));
		} catch {
			return null;
		}
	};

	const writeSessionSceneQuality = (theme, quality) => {
		try {
			sessionStorage.setItem(sceneQualityKey(theme), quality);
		} catch {
			// Ignore storage write failures and keep runtime behavior functional.
		}
	};

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

				applySceneQuality("default");
				writeSessionSceneQuality(theme, "default");
			};
		};
	};

	const firstTheme = currentTheme();
	const cachedSceneQuality = readSessionSceneQuality(firstTheme);
	if (cachedSceneQuality) {
		applySceneQuality(cachedSceneQuality);
	}

	applyBackground(firstTheme, {
		progressive: true,
		useTinyPlaceholder: !cachedSceneQuality
	});

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
