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


def analyze_color(source_path: Path) -> dict:
    """Analyzes the image and returns color statistics."""
    try:
        with Image.open(source_path) as img:
            if img.mode != "RGB":
                img = img.convert("RGB")

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

        for entry in directory_path.iterdir():
            if not entry.is_file() or not is_source_image(entry.name):
                continue

            total_generated += ensure_optimized(entry)

            # Analyze color for all source images and build dictionary
            base_name = entry.stem
            color_data = analyze_color(entry)
            colors[base_name] = color_data

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
