---
title: HyTrack API
summary: A secure FastAPI service that scrapes and serves shipment tracking status for multiple couriers.
role: Engineering Student
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

## Overview
HyTrack API is a secure, high-performance REST API built with FastAPI to actively scrape and track shipment status for Blue Dart and Delhivery. It is designed as a standalone microservice with local API key management, rate limiting, and hardened auth handling.

## Architecture and Scraping Strategy
- Blue Dart: maps to hidden tracking endpoints and parses HTML responses via BeautifulSoup.
- Delhivery: uses headless Selenium to handle JavaScript-rendered tracking pages.
- Hardware-aware operation: uses concurrency controls to avoid browser overload on Raspberry Pi hardware.

## Security Features
- Bcrypt hashing for generated client keys.
- Constant-time master key comparison to reduce timing-attack surface.
- Rate limiting with slowapi to protect from abusive traffic.
- Strict validation bounds for query parameters to reduce injection risks.

## API Usage
- Endpoint: `GET /track`
- Required header: `X-API-Key: <client-key>`
- Query params:
  - `courier`: `BLUEDART` or `DELHIVERY`
  - `waybill`: alphanumeric tracking ID up to configured bounds

## Public Endpoint
- https://assa.hyclotron.com
