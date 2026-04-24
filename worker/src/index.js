/**
 * usectl agent-readiness Worker
 *
 * Sits in front of the origin (wherever usectl.com is hosted) and:
 *   1. Adds Link response headers to the homepage (RFC 8288)
 *   2. Handles Markdown for Agents (Accept: text/markdown → serves /index.md)
 *   3. Sets correct Content-Type for /.well-known/* files
 *   4. Adds Content-Signal header expressing AI usage preferences
 *
 * Deploy with: wrangler deploy
 * Bind to route: usectl.com/*
 */

const LINK_HEADER = [
  '</.well-known/api-catalog>; rel="api-catalog"',
  '</.well-known/mcp/server-card.json>; rel="mcp-server"',
  '</.well-known/agent-skills/index.json>; rel="agent-skills"',
  '</.well-known/oauth-authorization-server>; rel="authorization_server"',
  '</.well-known/oauth-protected-resource>; rel="oauth-protected-resource"',
  '</.well-known/ucp>; rel="ucp-profile"',
  '</.well-known/acp.json>; rel="acp-discovery"',
  '</llms.txt>; rel="describedby"; type="text/plain"',
  '</llms.txt>; rel="alternate"; type="text/plain"',
  '</index.md>; rel="alternate"; type="text/markdown"',
  '<https://docs.usectl.com>; rel="service-doc"',
  '<https://docs.usectl.com/openapi.yaml>; rel="service-desc"; type="application/openapi+yaml"',
].join(', ');

const CONTENT_SIGNAL = 'search=yes, ai-train=yes, ai-input=yes';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const isHomepage = url.pathname === '/' || url.pathname === '/index.html';

    // 1. Markdown content negotiation on homepage.
    if (isHomepage && request.method === 'GET') {
      const accept = request.headers.get('Accept') || '';
      if (accept.includes('text/markdown')) {
        const mdUrl = new URL(request.url);
        mdUrl.pathname = '/index.md';
        const mdResponse = await fetch(mdUrl.toString(), { cf: { cacheTtl: 3600 } });
        if (mdResponse.ok) {
          return new Response(mdResponse.body, {
            status: 200,
            headers: {
              'Content-Type': 'text/markdown; charset=utf-8',
              'Vary': 'Accept',
              'Cache-Control': 'public, max-age=3600',
              'Access-Control-Allow-Origin': '*',
              'Content-Signal': CONTENT_SIGNAL,
              'Link': LINK_HEADER,
              'X-Markdown-Source': '/index.md',
            },
          });
        }
      }
    }

    // Fetch from origin
    const response = await fetch(request);
    const newHeaders = new Headers(response.headers);

    // 2. Homepage Link headers + Content-Signal + Vary: Accept
    if (isHomepage) {
      newHeaders.set('Link', LINK_HEADER);
      newHeaders.set('Vary', 'Accept');
      newHeaders.set('Content-Signal', CONTENT_SIGNAL);
    }

    // 3. .well-known Content-Types
    if (url.pathname.startsWith('/.well-known/')) {
      newHeaders.set('Access-Control-Allow-Origin', '*');
      if (url.pathname.endsWith('.md')) {
        newHeaders.set('Content-Type', 'text/markdown; charset=utf-8');
      } else if (url.pathname === '/.well-known/http-message-signatures-directory') {
        newHeaders.set('Content-Type', 'application/jwk-set+json');
      } else if (url.pathname === '/.well-known/api-catalog') {
        newHeaders.set('Content-Type', 'application/linkset+json');
      } else {
        // Default everything else under .well-known to JSON (covers mcp/, oauth*, ucp, acp.json, agent-skills/index.json)
        newHeaders.set('Content-Type', 'application/json');
      }
    }

    // 4. llms.txt and index.md Content-Types
    if (url.pathname === '/llms.txt') {
      newHeaders.set('Content-Type', 'text/plain; charset=utf-8');
      newHeaders.set('Access-Control-Allow-Origin', '*');
    }
    if (url.pathname === '/index.md') {
      newHeaders.set('Content-Type', 'text/markdown; charset=utf-8');
      newHeaders.set('Access-Control-Allow-Origin', '*');
    }

    // Always advertise Content-Signal for all pages (not just homepage)
    if (!newHeaders.has('Content-Signal')) {
      newHeaders.set('Content-Signal', CONTENT_SIGNAL);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};
