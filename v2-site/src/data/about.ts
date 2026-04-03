export const stackCards = [
  {
    title: "Edge and Routing",
    body: "Cloudflare handles DNS and edge caching. Inbound traffic is routed through Caddy with HTTPS and HTTP/3 support."
  },
  {
    title: "Origin",
    body: "Static and SSR output are served from a Raspberry Pi 5 origin with reverse proxy hardening and strict headers."
  }
];

export const hardware = [
  ["Machine", "Raspberry Pi 5"],
  ["Architecture", "64-bit ARM Cortex-A76 (Quad-core @ 2.4GHz)"],
  ["Memory", "8GB LPDDR4X + 8GB Swap"],
  ["Storage", "500GB NVMe SSD"],
  ["Operating System", "Debian / Raspberry Pi OS"]
] as const;

export const optimizationNotes = [
  ["Rendering", "Astro SSR with content-first pages and minimal client JavaScript."],
  ["Typography", "System font stack to reduce layout shift and external fetches."],
  ["Compression", "zstd/gzip compression and immutable static asset caching."],
  ["Security", "CSP, HSTS, strict headers, and typed validation at app boundaries."]
] as const;
