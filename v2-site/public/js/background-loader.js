(() => {
	const root = document.documentElement;
	const sceneKey = (theme) => `bg-scene-${theme}`;
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

	const webpPath = (image) => `${basePathFor(image)}.webp`;

	const imageSetFor = (image) => {
		const basePath = basePathFor(image);
		const mimeType = image.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
		return `image-set(url("${basePath}.avif") type("image/avif"), url("${basePath}.webp") type("image/webp"), url("${image}") type("${mimeType}"))`;
	};

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

		const sceneValue = imageSetFor(image);
		if (!progressive) {
			root.style.setProperty("--scene-image", sceneValue);
			writeSessionScene(theme, sceneValue);
			return;
		}

		if (useTinyPlaceholder) {
			const tinyImage = tinyPlaceholderPath(image);
			root.style.setProperty("--scene-image", `url("${tinyImage}")`);
		}

		const loadToken = ++activeLoadToken;
		const loader = new Image();
		loader.decoding = "async";
		loader.src = webpPath(image);

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

			const fallbackScene = `url("${image}")`;
			root.style.setProperty("--scene-image", fallbackScene);
			writeSessionScene(theme, fallbackScene);
		};
	};

	const primeThemeImage = (theme) => {
		const image = imageFor(theme);
		if (!image) {
			return;
		}

		const preload = new Image();
		preload.decoding = "async";
		preload.src = webpPath(image);
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

	const otherTheme = firstTheme === "ivory" ? "midnight" : "ivory";
	if (typeof globalThis.requestIdleCallback === "function") {
		globalThis.requestIdleCallback(() => primeThemeImage(otherTheme), { timeout: 1200 });
	} else {
		globalThis.setTimeout(() => primeThemeImage(otherTheme), 500);
	}

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
