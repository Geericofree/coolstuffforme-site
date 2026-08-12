// Cloudflare Worker: adds security response headers to coolstuffforme.net.
// GitHub Pages (the origin) can't set custom headers, so this runs in front of it.
//
// Deploy: Cloudflare dashboard -> Workers & Pages -> Create -> Worker,
// paste this in, deploy, then add routes coolstuffforme.net/* and
// www.coolstuffforme.net/* to this worker (Settings -> Domains & Routes).

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://utteranc.es",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://visitor-badge.laobi.icu",
  "frame-src https://utteranc.es https://www.youtube.com",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join('; ');

export default {
  async fetch(request) {
    const response = await fetch(request);
    const headers = new Headers(response.headers);

    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    headers.set('Content-Security-Policy', CSP);
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('Permissions-Policy', 'geolocation=(), camera=(), microphone=(), payment=(), usb=(), interest-cohort=()');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
