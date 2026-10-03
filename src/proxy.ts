// VisaCheck middleware — strict CSP with per-request nonce.
//
// Why: Next.js 16 (App Router + RSC) emits inline <script> tags for the RSC payload
// and bootstrap. The Phase 0 spec says "no 'unsafe-inline' in script-src" — that's
// the load-bearing constraint. A nonce-based CSP satisfies both: it lets Next.js's
// own inline scripts run (matched by nonce) while blocking arbitrary inline JS.
//
// The middleware:
//   1. Generates a fresh base64 nonce per request (crypto.randomUUID).
//   2. Sets it on the request as `x-nonce` (Next.js 16 auto-injects nonce={...} into
//      its own inline scripts when this header is present).
//   3. Builds the CSP with `script-src 'self' 'nonce-{value}' https://challenges.cloudflare.com`
//      — no 'unsafe-inline', no new external origins.
//   4. Returns the response with the CSP + all other security headers.

import { NextResponse, type NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID()).replace(/[^a-zA-Z0-9]/g, '').slice(0, 24);

  // Whitelist-only — script-src is 'self' + Turnstile. No 'unsafe-inline'.
  // Next.js 16 inline scripts receive the nonce via the x-nonce header pipeline.
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' https://challenges.cloudflare.com`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com data:`,
    `img-src 'self' data:`,
    `manifest-src 'self'`,
    `connect-src 'self' https://challenges.cloudflare.com`,
    `frame-src 'self' https://challenges.cloudflare.com`,
    `worker-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join('; ');

  // Forward request to app, attaching the nonce so the layout can pick it up.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Apply headers to the response so the browser sees them.
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=()'
  );
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );
  return response;
}

// Match everything except static asset paths. /_next/static, /_next/image, icons,
// screenshots, manifest, and sw.js are served as static files (no middleware needed).
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon|icon-|screenshot-|manifest|sw.js|apple-touch-icon).*)',
  ],
};
