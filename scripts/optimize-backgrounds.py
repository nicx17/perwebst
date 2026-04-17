#!/usr/bin/env python3
"""
Background Optimization Script
Processes raw background images into various optimized formats and sizes:
- WebP: High compatibility, good compression.
- AVIF: Modern format, superior compression and quality.
- Tiny WebP: Extremely small placeholders for progressive loading.
"""

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
        
    if lower.endswith(".tiny.jpg") or lower.endswith(".tiny.jpeg") or lower.endswith(".tiny.png"):
        return False
        
    return True

def output_paths_for(source_path: Path) -> dict:
    """Generates output filesystem paths for each derivative format."""
    base = source_path.with_suffix('')
    return {
        "webp": base.with_name(f"{base.name}.webp"),
        "avif": base.with_name(f"{base.name}.avif"),
        "tiny_webp": base.with_name(f"{base.name}.tiny.webp")
    }

def is_outdated(source_path: Path, output_path: Path) -> bool:
    """Checks if an output file is missing or older than the source file."""
    try:
        source_mtime = source_path.stat().st_mtime
        output_mtime = output_path.stat().st_mtime
        return output_mtime < source_mtime
    except FileNotFoundError:
        return True

def ensure_optimized(source_path: Path) -> int:
    """
    Orchestrates the optimization of a single source image.
    Uses incremental checks to skip processing if files are already up-to-date.
    """
    outputs = output_paths_for(source_path)
    
    needs_webp = is_outdated(source_path, outputs["webp"])
    needs_avif = is_outdated(source_path, outputs["avif"])
    needs_tiny = is_outdated(source_path, outputs["tiny_webp"])
    
    if not force_reencode and not needs_webp and not needs_avif and not needs_tiny:
        return 0
        
    wrote = 0
    
    try:
        with Image.open(source_path) as img:
            # Convert paletted/grayscale images to RGBA/RGB to avoid issues when saving to WebP/AVIF
            if img.mode in ('P', 'PA'):
                img = img.convert('RGBA')

            if force_reencode or needs_webp or needs_avif:
                base_img = img.copy()
                base_img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
                
                if force_reencode or needs_webp:
                    base_img.save(outputs["webp"], format="WEBP", quality=72, method=6)
                    wrote += 1
                    
                if force_reencode or needs_avif:
                    try:
                        # `speed` kwarg might be supported depending on AVIF plugin
                        base_img.save(outputs["avif"], format="AVIF", quality=48, speed=6)
                    except (ValueError, TypeError, OSError):
                        try:
                            # Fallback without speed parameter
                            base_img.save(outputs["avif"], format="AVIF", quality=48)
                        except Exception as inner_e:
                            raise RuntimeError(f"Failed to save AVIF. Ensure pillow-heif or a suitable AVIF plugin is installed. Error: {inner_e}") from inner_e
                    wrote += 1
                    
            if force_reencode or needs_tiny:
                tiny_img = img.copy()
                tiny_img.thumbnail((72, tiny_img.height), Image.Resampling.LANCZOS)
                tiny_img.save(outputs["tiny_webp"], format="WEBP", quality=36, method=5)
                wrote += 1
                
    except Exception as e:
        print(f"Error processing {source_path}: {e}", file=sys.stderr)
        raise

    return wrote

def main():
    """Primary entry point: crawls theme directories and processes all source imagery."""
    total_generated = 0
    
    for theme_directory in theme_directories:
        directory_path = backgrounds_root / theme_directory
        if not directory_path.is_dir():
            continue
            
        for entry in directory_path.iterdir():
            if not entry.is_file() or not is_source_image(entry.name):
                continue
                
            total_generated += ensure_optimized(entry)
            
    if total_generated == 0:
        print("Background optimization is up to date.")
        return
        
    print(f"Generated {total_generated} optimized background assets.")

if __name__ == "__main__":
    try:
        import pillow_heif
        pillow_heif.register_avif_opener()
    except ImportError:
        pass # Fallback to native Pillow if built with AVIF support

    try:
        main()
    except Exception as e:
        print("Background optimization failed.", file=sys.stderr)
        print(e, file=sys.stderr)
        sys.exit(1)
