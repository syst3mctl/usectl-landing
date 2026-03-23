import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Ensure that the animations.js is correctly processed
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
});
