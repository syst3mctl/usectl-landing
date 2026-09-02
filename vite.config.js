import { defineConfig } from 'vite';
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
        const pagePath = '/' + ctx.path.replace(/^\/+/, '').replace(/(^|\/)index\.html$/, '$1');
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

        const block = [
          shared.gtag,
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

// Every HTML file under variants/ is its own page in the build.
const variantPages = Object.fromEntries(
  fs.readdirSync('variants')
    .filter((f) => f.endsWith('.html'))
    .map((f) => ['variants/' + f.replace(/\.html$/, ''), './variants/' + f])
);

export default defineConfig({
  base: './',
  plugins: [cssPreloadPlugin(), siteHeadPlugin(), dirRedirectPlugin()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    modulePreload: { polyfill: false },

    rollupOptions: {
      input: {
        main: './index.html',
        ...variantPages,
      },
    },
  },
});
