import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    sourcemap: true,
  },
  server: {
    port: 5173,
    open: false,
    watch: {
      // Ignore in-progress browser downloads + temp files so dropping assets
      // into the project doesn't crash the file watcher with EBUSY.
      ignored: ['**/*.crdownload', '**/*.part', '**/*.tmp', '**/*.download'],
    },
  },
  test: {
    globals: true,
  },
});
