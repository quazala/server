import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/main.js"),
      name: "LecalaServer",
      fileName: (format) => `main.${format}.js`,
    },
    rollupOptions: {
      // If you have any external dependencies, list them here
      // external: ['dependency-name'],
      output: {
        // And provide globals if necessary
        // globals: {
        //   'dependency-name': 'DependencyName',
        // },
      },
    },
  },
  test: {
    // Vitest configuration
    globals: true,
    environment: "node",
  },
});
