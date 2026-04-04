---
description: run lychee link checker across html and markdown files
---

## Steps

// turbo
1. Run link checker using the repo config.

```bash
cd /home/nick/Documents/Github/pers
lychee --config lychee.toml '**/*.html' '**/*.md' --exclude-path node_modules --exclude-path dist
```

Expected: zero broken links. Any failures will be listed with their source file and the dead URL.

2. If failures appear, check `lychee.toml` — known false-positive domains (Instagram, LinkedIn, Unsplash) are already excluded from checks.
