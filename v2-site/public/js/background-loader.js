(() => {
	const root = document.documentElement;
	const backgroundAssetVersion = "20260404hq";
	const sceneKey = (theme) => `bg-scene-${backgroundAssetVersion}-${theme}`;
	let activeLoadToken = 0;

	const backgrounds = {
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

	const tinyPlaceholderPath = (image) => `${basePathFor(image)}.tiny.webp`;

	const avifPath = (image) => `${basePathFor(image)}.avif`;

	const webpPath = (image) => `${basePathFor(image)}.webp`;

	const withVersion = (assetPath) => `${assetPath}?v=${backgroundAssetVersion}`;

	const readSessionScene = (theme) => {
		try {
			return sessionStorage.getItem(sceneKey(theme));
		} catch {
			return null;
		}
	};

	const writeSessionScene = (theme, scene) => {
		try {
			sessionStorage.setItem(sceneKey(theme), scene);
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

		const sceneValue = `url("${withVersion(avifPath(image))}")`;
		if (!progressive) {
			root.style.setProperty("--scene-image", sceneValue);
			writeSessionScene(theme, sceneValue);
			return;
		}

		if (useTinyPlaceholder) {
			const tinyImage = tinyPlaceholderPath(image);
			root.style.setProperty("--scene-image", `url("${withVersion(tinyImage)}")`);
		}

		const loadToken = ++activeLoadToken;
		const loader = new Image();
		loader.decoding = "async";
		loader.src = withVersion(avifPath(image));

		loader.onload = () => {
			if (loadToken !== activeLoadToken) {
				return;
			}

			root.style.setProperty("--scene-image", sceneValue);
			writeSessionScene(theme, sceneValue);
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

				const webpScene = `url("${withVersion(webpPath(image))}")`;
				root.style.setProperty("--scene-image", webpScene);
				writeSessionScene(theme, webpScene);
			};

			webpLoader.onerror = () => {
				if (loadToken !== activeLoadToken) {
					return;
				}

				const fallbackScene = `url("${withVersion(image)}")`;
				root.style.setProperty("--scene-image", fallbackScene);
				writeSessionScene(theme, fallbackScene);
			};
		};
	};

	const firstTheme = currentTheme();
	const cachedScene = readSessionScene(firstTheme);
	if (cachedScene) {
		root.style.setProperty("--scene-image", cachedScene);
	}

	applyBackground(firstTheme, {
		progressive: true,
		useTinyPlaceholder: !cachedScene
	});

	document.addEventListener("themechange", (event) => {
		const theme = event?.detail?.theme;
		if (theme !== "ivory" && theme !== "midnight") {
			return;
		}

		const cached = readSessionScene(theme);
		if (cached) {
			root.style.setProperty("--scene-image", cached);
			applyBackground(theme, { progressive: true, useTinyPlaceholder: false });
			return;
		}

		applyBackground(theme, { progressive: true, useTinyPlaceholder: true });
	});
})();
