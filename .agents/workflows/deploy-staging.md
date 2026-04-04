---
description: build and deploy to the staging service on the Pi
---

## Prerequisites

- SSH access to the Pi host
- `pers-v2` systemd service already created (see `docs/v2/deployment/v2-site-testing-and-deployment.md`)

## Steps

// turbo
1. Typecheck and build.

```bash
cd /home/nick/Documents/Github/pers
npm run check
npm run build
```

Expected: zero errors and a populated `dist/`.

2. Restart the systemd service on the Pi.

```bash
sudo systemctl restart pers-v2
sudo systemctl status pers-v2 --no-pager
```

Expected: service is `active (running)`.

// turbo
3. Run HTTP smoke checks.

```bash
curl -sI https://link.nickcardoso.com/ | head -5
curl -I --http2 https://link.nickcardoso.com/
curl -sI https://link.nickcardoso.com/ | grep -Ei 'strict-transport-security|x-content-type-options|x-frame-options|referrer-policy'
```

Expected: `200 OK`, `HTTP/2`, and security headers present.
