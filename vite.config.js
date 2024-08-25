import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.js'),
      name: 'Quazala Server',
      fileName: (format) => `main.${format}.js`,
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
      },
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
});
