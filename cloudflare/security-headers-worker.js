// Cloudflare Worker: adds security response headers to coolstuffforme.net,
// and proxies the official Banco de Mexico FIX exchange rate (the rate
// published in the Diario Oficial de la Federacion) at /api/usd-mxn.
// GitHub Pages (the origin) can't set custom headers, so this runs in front of it.
//
// Deploy: Cloudflare dashboard -> Workers & Pages -> Create -> Worker,
// paste this in, deploy, then add routes coolstuffforme.net/* and
// www.coolstuffforme.net/* to this worker (Settings -> Domains & Routes).
//
// Requires a secret env var BANXICO_TOKEN: a free token from
// https://www.banxico.org.mx/SieAPIRest/service/v1/token
// Set it under the Worker's Settings -> Variables and Secrets (encrypted).

const CSP = [
  "default-src 'self'",
  "script-src 'self' https://utteranc.es https://static.cloudflareinsights.com",
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

// SF43718: "Tipo de cambio FIX", the Banxico rate that the DOF publishes
// the following business day for settling foreign-currency obligations.
const BANXICO_SERIES = 'SF43718';

async function handleExchangeRate(env) {
  if (!env.BANXICO_TOKEN) {
    return new Response(JSON.stringify({ error: 'not configured' }), {
      status: 501,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const upstream = `https://www.banxico.org.mx/SieAPIRest/service/v1/series/${BANXICO_SERIES}/datos/oportuno`;
  const upstreamResponse = await fetch(upstream, {
    headers: { 'Bmx-Token': env.BANXICO_TOKEN, Accept: 'application/json' },
  });

  if (!upstreamResponse.ok) {
    const bodyText = await upstreamResponse.text();
    return new Response(JSON.stringify({
      error: 'upstream error',
      status: upstreamResponse.status,
      body: bodyText.slice(0, 500),
    }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const data = await upstreamResponse.json();
  const dato = data && data.bmx && data.bmx.series && data.bmx.series[0] && data.bmx.series[0].datos && data.bmx.series[0].datos[0];
  const rate = dato ? parseFloat(dato.dato) : null;

  if (!rate || Number.isNaN(rate)) {
    return new Response(JSON.stringify({ error: 'no data' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ rate, date: dato.fecha, source: 'Banxico FIX (DOF)' }), {
    headers: {
      'Content-Type': 'application/json',
      // Banxico updates this series once per business day.
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/usd-mxn') {
      return handleExchangeRate(env);
    }

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
