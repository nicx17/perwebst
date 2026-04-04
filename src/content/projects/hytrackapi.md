---
title: HyTrack API
summary: Hardened FastAPI microservice for courier status scraping with key management, rate limiting, and edge-ready deployment.
repository: https://github.com/nicx17/hytrackapi
repositoryLabel: nicx17/hytrackapi
canonicalPath: /projects/hytrackapi/
tags:
  - FastAPI
  - Python
  - SQLite
  - Bcrypt
order: 5
featured: true
liveUrl: https://assa.hyclotron.com/
---

## Product Snapshot
HyTrack API is the service-layer evolution of the HyTrack ecosystem: a FastAPI microservice that exposes courier tracking through a single normalized contract. It is built for direct app/API consumption, rather than inbox-driven workflows.

## Problem and Scope
Scraping courier portals directly from each client quickly becomes fragile and repetitive. HyTrack API centralizes that complexity behind one service boundary with:

- authenticated API access
- carrier-specific scraping adapters
- consistent response shape for consumers
- basic abuse protection and key lifecycle management

## Service Architecture
The core architecture is intentionally compact:

- HTTP API layer: FastAPI request/response surface
- Auth layer: master key + generated client keys
- Key storage: SQLite-backed issuance/revocation state
- Scraper layer: courier adapters hidden behind shared output model
- Guard rails: rate limits, validation, and concurrency controls

## API Access Model
HyTrack API uses a two-tier key strategy:

1. privileged/master credential for administrative operations
2. generated client API keys for normal tracking requests

Generated keys are hashed before storage, enabling practical key management without storing client credentials in plaintext.

## Courier Adapter Strategy
- Blue Dart: direct endpoint and parse path for static content
- Delhivery: Selenium headless route for dynamic rendered content

This split is the same deliberate performance/compatibility tradeoff used in the broader HyTrack stack.

## Security Controls in Practice
- `bcrypt` hashing for generated client keys
- constant-time comparison for sensitive key checks
- input validation on carrier + waybill parameters
- rate limiting to constrain abuse and scraper load
- reverse-proxy/WAF compatible deployment guidance

## Reliability and Runtime Characteristics
The service is optimized for low-resource deployments while handling mixed scraper workloads. Static carrier requests remain lightweight, while Selenium execution paths are guarded to avoid uncontrolled resource spikes.

## Deployment Profile
The project is designed for edge-friendly hosting (including Raspberry Pi class infrastructure) with straightforward reverse-proxy fronting.

Public endpoint:
https://assa.hyclotron.com/

## Why It Matters
HyTrack API turns scraper-heavy logistics retrieval into an operational backend component with authentication, normalized output, and deployable controls, making it much easier to integrate tracking into apps, bots, and automation systems.
