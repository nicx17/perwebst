/**
 * Tests for src/utils/security-headers.ts, the rules behind both the static
 * `_headers` file and the middleware's on-demand responses.
 */
import { describe, it, expect } from 'vitest';
import {
  CACHE_RULES,
  HEADERS_FILE_MAX_LINE,
  REPORT_PATH,
  buildContentSecurityPolicy,
  buildSecurityHeaders,
  extractInlineScripts,
  findBlockedInlineCode,
  hashInlineScript,
  htmlFileToUrlPath,
  renderHeaderRules,
  validateHeadersFile,
} from '../../src/utils/security-headers';

const REPORT = 'https://nickcardoso.com/api/csp-report/';

const directive = (policy: string, name: string) =>
  policy
    .split('; ')
    .find((d) => d.startsWith(`${name} `))
    ?.slice(name.length + 1);

describe('buildContentSecurityPolicy', () => {
  const policy = buildContentSecurityPolicy({
    reportEndpoint: REPORT,
    scriptHashes: ['sha256-abc=', 'sha256-def='],
  });

  it('allows only same-origin scripts plus the given hashes', () => {
    expect(directive(policy, 'script-src')).toBe(
      "'self' 'sha256-abc=' 'sha256-def='"
    );
  });

  it('never allows inline scripts, nonces or strict-dynamic', () => {
    const scripts = directive(policy, 'script-src') ?? '';
    expect(scripts).not.toContain('unsafe-inline');
    expect(scripts).not.toContain('nonce-');
    expect(scripts).not.toContain('strict-dynamic');
    expect(directive(policy, 'script-src-attr')).toBe("'none'");
  });

  it('locks down framing, plugins and base URLs', () => {
    expect(directive(policy, 'frame-ancestors')).toBe("'none'");
    expect(directive(policy, 'object-src')).toBe("'none'");
    expect(directive(policy, 'base-uri')).toBe("'self'");
  });

  it('keeps the YouTube embeds working', () => {
    expect(directive(policy, 'frame-src')).toContain(
      'https://www.youtube-nocookie.com'
    );
  });

  it('reports to the given endpoint', () => {
    expect(directive(policy, 'report-uri')).toBe(REPORT);
    expect(policy).toContain('report-to csp-endpoint');
  });

  it('allows Google Fonts only when asked', () => {
    expect(policy).not.toContain('fonts.g');
    const withFonts = buildContentSecurityPolicy({
      reportEndpoint: REPORT,
      allowGoogleFonts: true,
    });
    expect(directive(withFonts, 'style-src')).toContain(
      'https://fonts.googleapis.com'
    );
    expect(directive(withFonts, 'font-src')).toContain(
      'https://fonts.gstatic.com'
    );
  });
});

describe('REPORT_PATH', () => {
  it('ends with a slash, so it is not redirected (browsers drop redirected reports)', () => {
    expect(REPORT_PATH.endsWith('/')).toBe(true);
  });
});

describe('buildSecurityHeaders', () => {
  const headers = buildSecurityHeaders(REPORT);

  it('sets the hardening headers', () => {
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['Cross-Origin-Opener-Policy']).toBe('same-origin');
    expect(headers['Strict-Transport-Security']).toContain('preload');
    expect(headers['Permissions-Policy']).toContain('camera=()');
  });

  it('points both reporting headers at the endpoint', () => {
    expect(headers['Reporting-Endpoints']).toBe(`csp-endpoint="${REPORT}"`);
    expect(JSON.parse(headers['Report-To']!)).toMatchObject({
      group: 'csp-endpoint',
      endpoints: [{ url: REPORT }],
    });
  });

  it('leaves CSP and Cache-Control to their own rules (no comma-joined duplicates)', () => {
    expect(headers).not.toHaveProperty('Content-Security-Policy');
    expect(headers).not.toHaveProperty('Cache-Control');
  });
});

describe('CACHE_RULES', () => {
  it('has no duplicate or catch-all patterns', () => {
    const patterns = CACHE_RULES.map(([p]) => p);
    expect(new Set(patterns).size).toBe(patterns.length);
    expect(patterns).not.toContain('/*');
    expect(patterns.some((p) => p.startsWith('/_astro'))).toBe(false);
  });

  it('caches versioned backgrounds longest', () => {
    expect(Object.fromEntries(CACHE_RULES)['/backgrounds/*']).toContain(
      'max-age=2592000'
    );
  });
});

describe('extractInlineScripts', () => {
  it('returns classic, module and importmap inline scripts', () => {
    const html = `
      <script>one()</script>
      <script type="module">two()</script>
      <script type='importmap'>{"imports":{}}</script>
      <SCRIPT type="text/javascript">four()</SCRIPT>`;
    expect(extractInlineScripts(html)).toEqual([
      'one()',
      'two()',
      '{"imports":{}}',
      'four()',
    ]);
  });

  it('skips external scripts and data blocks', () => {
    const html = `
      <script src="/a.js"></script>
      <script type="module" src="/_astro/b.js"></script>
      <script type="application/ld+json">{"@type":"Thing"}</script>
      <script type="application/json" id="cfg">{"a":1}</script>`;
    expect(extractInlineScripts(html)).toEqual([]);
  });
});

describe('findBlockedInlineCode', () => {
  it('finds inline handlers and javascript: URLs in markup', () => {
    const html = `<button onclick="go()">x</button><a href="javascript:void(0)">y</a>`;
    expect(findBlockedInlineCode(html)).toHaveLength(2);
  });

  it('ignores markup built inside scripts and escaped text', () => {
    const html = `<script>el.innerHTML = '<b onclick="x()">';</script><code>&lt;b onclick="x()"&gt;</code>`;
    expect(findBlockedInlineCode(html)).toEqual([]);
  });
});

describe('hashInlineScript', () => {
  it('matches the CSP hash browsers compute (MDN example)', async () => {
    expect(await hashInlineScript("alert('Hello, world.');")).toBe(
      'sha256-qznLcsROx4GACP2dm0UCKCzCG+HiZ1guq6ZZDob/Tng='
    );
  });

  it('normalizes CRLF like the HTML parser does', async () => {
    expect(await hashInlineScript('a();\r\nb();')).toBe(
      await hashInlineScript('a();\nb();')
    );
  });
});

describe('htmlFileToUrlPath', () => {
  it.each([
    ['index.html', '/'],
    ['projects/index.html', '/projects/'],
    ['projects/de-1/bcd-counter/index.html', '/projects/de-1/bcd-counter/'],
    ['404.html', '/404'],
  ])('%s → %s', (file, path) => {
    expect(htmlFileToUrlPath(file)).toBe(path);
  });
});

describe('renderHeaderRules / validateHeadersFile', () => {
  it('renders Cloudflare _headers syntax', () => {
    expect(
      renderHeaderRules([{ pattern: '/a/', headers: { 'X-One': '1' } }])
    ).toBe('/a/\n  X-One: 1\n');
  });

  it('accepts a valid file', () => {
    expect(validateHeadersFile('/a/\n  X-One: 1\n')).toEqual([]);
  });

  it('rejects lines over the limit', () => {
    const long = `/a/\n  X: ${'y'.repeat(HEADERS_FILE_MAX_LINE)}\n`;
    expect(validateHeadersFile(long)).toHaveLength(1);
  });

  it('rejects more than 100 rules and duplicate patterns', () => {
    const many = Array.from({ length: 101 }, (_, i) => `/p${i}/\n  X: 1`).join(
      '\n'
    );
    expect(validateHeadersFile(many)[0]).toContain('101 rules');
    expect(validateHeadersFile('/a/\n  X: 1\n/a/\n  Y: 2')[0]).toContain(
      'appears 2 times'
    );
  });
});
