(() => {
	const root = document.documentElement;

	const backgrounds = {
		ivory: [

			"/backgrounds/light/eve-jCBLFtjpXfw-unsplash.jpg",
			"/backgrounds/light/eve-lP_4h4oVO1E-unsplash.jpg"
		],
		midnight: [
			"/backgrounds/dark/jan-kopriva-L-bVMhRb5cs-unsplash.jpg",
			"/backgrounds/dark/mohammed-kara-LpYWTqT4Ff0-unsplash.jpg"
		]
	};

	const storageKey = (theme) => `bg-rotation-${theme}`;
	const sessionKey = (theme) => `bg-session-${theme}`;
	const sceneKey = (theme) => `bg-scene-${theme}`;
	let activeLoadToken = 0;

	const currentTheme = () => {
		if (root.dataset.theme === "ivory" || root.dataset.theme === "midnight") {
			return root.dataset.theme;
		}

		return globalThis.matchMedia("(prefers-color-scheme: dark)").matches ? "midnight" : "ivory";
	};

	const listFor = (theme) => backgrounds[theme] ?? backgrounds.ivory;

	const basePathFor = (image) => image.replace(/\.[^.]+$/, "");

	const tinyPlaceholderPath = (image) => `${basePathFor(image)}.tiny.webp`;

	const webpPath = (image) => `${basePathFor(image)}.webp`;

	const imageSetFor = (image) => {
		const basePath = basePathFor(image);
		const mimeType = image.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
		return `image-set(url("${basePath}.avif") type("image/avif"), url("${basePath}.webp") type("image/webp"), url("${image}") type("${mimeType}"))`;
	};

	const readIndex = (theme) => {
		try {
			const parsed = Number(localStorage.getItem(storageKey(theme)));
			return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
		} catch {
			return 0;
		}
	};

	const advanceIndex = (theme) => {
		const list = listFor(theme);
		if (list.length === 0) {
			return 0;
		}

		try {
			const parsed = Number(localStorage.getItem(storageKey(theme)));
			const next = Number.isInteger(parsed) && parsed >= 0 ? (parsed + 1) % list.length : 0;
			localStorage.setItem(storageKey(theme), String(next));
			return next;
		} catch {
			return 0;
		}
	};

	const readSessionIndex = (theme) => {
		try {
			const parsed = Number(sessionStorage.getItem(sessionKey(theme)));
			return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
		} catch {
			return null;
		}
	};

	const writeSessionIndex = (theme, index) => {
		try {
			sessionStorage.setItem(sessionKey(theme), String(index));
		} catch {
			// Ignore storage write failures and keep runtime behavior functional.
		}
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

	const applyBackground = (theme, index, options = {}) => {
		const { progressive = true } = options;
		const list = listFor(theme);
		const image = list[index % list.length] ?? list[0];
		if (!image) {
			return;
		}

		const sceneValue = imageSetFor(image);
		if (!progressive) {
			root.style.setProperty("--scene-image", sceneValue);
			writeSessionScene(theme, sceneValue);
			return;
		}

		writeSessionScene(theme, sceneValue);

		const tinyImage = tinyPlaceholderPath(image);
		root.style.setProperty("--scene-image", `url("${tinyImage}")`);

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

	const firstTheme = currentTheme();
	const cachedScene = readSessionScene(firstTheme);
	if (cachedScene) {
		root.style.setProperty("--scene-image", cachedScene);
	}
	const sessionIndex = readSessionIndex(firstTheme);
	if (sessionIndex === null) {
		const nextIndex = advanceIndex(firstTheme);
		writeSessionIndex(firstTheme, nextIndex);
		applyBackground(firstTheme, nextIndex, { progressive: !cachedScene });
	} else {
		applyBackground(firstTheme, sessionIndex, { progressive: false });
	}

	document.addEventListener("themechange", (event) => {
		const theme = event?.detail?.theme;
		if (theme !== "ivory" && theme !== "midnight") {
			return;
		}

		const storedInSession = readSessionIndex(theme);
		if (storedInSession !== null) {
			applyBackground(theme, storedInSession, { progressive: false });
			return;
		}

		const persistedIndex = readIndex(theme);
		writeSessionIndex(theme, persistedIndex);
		applyBackground(theme, persistedIndex, { progressive: false });
	});
})();
