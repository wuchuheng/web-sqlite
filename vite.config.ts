import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
  build: {
    // Automatically clean the output directory before build
    emptyOutDir: true,
    lib: {
      // Entry point of your library
      entry: "src/main.ts",
      // Generate files with correct naming
      fileName: (format) => `index.${format}.js`,
      // Only build ES modules since you only support browsers
      formats: ["es"],
    },
    rollupOptions: {
      // Externalize dependencies that shouldn't be bundled
      // Add any peer dependencies here
      external: [],
      output: {
        // Global variables for any external dependencies
        globals: {},
      },
    },
    // Generate sourcemaps for better debugging
    // Target modern browsers
    target: "esnext",
  },
});
