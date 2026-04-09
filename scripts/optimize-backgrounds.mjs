/**
 * Background Optimization Script
 * Processes raw background images into various optimized formats and sizes:
 * - WebP: High compatibility, good compression.
 * - AVIF: Modern format, superior compression and quality.
 * - Tiny WebP: Extremely small placeholders for progressive loading.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const projectRoot = process.cwd();
const backgroundsRoot = path.join(projectRoot, "public", "backgrounds");
const themeDirectories = ["light", "dark"];
const sourceExtensions = new Set([".jpg", ".jpeg", ".png"]);
const maxWidth = 3200;
const maxHeight = 2000;
const forceReencode = process.env.BG_FORCE === "1";

/** Determines if a file is a valid source image (ignoring already-optimized 'tiny' derivatives). */
const isSourceImage = (fileName) => {
	const lower = fileName.toLowerCase();
	const ext = path.extname(lower);
	if (!sourceExtensions.has(ext)) {
		return false;
	}

	return !lower.endsWith(".tiny.jpg") && !lower.endsWith(".tiny.jpeg") && !lower.endsWith(".tiny.png");
};

/** Generates output filesystem paths for each derivative format. */
const outputPathsFor = (sourcePath) => {
	const ext = path.extname(sourcePath);
	const base = sourcePath.slice(0, -ext.length);
	return {
		webp: `${base}.webp`,
		avif: `${base}.avif`,
		tinyWebp: `${base}.tiny.webp`
	};
};

/** Checks if an output file is missing or older than the source file. */
const isOutdated = async (sourcePath, outputPath) => {
	try {
		const [sourceStat, outputStat] = await Promise.all([fs.stat(sourcePath), fs.stat(outputPath)]);
		return outputStat.mtimeMs < sourceStat.mtimeMs;
	} catch {
		return true;
	}
};

/**
 * Orchestrates the optimization of a single source image.
 * Uses incremental checks to skip processing if files are already up-to-date.
 */
const ensureOptimized = async (sourcePath) => {
	const outputs = outputPathsFor(sourcePath);
	const [needsWebp, needsAvif, needsTiny] = await Promise.all([
		isOutdated(sourcePath, outputs.webp),
		isOutdated(sourcePath, outputs.avif),
		isOutdated(sourcePath, outputs.tinyWebp)
	]);

	if (!forceReencode && !needsWebp && !needsAvif && !needsTiny) {
		return 0;
	}

	const basePipeline = () =>
		sharp(sourcePath).resize({
			width: maxWidth,
			height: maxHeight,
			fit: "inside",
			withoutEnlargement: true
		});

	let wrote = 0;
	if (forceReencode || needsWebp) {
		await basePipeline().webp({ quality: 72, effort: 6 }).toFile(outputs.webp);
		wrote += 1;
	}
	if (forceReencode || needsAvif) {
		await basePipeline().avif({ quality: 48, effort: 6 }).toFile(outputs.avif);
		wrote += 1;
	}
	if (forceReencode || needsTiny) {
		await sharp(sourcePath)
			.resize({ width: 72, withoutEnlargement: true })
			.webp({ quality: 36, effort: 5 })
			.toFile(outputs.tinyWebp);
		wrote += 1;
	}

	return wrote;
};

/** Primary entry point: crawls theme directories and processes all source imagery. */
const main = async () => {
	let totalGenerated = 0;
	for (const themeDirectory of themeDirectories) {
		const directoryPath = path.join(backgroundsRoot, themeDirectory);
		let entries;
		try {
			entries = await fs.readdir(directoryPath, { withFileTypes: true });
		} catch {
			continue;
		}

		for (const entry of entries) {
			if (!entry.isFile() || !isSourceImage(entry.name)) {
				continue;
			}
			const sourcePath = path.join(directoryPath, entry.name);
			totalGenerated += await ensureOptimized(sourcePath);
		}
	}

	if (totalGenerated === 0) {
		console.log("Background optimization is up to date.");
		return;
	}

	console.log(`Generated ${totalGenerated} optimized background assets.`);
};

try {
	await main();
} catch (error) {
	console.error("Background optimization failed.");
	console.error(error);
	process.exitCode = 1;
}
