# Deployment

Runtime: Astro 5 SSR via `@astrojs/node` standalone adapter, managed by PM2.

## Prerequisites

- Node.js 24 LTS
- PM2 installed globally (`npm install -g pm2`)
- `.env` present at repo root (copy from `.env.example`)

## Environment Variables

Copy and edit:

```bash
cp .env.example .env
```

| Variable | Purpose | Example |
|---|---|---|
| `HOST` | Interface the Node server binds to | `127.0.0.1` |
| `PORT` | Port the Node server listens on | `4393` |
| `ORIGIN` | Canonical site URL — used for canonical URLs, sitemap generation, and CSP report endpoint in production | `https://link.nickcardoso.com` |
| `NODE_ENV` | Node environment | `production` |

`HOST` should stay `127.0.0.1` unless you are terminating TLS directly on Node (not recommended — use a reverse proxy).

In production, startup now fails fast when `ORIGIN`, `HOST`, `PORT`, or `NODE_ENV` is invalid.

## First Deploy

```bash
# 1. Install dependencies
npm ci

# 2. Build
npm run build

# 3. Create log directory
mkdir -p logs

# 4. Start with PM2
pm2 start ecosystem.config.cjs

# 5. Save PM2 process list so it survives reboots
pm2 save

# 6. Register PM2 startup hook (run the printed command as root)
pm2 startup
```

## Updating

```bash
# Pull latest, rebuild, reload with zero downtime
git pull
npm ci
npm run build
pm2 reload pers
```

## Useful PM2 Commands

| Command | Purpose |
|---|---|
| `pm2 status` | Show process status |
| `pm2 logs pers` | Tail live logs |
| `pm2 logs pers --lines 100` | Show last 100 log lines |
| `pm2 restart pers` | Hard restart |
| `pm2 reload pers` | Zero-downtime reload |
| `pm2 stop pers` | Stop the process |
| `pm2 delete pers` | Remove from PM2 |

## Smoke Checks (After Deploy)

```bash
# HTTP response and protocol
curl -sI https://link.nickcardoso.com/ | head -5
curl -I --http2 https://link.nickcardoso.com/

# Security headers
curl -sI https://link.nickcardoso.com/ | grep -Ei 'strict-transport-security|content-security-policy|x-content-type-options|x-frame-options'

# Direct local check (bypasses Cloudflare)
curl -sI http://127.0.0.1:4393/
```

## Rollback

```bash
# If a bad deploy is caught: restore previous build from git and rebuild
git checkout <previous-commit>
npm ci
npm run build
pm2 reload pers
```

## Log Locations

| File | Contents |
|---|---|
| `logs/out.log` | Standard output |
| `logs/error.log` | Stderr and crash output |
