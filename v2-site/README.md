# Personal Website V2 (Astro)

Phase 2 scaffold for typed content model and route template migration.

## Goals
1. Keep URL parity with current site routes.
2. Move project content into typed Astro content collections.
3. Prepare SSR-ready architecture with minimal backend coupling.

## Routes
1. `/`
2. `/about/`
3. `/projects/`
4. `/projects/[slug]/`

## Development
```bash
npm install
npm run dev
```

## Preview First
```bash
npm run dev -- --host 0.0.0.0 --port 4321
```

Production-like preview:
```bash
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
```

## Build
```bash
npm run build
npm run preview
```

## Testing and Deployment Runbook
See:
- `/home/nick/Documents/Github/pers/docs/v2/deployment/v2-site-testing-and-deployment.md`
