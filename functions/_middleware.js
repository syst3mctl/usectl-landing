/**
 * Cloudflare Pages middleware for agent readiness.
 *
 * 1. Markdown for Agents (content negotiation on Accept: text/markdown)
 *    If an AI agent requests the homepage with Accept: text/markdown, serve
 *    /index.md with Content-Type: text/markdown.
 *
 * 2. Link response headers (RFC 8288)
 *    Agents discover resources via Link headers on the homepage. These are
 *    duplicated in _headers and HTML <link> tags, but we set them in the
 *    middleware too so they definitely land on the response.
 *
 * 3. Content-Signal header
 *    Expresses AI usage preferences for the resource.
 */

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  // ── Compressed model serving ─────────────────────────────────────────
  // Cloudflare compresses text/js/wasm on the fly but never .glb
  // (application/octet-stream), so the 3D models — the bulk of the
  // landing's weight — shipped uncompressed. The build produces .glb.gz
  // siblings (tools/compress-models.sh); serve one whenever the client
  // accepts gzip, with encodeBody:'manual' so the runtime passes the
  // pre-compressed bytes through untouched. Meshopt/draco payloads still
  // leave ~35-60% on the table for gzip, so this is real money.
  if (url.pathname.startsWith('/models/') && url.pathname.endsWith('.glb')) {
    const acceptsGzip = /\bgzip\b/.test(request.headers.get('Accept-Encoding') || '');
    const hasRange = request.headers.has('Range');
    if (acceptsGzip && !hasRange && request.method === 'GET') {
      const gzUrl = new URL(url);
      gzUrl.pathname += '.gz';
      const asset = await context.env.ASSETS.fetch(new Request(gzUrl.toString()));
      if (asset.ok) {
        const headers = new Headers({
          'Content-Type': 'model/gltf-binary',
          'Content-Encoding': 'gzip',
          'Vary': 'Accept-Encoding',
          'Cache-Control': 'public, max-age=604800',
        });
        const etag = asset.headers.get('ETag');
        if (etag) headers.set('ETag', etag);
        return new Response(asset.body, { status: 200, headers, encodeBody: 'manual' });
      }
    }
    // no gzip accepted / no sibling built: raw file, but still typed + cacheable
    const raw = await next();
    const rawHeaders = new Headers(raw.headers);
    rawHeaders.set('Content-Type', 'model/gltf-binary');
    if (!rawHeaders.has('Cache-Control')) rawHeaders.set('Cache-Control', 'public, max-age=604800');
    return new Response(raw.body, { status: raw.status, statusText: raw.statusText, headers: rawHeaders });
  }

  // Only handle the root path specially; everything else goes to static serving.
  const isHomepage = url.pathname === '/' || url.pathname === '/index.html';

  if (isHomepage) {
    const accept = request.headers.get('Accept') || '';
    const prefersMarkdown = accept.includes('text/markdown');

    if (prefersMarkdown) {
      // Serve the markdown version of the homepage.
      const mdUrl = new URL(request.url);
      mdUrl.pathname = '/index.md';
      const mdResponse = await fetch(mdUrl.toString(), { cf: { cacheTtl: 3600 } });
      if (mdResponse.ok) {
        const body = await mdResponse.text();
        const headers = new Headers({
          'Content-Type': 'text/markdown; charset=utf-8',
          'Vary': 'Accept',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
          'Content-Signal': 'search=yes, ai-train=yes, ai-input=yes',
          'X-Markdown-Source': '/index.md',
        });
        appendLinkHeaders(headers);
        return new Response(body, { status: 200, headers });
      }
    }

    // HTML path: augment the upstream response with Link + Content-Signal headers.
    const response = await next();
    const newHeaders = new Headers(response.headers);
    if (!newHeaders.has('Vary')) newHeaders.set('Vary', 'Accept');
    newHeaders.set('Content-Signal', 'search=yes, ai-train=yes, ai-input=yes');
    appendLinkHeaders(newHeaders);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }

  return next();
}

function appendLinkHeaders(headers) {
  // RFC 8288 Link relations for agent discovery.
  // Comma-separated Link headers per RFC 8288 §3.
  const links = [
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
  ];
  headers.set('Link', links.join(', '));
}
