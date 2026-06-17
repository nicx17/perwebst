import os
import re
import urllib.request
import urllib.error
import urllib.parse
import hashlib
from pathlib import Path

# Paths
SCRIPT_DIR = Path(__file__).parent.resolve()
PROJECTS_DIR = SCRIPT_DIR.parent / "src" / "content" / "projects"
ASSETS_DIR = SCRIPT_DIR.parent / "public" / "project-assets"

IGNORED_PROJECTS = {"mimick.md", "mimick.mdx"}

def download_asset(url, project_slug):
    if "img.shields.io" in url or "shields.io" in url or "youtube.com" in url or "youtu.be" in url:
        return url
        
    import mimetypes
        
    try:
        project_assets_dir = ASSETS_DIR / project_slug
        project_assets_dir.mkdir(parents=True, exist_ok=True)
        
        parsed_url = urllib.parse.urlparse(url)
        filename = os.path.basename(parsed_url.path)
        if not filename:
            filename = hashlib.md5(url.encode()).hexdigest()[:8]
            
        filename = filename.split("?")[0]
        url_hash = hashlib.md5(url.encode()).hexdigest()[:6]
        
        # We don't know the safe filename until we fetch the content type (if extension is missing)
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            content_type = response.info().get_content_type()
            
            # Check if filename lacks extension
            _, ext = os.path.splitext(filename)
            if not ext:
                ext = mimetypes.guess_extension(content_type)
                if ext:
                    if ext == ".jpe": ext = ".jpg"
                    filename += ext
                else:
                    # fallback
                    filename += ".png"
                    
            safe_filename = f"{url_hash}_{filename}"
            local_path = project_assets_dir / safe_filename
            
            if not local_path.exists():
                with open(local_path, 'wb') as out_file:
                    out_file.write(response.read())
                
        return f"/project-assets/{project_slug}/{safe_filename}"
    except Exception as e:
        print(f"Failed to download asset {url}: {e}")
        return url


def fetch_github_readme(repository_url):
    # Example: https://github.com/nicx17/unstats
    repo_url = repository_url.rstrip("/")
    parts = repo_url.split("/")
    repo_owner = parts[-2]
    repo_name = parts[-1]

    raw_urls = [
        f"https://raw.githubusercontent.com/{repo_owner}/{repo_name}/main/README.md",
        f"https://raw.githubusercontent.com/{repo_owner}/{repo_name}/master/README.md",
    ]

    for url in raw_urls:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req) as response:
                if response.status == 200:
                    return response.read().decode("utf-8")
        except urllib.error.URLError:
            continue

    print(f"Error fetching README for {repo_owner}/{repo_name}")
    return None


def parse_frontmatter(file_content):
    match = re.match(r"^---\n(.*?)\n---", file_content, re.DOTALL)
    if not match:
        return "", file_content, {}

    frontmatter_str = match.group(0)
    body = file_content[len(frontmatter_str) :]

    data = {}
    lines = match.group(1).split("\n")
    current_key = None

    for line in lines:
        if line.startswith("  -"):
            if current_key and isinstance(data.get(current_key), list):
                data[current_key].append(line.replace("  -", "").strip())
        else:
            if ":" in line:
                colon_idx = line.index(":")
                key = line[:colon_idx].strip()
                val = line[colon_idx + 1 :].strip()

                if not val:
                    data[key] = []
                    current_key = key
                else:
                    data[key] = val
                    current_key = key

    return frontmatter_str, body, data


def convert_readme_to_mdx(readme_text, repository_url, project_slug):
    mdx = readme_text

    repo_url = repository_url.rstrip("/")
    parts = repo_url.split("/")
    repo_owner = parts[-2]
    repo_name = parts[-1]
    raw_base = f"https://raw.githubusercontent.com/{repo_owner}/{repo_name}/main/"

    # Rewrite relative markdown images
    # ![alt](relative/path.png)
    def rewrite_md_image(match):
        alt = match.group(1)
        src = match.group(2)
        if (
            not src.startswith("http://")
            and not src.startswith("https://")
            and not src.startswith("data:")
        ):
            # remove leading slash if present
            src = src.lstrip("/")
            src = raw_base + src

        # Enforce for-the-badge style on shields.io badges
        if "shields.io" in src:
            if "style=" in src:
                src = re.sub(r"style=[^&]*", "style=for-the-badge", src)
            else:
                separator = "&" if "?" in src else "?"
                src += f"{separator}style=for-the-badge"
        elif not src.startswith("data:"):
            src = download_asset(src, project_slug)

        return f"![{alt}]({src})"

    mdx = re.sub(r"!\[([^\]]*)\]\(([^)]+)\)", rewrite_md_image, mdx)

    # Rewrite relative HTML img src
    def rewrite_html_image(match):
        pre = match.group(1)
        src = match.group(2)
        post = match.group(3)
        if (
            not src.startswith("http://")
            and not src.startswith("https://")
            and not src.startswith("data:")
        ):
            src = src.lstrip("/")
            src = raw_base + src

        if "shields.io" in src:
            if "style=" in src:
                src = re.sub(r"style=[^&]*", "style=for-the-badge", src)
            else:
                separator = "&" if "?" in src else "?"
                src += f"{separator}style=for-the-badge"
        elif not src.startswith("data:"):
            src = download_asset(src, project_slug)

        return f'{pre}src="{src}"{post}'

    mdx = re.sub(
        r'(<(?:img|video|source)[^>]+)src=["\']([^"\']+)["\']([^>]*>)',
        rewrite_html_image,
        mdx,
        flags=re.IGNORECASE,
    )

    # 1. Remove raw HTML align="center" tags which break MDX easily, or convert them.
    mdx = re.sub(
        r'<div align="center">(.*?)</div>', r"\1", mdx, flags=re.IGNORECASE | re.DOTALL
    )
    mdx = re.sub(
        r'<h1 align="center">(.*?)</h1>',
        r"# \1\n",
        mdx,
        flags=re.IGNORECASE | re.DOTALL,
    )
    mdx = re.sub(
        r'<p align="center">(.*?)</p>', r"\1\n", mdx, flags=re.IGNORECASE | re.DOTALL
    )
    mdx = re.sub(r"<!\-\-.*?\-\->", "", mdx, flags=re.IGNORECASE | re.DOTALL)

    # Fix Shiki syntax highlighting error where 'env' is not a recognized language
    mdx = re.sub(r"```env\b", "```bash", mdx, flags=re.IGNORECASE)

    # Fix void tags for MDX (e.g. <br> to <br />)
    mdx = re.sub(r"<br\s*>", "<br />", mdx, flags=re.IGNORECASE)
    mdx = re.sub(r"<hr\s*>", "<hr />", mdx, flags=re.IGNORECASE)
    # Avoid replacing <img ... /> if it already has />. If it doesn't, add it.
    mdx = re.sub(r"<(img|source)([^>]+[^/])>", r"<\1\2 />", mdx, flags=re.IGNORECASE)

    # Remove redundant project logos from the markdown body to avoid double-logos
    mdx = re.sub(
        r'<img[^>]+alt=["\'][^"\']*(?:logo|icon)[^"\']*["\'][^>]*>',
        "",
        mdx,
        flags=re.IGNORECASE,
    )
    mdx = re.sub(
        r"!\[[^\]]*(?:logo|icon)[^\]]*\]\([^)]+\)", "", mdx, flags=re.IGNORECASE
    )

    # Convert Markdown linked YouTube thumbnails into embedded iframes
    def rewrite_youtube_link(match):
        video_id = match.group(1)
        return f'<iframe width="100%" height="450" src="https://www.youtube-nocookie.com/embed/{video_id}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>'

    mdx = re.sub(
        r"\[!\[.*?\]\(.*?\)\]\(https?://(?:www\.)?(?:youtube\.com/watch\?v=|youtu\.be/)([^&)]+).*\)",
        rewrite_youtube_link,
        mdx,
        flags=re.IGNORECASE,
    )

    # Prevent MDX errors with < followed by = or space
    mdx = re.sub(r"<(?=\s|=)", r"&lt;", mdx)

    # 2. Extract Features list and wrap in <FeatureGrid> if exists
    features_pattern = re.compile(
        r"## (?:Core )?Features\s*\n((?:[-*][ \t]+.*(?:\n[ \t]+.*)*\n*)+)",
        re.IGNORECASE,
    )
    features_match = features_pattern.search(mdx)

    if features_match:
        list_text = features_match.group(1)
        lines = list_text.split("\n")
        items = []
        current_item = []
        for line in lines:
            if not line.strip():
                continue
            if re.match(r"^[-*]\s+", line):
                if current_item:
                    items.append("\n".join(current_item))
                current_item = [line]
            elif current_item:
                current_item.append(line)
        if current_item:
            items.append("\n".join(current_item))

        grid_content = "\n<FeatureGrid>\n"
        for item in items:
            item_lines = item.split("\n")
            first_line = item_lines[0].strip()
            text_first_line = re.sub(r"^[-*]\s+", "", first_line).strip()
            
            title = "Feature"
            bold_match = re.match(r"^\*\*(.*?)\*\*(?:\s*[:-]\s*)?(.*)", text_first_line)
            if bold_match:
                title = bold_match.group(1)
                desc_first_line = bold_match.group(2)
            else:
                words = text_first_line.split(" ")
                title = " ".join(words[:3]) + "..."
                desc_first_line = text_first_line
            
            desc_lines = [desc_first_line] + item_lines[1:]
            text = "\n    ".join(desc_lines).strip()
            
            grid_content += (
                f'  <FeatureItem title="{title}">\n    {text}\n  </FeatureItem>\n'
            )

        grid_content += "</FeatureGrid>\n"

        mdx = mdx.replace(features_match.group(0), f"## Features\n{grid_content}")

    imports = """import FeatureGrid from '../../components/project/FeatureGrid.astro';
import FeatureItem from '../../components/project/FeatureItem.astro';
import ArchitectureSection from '../../components/project/ArchitectureSection.astro';\n\n"""

    return imports + mdx


def sync_projects():
    print("Starting GitHub README sync...")

    if not PROJECTS_DIR.exists():
        print(f"Directory {PROJECTS_DIR} not found.")
        return

    for file_path in PROJECTS_DIR.iterdir():
        if file_path.name in IGNORED_PROJECTS:
            print(f"Skipping ignored project: {file_path.name}")
            continue

        if not file_path.name.endswith(".md") and not file_path.name.endswith(".mdx"):
            continue

        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        frontmatter_str, _, data = parse_frontmatter(content)

        if "repository" not in data:
            print(f"No repository found for {file_path.name}, skipping.")
            continue

        print(f"Fetching README for {data['repository']}...")
        readme_text = fetch_github_readme(data["repository"])

        if readme_text:
            mdx_body = convert_readme_to_mdx(readme_text, data["repository"], file_path.stem)
            new_content = f"{frontmatter_str}\n{mdx_body}"

            mdx_path = PROJECTS_DIR / f"{file_path.stem}.mdx"

            with open(mdx_path, "w", encoding="utf-8") as f:
                f.write(new_content)

            if file_path.name.endswith(".md"):
                file_path.unlink()

            print(f"Successfully synced and enriched {mdx_path.name}")

    print("Sync complete!")


if __name__ == "__main__":
    sync_projects()
