export default {
  // Entry files for the build
  entry: ["src/main.ts", "src/cli.ts"],

  // Output formats
  format: ["cjs", "esm"],

  // Specify output directory
  outDir: "dist",

  // Remove previous build files
  clean: true,

  // Generate .d.ts files
  dts: true,

  // Generate source maps
  sourcemap: true,

  // Minify output
  minify: true,

  // Target ES2020 for modern browser support
  target: "es2020",

  // Copy SQLite WASM files to dist
  async onSuccess() {
    const fs = await import("fs/promises");
    const path = await import("path");

    // Copy SQLite worker files to dist
    const srcDir = "src/jswasm";
    const distDir = "dist";

    const filesToCopy = [
      "sqlite3-worker1.js",
      "sqlite3-worker1-promiser.js",
      "sqlite3.js",
      "sqlite3.wasm",
      "sqlite3-opfs-async-proxy.js",
    ];

    for (const file of filesToCopy) {
      try {
        await fs.copyFile(path.join(srcDir, file), path.join(distDir, file));
        console.log(`Copied ${file} to dist/`);
      } catch (error) {
        console.warn(`Warning: Could not copy ${file}:`, error);
      }
    }
  },
};
