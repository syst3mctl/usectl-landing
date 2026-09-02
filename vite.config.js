import { defineConfig } from 'vite';

// Plugin: inject <link rel="preload" as="style"> for bundled CSS
// This moves CSS fetching earlier in the waterfall, reducing render-blocking time
function cssPreloadPlugin() {
  return {
    name: 'css-preload',
    transformIndexHtml(html) {
      return html.replace(
        /(<link rel="stylesheet"[^>]*href="([^"]*\.css)"[^>]*>)/,
        (match, fullTag, href) =>
          `<link rel="preload" as="style" fetchpriority="high" crossorigin href="${href}">\n  ${fullTag}`
      );
    },
  };
}

// Plugin: dev-only directory index for folders under public/.
// Cloudflare Pages serves /variants/ -> /variants/index.html in production;
// the vite dev server does not, so mirror that here.
function publicDirIndexPlugin() {
  return {
    name: 'public-dir-index',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const [path, query] = req.url.split('?');
        if (path === '/variants') {
          // trailing slash so relative links inside the page resolve, like production
          _res.statusCode = 301;
          _res.setHeader('Location', '/variants/' + (query ? '?' + query : ''));
          _res.end();
          return;
        }
        if (path === '/variants/') {
          req.url = '/variants/index.html' + (query ? '?' + query : '');
        }
        next();
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [cssPreloadPlugin(), publicDirIndexPlugin()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    modulePreload: { polyfill: false },

    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
});
