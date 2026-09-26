import { defineConfig } from 'vite';
import { minifySync } from 'rolldown/experimental';
import fs from 'node:fs';
import path from 'node:path';

const SITE = 'https://usectl.com';
const SITE_HEAD_MARKER = /<!--\s*@site-head[^>]*-->/;

// Plugin: inject <link rel="preload" as="style"> for bundled CSS
// This moves CSS fetching earlier in the waterfall, reducing render-blocking time
function cssPreloadPlugin() {
  return {
    name: 'css-preload',
    transformIndexHtml(html) {
      return html.replace(
        /(<link rel="stylesheet"[^>]*href="([^"]*\/assets\/[^"]*\.css)"[^>]*>)/,
        (match, fullTag, href) =>
          `<link rel="preload" as="style" fetchpriority="high" crossorigin href="${href}">\n  ${fullTag}`
      );
    },
  };
}

// Plugin: shared site head.
// index.html is the single source of truth for the site-wide <head> (gtag,
// charset/viewport, author, theme-color, og/twitter defaults, icons, manifest,
// content-signal). Any other page that puts `<!-- @site-head -->` in its <head>
// gets those tags injected here, at dev-serve and build time, plus the
// page-specific og/twitter/canonical tags derived from the page's own
// <title>, <meta name="description"> and URL.
function siteHeadPlugin() {
  const attr = (tag, name) => {
    const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`));
    return m ? m[1] : null;
  };
  const SHARED_META = new Set([
    'author', 'theme-color', 'msapplication-TileImage', 'msapplication-TileColor', 'content-signal',
    'og:image', 'og:image:secure_url', 'og:image:type', 'og:image:width', 'og:image:height',
    'og:site_name', 'og:locale', 'twitter:card', 'twitter:image', 'twitter:site', 'twitter:creator',
  ]);
  const SHARED_LINK = new Set(['icon', 'apple-touch-icon', 'manifest']);

  let root;
  const readIndexHead = () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const head = html.match(/<head>([\s\S]*?)<\/head>/)[1];
    const gtag = head.match(/<!-- Google tag[\s\S]*?<\/script>\s*<script>[\s\S]*?<\/script>/)?.[0] ?? '';
    const shared = { gtag, meta: [], link: [], charset: '', viewport: '' };
    for (const tag of head.match(/<(?:meta|link)\b[^>]*>/g) ?? []) {
      if (/^<meta\s+charset=/i.test(tag)) shared.charset = tag;
      else if (attr(tag, 'name') === 'viewport') shared.viewport = tag;
      else if (SHARED_META.has(attr(tag, 'name') ?? attr(tag, 'property'))) shared.meta.push(tag);
      else if (SHARED_LINK.has(attr(tag, 'rel'))) shared.link.push(tag);
    }
    return shared;
  };

  return {
    name: 'site-head',
    configResolved(config) {
      root = config.root;
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        if (!SITE_HEAD_MARKER.test(html)) return;
        const shared = readIndexHead();

        const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
        const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
        const description = html.match(/<meta\s+name="description"\s+content="([^"]*)"/)?.[1] ?? '';
        // Cloudflare Pages serves foo.html at /foo (and redirects the .html form), so drop the extension
        const pagePath = '/' + ctx.path.replace(/^\/+/, '').replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, '');
        const url = SITE + pagePath;

        const ogTag = (p, v) => `<meta property="${p}" content="${esc(v)}">`;
        const twTag = (n, v) => `<meta name="${n}" content="${esc(v)}">`;
        const page = [
          `<link rel="canonical" href="${url}">`,
          ogTag('og:type', 'website'),
          ogTag('og:url', url),
          ogTag('og:title', title),
          ogTag('og:description', description),
          ogTag('og:image:alt', title),
          twTag('twitter:url', url),
          twTag('twitter:title', title),
          twTag('twitter:description', description),
        ];

        // the 3D variant pages: the ~527KB gtag library competes with the
        // model downloads and pipeline compiles for bandwidth and main
        // thread during exactly the boot window. Keep the inline dataLayer
        // stub (gtag() calls queue), but fetch the library only once the
        // boot veil is down (window.__veilDown, set by variant 12) — or
        // after 20s for pages that never set it (variant 11, the handoff).
        let gtagBlock = shared.gtag;
        const gtagSrc = gtagBlock.match(/<script async src="([^"]*)"><\/script>/)?.[1];
        if (/^\/variants\//.test(ctx.path) && gtagSrc) {
          gtagBlock = gtagBlock.replace(
            /<script async src="[^"]*"><\/script>/,
            `<script>(function(){var f=0;function go(){if(f)return;f=1;var s=document.createElement('script');s.async=true;s.src=${JSON.stringify(gtagSrc)};document.head.appendChild(s);}var t=setInterval(function(){if(window.__veilDown){clearInterval(t);go();}},500);setTimeout(function(){clearInterval(t);go();},20000);})();</script>`,
          );
        }

        const block = [
          gtagBlock,
          '',
          shared.charset,
          shared.viewport,
          ...shared.meta.filter((t) => !/^<meta\s+(?:property|name)="(?:og|twitter):/.test(t)),
          ...page,
          ...shared.meta.filter((t) => /^<meta\s+(?:property|name)="(?:og|twitter):/.test(t)),
          ...shared.link,
        ].join('\n    ');

        return html.replace(SITE_HEAD_MARKER, block);
      },
    },
  };
}

// Plugin: minify bare inline <script> blocks at build time. Vite only
// minifies the module scripts it bundles; the variant pages carry ~700KB of
// classic inline JS (the 13k-line scene script is ~47% comment bytes) that
// shipped verbatim — measured 208KB -> 76KB brotli on the wire for variant
// 12, plus a real parse-time cut on phone CPUs. rolldown's minifier keeps
// TOP-LEVEL identifiers (verified on a probe) so the cross-<script>-block
// globals these pages share survive; source files stay fully commented.
function inlineMinifyPlugin() {
  return {
    name: 'inline-minify',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return html.replace(/<script>([\s\S]*?)<\/script>/g, (m, body) => {
          if (body.length < 1024) return m;
          try {
            const out = minifySync('inline.js', body);
            return out && out.code && out.code.length < body.length ? `<script>${out.code}</script>` : m;
          } catch (e) {
            console.warn('[inline-minify] left a block unminified:', String(e).slice(0, 120));
            return m;
          }
        });
      },
    },
  };
}

// Plugin: dev-only. Cloudflare Pages serves /variants -> /variants/ -> index.html
// in production; the vite dev server only handles the trailing-slash form.
function dirRedirectPlugin() {
  return {
    name: 'dir-redirect',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const [p, query] = req.url.split('?');
        if (p === '/variants') {
          res.statusCode = 301;
          res.setHeader('Location', '/variants/' + (query ? '?' + query : ''));
          res.end();
          return;
        }
        next();
      });
    },
  };
}

// Plugin: sidecar scripts under variants/ (classic <script src> files, e.g.
// the scroll-record.js video-capture helper) are referenced as-is, not
// bundled — vite warns and drops them, so carry them into dist verbatim.
function variantSidecarPlugin() {
  return {
    name: 'variant-sidecars',
    apply: 'build',
    closeBundle() {
      for (const f of fs.readdirSync('variants').filter((n) => n.endsWith('.js'))) {
        fs.copyFileSync(path.join('variants', f), path.join('dist', 'variants', f));
      }
    },
  };
}

// Every HTML file under variants/ is its own page in the build.
const variantPages = Object.fromEntries(
  fs.readdirSync('variants')
    .filter((f) => f.endsWith('.html'))
    .map((f) => ['variants/' + f.replace(/\.html$/, ''), './variants/' + f])
);

export default defineConfig({
  base: './',
  plugins: [cssPreloadPlugin(), siteHeadPlugin(), dirRedirectPlugin(), variantSidecarPlugin(), inlineMinifyPlugin()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    modulePreload: { polyfill: false },

    rollupOptions: {
      input: {
        main: './index.html',
        privacy: './privacy.html',
        terms: './terms.html',
        ...variantPages,
      },
    },
  },
});
