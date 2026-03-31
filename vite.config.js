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
          `<link rel="preload" as="style" fetchpriority="high" href="${href}">\n  ${fullTag}`
      );
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [cssPreloadPlugin()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',

    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
});
