# usectl Agent-Readiness Worker

This Cloudflare Worker fixes three gaps flagged by [isitagentready.com](https://isitagentready.com):

1. **Link response headers on homepage** (RFC 8288)
2. **Markdown content negotiation** (`Accept: text/markdown` → serves `/index.md`)
3. **Correct Content-Types for `/.well-known/*`** (JSON instead of `application/octet-stream`)

It sits in front of the existing origin (wherever `usectl.com` is hosted today) and rewrites response headers. No changes to origin needed.

## Deploy

```bash
cd worker
npm install
npx wrangler login           # one-time auth with your Cloudflare account
npx wrangler deploy
```

The Worker will bind to the routes declared in `wrangler.toml`:
- `usectl.com/*`
- `www.usectl.com/*`

Deploy takes ~5 seconds. Test with:

```bash
curl -I https://usectl.com/
# Should now show: Link: </.well-known/api-catalog>; rel="api-catalog", ...

curl -H "Accept: text/markdown" https://usectl.com/ | head -20
# Should now return text/markdown content

curl -I https://usectl.com/.well-known/oauth-protected-resource
# Should now show: content-type: application/json
```

## What the Worker does

- **Homepage (`/` and `/index.html`):** Adds `Link`, `Vary: Accept`, and `Content-Signal` headers. If the request includes `Accept: text/markdown`, fetches `/index.md` from origin and returns it with `Content-Type: text/markdown`.
- **`/.well-known/*`:** Sets correct `Content-Type` (JSON, linkset+json, jwk-set+json, or markdown depending on the path) and adds CORS headers so agents can fetch them cross-origin.
- **`/llms.txt` and `/index.md`:** Sets correct Content-Type and CORS.
- **All responses:** Adds `Content-Signal: search=yes, ai-train=yes, ai-input=yes` to express AI usage preferences per the emerging Cloudflare/IETF standard.

## Why a Worker instead of `_headers`?

The current `usectl.com` origin isn't Cloudflare Pages — it's a static file server (nginx, R2, or similar) behind the Cloudflare CDN. `_headers` and `functions/_middleware.js` only work on Pages. The Worker runs on the Cloudflare edge regardless of what's behind it.

If you later migrate the landing to Cloudflare Pages, this Worker becomes redundant and can be removed.
