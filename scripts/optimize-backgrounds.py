#!/usr/bin/env python3
"""
Background Optimization Script
Processes raw background images into various optimized formats and sizes:
- WebP: High compatibility, good compression.
- AVIF: Modern format, superior compression and quality.
- Tiny WebP: Extremely small placeholders for progressive loading.
Also generates background-colors.json with color statistics.
"""

import json
import os
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Pillow is required. Install with: pip install Pillow", file=sys.stderr)
    sys.exit(1)

project_root = Path.cwd()
backgrounds_root = project_root / "public" / "backgrounds"
theme_directories = ["light", "dark"]
source_extensions = {".jpg", ".jpeg", ".png"}
max_width = 3200
max_height = 2000
force_reencode = os.environ.get("BG_FORCE") == "1"


def is_source_image(file_name: str) -> bool:
    """Determines if a file is a valid source image (ignoring already-optimized 'tiny' derivatives)."""
    lower = file_name.lower()
    ext = Path(lower).suffix
    if ext not in source_extensions:
        return False

    if lower.endswith((".tiny.jpg", ".tiny.jpeg", ".tiny.png")):
        return False

    return True


def output_paths_for(source_path: Path) -> dict:
    """Generates output filesystem paths for each derivative format."""
    base = source_path.with_suffix("")
    return {
        "webp": base.with_name(f"{base.name}.webp"),
        "avif": base.with_name(f"{base.name}.avif"),
        "tiny_webp": base.with_name(f"{base.name}.tiny.webp"),
    }


def derivative_base_name(file_name: str) -> str | None:
    """Returns the source base name a derivative was generated from, or None if it isn't one."""
    for suffix in (".tiny.webp", ".webp", ".avif"):
        if file_name.lower().endswith(suffix):
            return file_name[: -len(suffix)]
    return None


def prune_orphans(directory_path: Path, source_names: set) -> int:
    """Deletes derivatives whose source image was removed, so a deleted background disappears everywhere."""
    removed = 0
    for entry in directory_path.iterdir():
        base_name = derivative_base_name(entry.name)
        if entry.is_file() and base_name is not None and base_name not in source_names:
            entry.unlink()
            print(f"Removed orphaned {entry.relative_to(project_root)}")
            removed += 1
    return removed


def is_outdated(source_path: Path, output_path: Path) -> bool:
    """Checks if an output file is missing or older than the source file."""
    try:
        source_mtime = source_path.stat().st_mtime
        output_mtime = output_path.stat().st_mtime
        return output_mtime < source_mtime
    except FileNotFoundError:
        return True


def save_webp(img: Image.Image, output_path: Path) -> None:
    """Saves image in WebP format with high quality."""
    img.save(output_path, format="WEBP", quality=72, method=6)


def save_avif(img: Image.Image, output_path: Path) -> None:
    """Saves image in AVIF format, falling back gracefully if advanced parameters aren't supported."""
    try:
        img.save(output_path, format="AVIF", quality=48, speed=6)
    except (ValueError, TypeError, OSError):
        try:
            img.save(output_path, format="AVIF", quality=48)
        except Exception as inner_e:
            raise RuntimeError(
                f"Failed to save AVIF. Ensure pillow-heif or a suitable AVIF plugin is installed. Error: {inner_e}"
            ) from inner_e


def save_tiny_webp(img: Image.Image, output_path: Path) -> None:
    """Saves an extremely small thumbnail for progressive loading."""
    tiny_img = img.copy()
    tiny_img.thumbnail((72, tiny_img.height), Image.Resampling.LANCZOS)
    tiny_img.save(output_path, format="WEBP", quality=36, method=5)


def to_hex(rgb) -> str:
    return "#" + "".join(f"{max(0, min(255, round(c))):02x}" for c in rgb)


def srgb_to_oklab(rgb):
    """sRGB 0-255 to OKLab (Björn Ottosson's matrices)."""
    lin = [
        (c / 255) / 12.92 if c / 255 <= 0.04045 else (((c / 255) + 0.055) / 1.055) ** 2.4
        for c in rgb
    ]
    l = 0.4122214708 * lin[0] + 0.5363325363 * lin[1] + 0.0514459929 * lin[2]
    m = 0.2119034982 * lin[0] + 0.6806995451 * lin[1] + 0.1073969566 * lin[2]
    s = 0.0883024619 * lin[0] + 0.2817188376 * lin[1] + 0.6299787005 * lin[2]
    l, m, s = (v ** (1 / 3) for v in (l, m, s))
    return (
        0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
        1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
        0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
    )


def oklab_to_srgb(lab):
    L, a, b = lab
    l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
    m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
    s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3
    lin = (
        4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
    )
    return tuple(
        255 * (12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055)
        for c in (max(0.0, min(1.0, v)) for v in lin)
    )


def relative_luminance(rgb) -> float:
    """WCAG 2 relative luminance of an sRGB 0-255 color."""
    lin = [
        (c / 255) / 12.92 if c / 255 <= 0.04045 else (((c / 255) + 0.055) / 1.055) ** 2.4
        for c in rgb
    ]
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]


def kmeans(points, k: int, iterations: int = 12):
    """Small deterministic k-means (k-means++ seeding with a fixed seed)."""
    import random

    rng = random.Random(0)
    centers = [points[rng.randrange(len(points))]]
    while len(centers) < k:
        dists = [min(sum((p[i] - c[i]) ** 2 for i in range(3)) for c in centers) for p in points]
        total = sum(dists) or 1
        pick, acc = rng.random() * total, 0.0
        for p, d in zip(points, dists):
            acc += d
            if acc >= pick:
                centers.append(p)
                break
    for _ in range(iterations):
        groups = [[] for _ in centers]
        for p in points:
            nearest = min(range(len(centers)), key=lambda j: sum((p[i] - centers[j][i]) ** 2 for i in range(3)))
            groups[nearest].append(p)
        centers = [
            tuple(sum(p[i] for p in g) / len(g) for i in range(3)) if g else centers[j]
            for j, g in enumerate(groups)
        ]
    return [(c, len(g) / len(points)) for c, g in zip(centers, groups) if g]


def analyze_scene(img: Image.Image) -> dict:
    """
    Colors the site palette is derived from (see src/utils/scene-palette.ts):
    - accent / accentAlt: the most prominent vivid hues (k-means in OKLab,
      ranked by chroma x sqrt(area)), for highlights and ambient glows.
    - shade: the mean of the darkest 3% of a blurred thumbnail, the worst case
      that text over glass or the photo has to stay readable against.
    """
    thumb = img.resize((64, 40), resample=Image.Resampling.BOX)
    labs = [srgb_to_oklab(px) for px in thumb.get_flattened_data()]
    clusters = kmeans(labs, 6)

    def chroma(lab):
        return (lab[1] ** 2 + lab[2] ** 2) ** 0.5

    def hue(lab):
        import math

        return math.degrees(math.atan2(lab[2], lab[1])) % 360

    ranked = sorted(clusters, key=lambda cw: chroma(cw[0]) * cw[1] ** 0.5, reverse=True)
    accent = ranked[0][0]
    alt = next(
        (
            c
            for c, _ in ranked[1:]
            if chroma(c) > 0.03 and min(abs(hue(c) - hue(accent)), 360 - abs(hue(c) - hue(accent))) >= 35
        ),
        None,
    )

    blurred = img.resize((96, 60), resample=Image.Resampling.BOX)
    pixels = sorted(blurred.get_flattened_data(), key=relative_luminance)
    darkest = pixels[: max(1, len(pixels) * 3 // 100)]
    shade = tuple(sum(p[i] for p in darkest) / len(darkest) for i in range(3))

    return {
        "accent": to_hex(oklab_to_srgb(accent)),
        "accentAlt": to_hex(oklab_to_srgb(alt)) if alt else None,
        "shade": to_hex(shade),
    }


def analyze_color(source_path: Path) -> dict:
    """Analyzes the image and returns color statistics."""
    try:
        with Image.open(source_path) as img:
            if img.mode != "RGB":
                img = img.convert("RGB")
            scene = analyze_scene(img)

            avg_img = img.resize((1, 1), resample=Image.Resampling.BOX)
            avg_color = avg_img.getpixel((0, 0))
            avg_hex = f"#{avg_color[0]:02x}{avg_color[1]:02x}{avg_color[2]:02x}"

            small_img = img.copy()
            small_img.thumbnail((150, 150))
            colors = small_img.getcolors(maxcolors=25000)
            if colors:
                colors.sort(key=lambda x: x[0], reverse=True)
                dom_color = colors[0][1]
            else:
                dom_color = avg_color

            if isinstance(dom_color, int):
                dom_color = (dom_color, dom_color, dom_color)

            dom_hex = f"#{dom_color[0]:02x}{dom_color[1]:02x}{dom_color[2]:02x}"

            luminance = (
                0.299 * avg_color[0] + 0.587 * avg_color[1] + 0.114 * avg_color[2]
            )
            is_dark = luminance < 128

            return {
                "dominant": dom_hex,
                "average": avg_hex,
                "luminance": round(luminance, 3),
                "isDark": is_dark,
                **scene,
            }
    except Exception as e:
        print(
            f"Warning: Could not analyze color for {source_path}: {e}", file=sys.stderr
        )
        return {
            "dominant": "#000000",
            "average": "#000000",
            "luminance": 0,
            "isDark": True,
        }


def ensure_optimized(source_path: Path) -> int:
    """
    Orchestrates the optimization of a single source image.
    Uses incremental checks to skip processing if files are already up-to-date.
    """
    outputs = output_paths_for(source_path)

    needs_webp = force_reencode or is_outdated(source_path, outputs["webp"])
    needs_avif = force_reencode or is_outdated(source_path, outputs["avif"])
    needs_tiny = force_reencode or is_outdated(source_path, outputs["tiny_webp"])

    if not needs_webp and not needs_avif and not needs_tiny:
        return 0

    wrote = 0
    try:
        with Image.open(source_path) as img:
            if img.mode in ("P", "PA"):
                img = img.convert("RGBA")

            if needs_webp or needs_avif:
                base_img = img.copy()
                base_img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)

                if needs_webp:
                    save_webp(base_img, outputs["webp"])
                    wrote += 1

                if needs_avif:
                    save_avif(base_img, outputs["avif"])
                    wrote += 1

            if needs_tiny:
                save_tiny_webp(img, outputs["tiny_webp"])
                wrote += 1

    except Exception as e:
        print(f"Error processing {source_path}: {e}", file=sys.stderr)
        raise

    return wrote


def main():
    """Primary entry point: crawls theme directories and processes all source imagery."""
    total_generated = 0
    colors = {}

    for theme_directory in theme_directories:
        directory_path = backgrounds_root / theme_directory
        if not directory_path.is_dir():
            continue

        source_names = set()
        for entry in directory_path.iterdir():
            if not entry.is_file() or not is_source_image(entry.name):
                continue

            total_generated += ensure_optimized(entry)

            # Analyze color for all source images and build dictionary
            base_name = entry.stem
            source_names.add(base_name)
            color_data = analyze_color(entry)
            colors[base_name] = color_data

        prune_orphans(directory_path, source_names)

    # Write colors data to JSON file
    data_dir = project_root / "src" / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    colors_path = data_dir / "background-colors.json"

    new_colors_json = json.dumps(colors, indent=2, sort_keys=True)
    previous_colors = ""
    if colors_path.exists():
        previous_colors = colors_path.read_text()

    if previous_colors != new_colors_json:
        colors_path.write_text(new_colors_json)
        print(f"Generated src/data/background-colors.json with {len(colors)} entries.")

    if total_generated == 0:
        print("Background optimization is up to date.")
        return

    print(f"Generated {total_generated} optimized background assets.")


if __name__ == "__main__":
    try:
        import pillow_heif  # type: ignore

        pillow_heif.register_avif_opener()
    except ImportError:
        pass  # Fallback to native Pillow if built with AVIF support

    try:
        main()
    except Exception as e:
        print("Background optimization failed.", file=sys.stderr)
        print(e, file=sys.stderr)
        sys.exit(1)
