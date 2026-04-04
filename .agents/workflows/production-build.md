---
description: typecheck and build the site for production
---

## Steps

// turbo
1. Run typecheck.

```bash
cd /home/nick/Documents/Github/pers
npm run check
```

Expected: zero errors.

// turbo
2. Build the production bundle.

```bash
cd /home/nick/Documents/Github/pers
npm run build
```

Expected: `dist/` is populated with no build errors.

3. Optionally preview the production output locally.

```bash
cd /home/nick/Documents/Github/pers
npm run preview -- --host 0.0.0.0 --port 4173
```

Open `http://localhost:4173/`.
