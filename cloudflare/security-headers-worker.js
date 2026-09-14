// Cloudflare Worker: adds security response headers to coolstuffforme.net,
// and serves a same-origin JSON API (/api/analytics) backing the
// analytics.html dashboard, sourced from Cloudflare's Web Analytics
// (RUM) GraphQL data. GitHub Pages (the origin) can't set custom headers
// or run server code, so this runs in front of it.
//
// Deployed via Cloudflare Workers Builds from this repo's wrangler.toml.
// Routes coolstuffforme.net/* and www.coolstuffforme.net/* are configured
// in the Cloudflare dashboard (Settings -> Domains & Routes).
//
// One-time analytics dashboard setup:
//   1. Cloudflare dashboard -> My Profile -> API Tokens -> create a token
//      with "Account Analytics: Read" permission on the account that owns
//      coolstuffforme.net.
//   2. wrangler secret put CF_API_TOKEN     (paste the token from step 1)
//   3. wrangler secret put DASHBOARD_KEY    (a password only you know; the
//                                             dashboard asks for this before
//                                             it will show any data)
//   4. Set CF_ACCOUNT_TAG below to your Cloudflare account ID (Cloudflare
//      dashboard -> right sidebar of any zone overview page). CF_SITE_TAG
//      is already the Web Analytics beacon token from index.html, so it
//      doesn't need to change.
//   Until CF_API_TOKEN, CF_ACCOUNT_TAG and DASHBOARD_KEY are all set, the
//   API returns 503 and the dashboard shows a "not configured yet" message.

const GRAPHQL_ENDPOINT = 'https://api.cloudflare.com/client/v4/graphql';

// One query, four breakdowns + a daily trend, all scoped to the same
// site/date window so every panel on the dashboard agrees with the others.
const ANALYTICS_QUERY = `
  query WebAnalytics($accountTag: String!, $siteTag: String!, $since: Time!, $until: Time!) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        daily: rumPageloadEventsAdaptiveGroups(
          limit: 90
          filter: { siteTag: $siteTag, datetime_geq: $since, datetime_leq: $until }
          orderBy: [date_ASC]
        ) {
          count
          sum { visits }
          dimensions { date }
        }
        topPaths: rumPageloadEventsAdaptiveGroups(
          limit: 10
          filter: { siteTag: $siteTag, datetime_geq: $since, datetime_leq: $until }
          orderBy: [count_DESC]
        ) {
          count
          dimensions { requestPath }
        }
        topReferers: rumPageloadEventsAdaptiveGroups(
          limit: 10
          filter: { siteTag: $siteTag, datetime_geq: $since, datetime_leq: $until }
          orderBy: [count_DESC]
        ) {
          count
          dimensions { refererHost }
        }
        topCountries: rumPageloadEventsAdaptiveGroups(
          limit: 10
          filter: { siteTag: $siteTag, datetime_geq: $since, datetime_leq: $until }
          orderBy: [count_DESC]
        ) {
          count
          dimensions { countryName }
        }
        byDevice: rumPageloadEventsAdaptiveGroups(
          limit: 10
          filter: { siteTag: $siteTag, datetime_geq: $since, datetime_leq: $until }
          orderBy: [count_DESC]
        ) {
          count
          dimensions { deviceType }
        }
      }
    }
  }
`;

// Manual constant-time string compare: the Workers runtime exposes Web
// Crypto (crypto.subtle) but not Node's crypto.timingSafeEqual.
function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length || a.length === 0) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, no-store' },
  });
}

async function handleAnalyticsApi(request, env) {
  if (!env.CF_API_TOKEN || !env.CF_ACCOUNT_TAG || !env.CF_SITE_TAG || !env.DASHBOARD_KEY) {
    return jsonResponse({ error: 'not_configured', message: 'Analytics API secrets are not set yet.' }, 503);
  }

  const url = new URL(request.url);
  const key = request.headers.get('x-dashboard-key') || url.searchParams.get('key') || '';
  if (!timingSafeEqual(key, env.DASHBOARD_KEY)) {
    return jsonResponse({ error: 'unauthorized' }, 401);
  }

  const days = Math.min(Math.max(parseInt(url.searchParams.get('days') || '7', 10) || 7, 1), 90);
  const until = new Date();
  const since = new Date(until.getTime() - days * 24 * 60 * 60 * 1000);

  let gqlResponse;
  try {
    gqlResponse = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.CF_API_TOKEN}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        query: ANALYTICS_QUERY,
        variables: {
          accountTag: env.CF_ACCOUNT_TAG,
          siteTag: env.CF_SITE_TAG,
          since: since.toISOString(),
          until: until.toISOString(),
        },
      }),
    });
  } catch (err) {
    return jsonResponse({ error: 'upstream_unreachable', message: String(err) }, 502);
  }

  const data = await gqlResponse.json();
  if (!gqlResponse.ok || data.errors) {
    return jsonResponse({ error: 'cloudflare_api_error', details: data.errors || data }, 502);
  }

  const account = data.data && data.data.viewer && data.data.viewer.accounts && data.data.viewer.accounts[0];
  return jsonResponse({
    range: { since: since.toISOString(), until: until.toISOString(), days: days },
    daily: (account && account.daily) || [],
    topPaths: (account && account.topPaths) || [],
    topReferers: (account && account.topReferers) || [],
    topCountries: (account && account.topCountries) || [],
    byDevice: (account && account.byDevice) || [],
  });
}

const CSP = [
  "default-src 'self'",
  // 'unsafe-inline' is required for Cloudflare's own bot-challenge platform
  // (window.__CF$cv$params, injected when Bot Fight Mode is on) — its inline
  // bootstrap script carries per-request tokens, so it can't be hash-pinned.
  "script-src 'self' 'unsafe-inline' https://utteranc.es https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://visitor-badge.laobi.icu https://i.ytimg.com",
  "frame-src https://utteranc.es https://www.youtube.com https://www.youtube-nocookie.com",
  "font-src 'self'",
  "connect-src 'self' https://api.frankfurter.dev https://cloudflareinsights.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join('; ');

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/analytics') {
      return handleAnalyticsApi(request, env);
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
