export default {
  // Entry files for the build
  entry: ["src/main.ts", "src/cli.ts"],

  // Output formats - ESM only for modern usage
  format: ["esm"],

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

  // Copy SQLite vendor files to organized jswasm directory
  async onSuccess() {
    const { mkdir, copyFile } = await import("fs/promises");
    const { join } = await import("path");

    // 1. Create jswasm directory in dist
    await mkdir("dist/jswasm", { recursive: true });

    // 2. Define essential files to copy
    const filesToCopy = [
      "sqlite3-worker1.js",
      "sqlite3-worker1-promiser.js",
      "sqlite3.js",
      "sqlite3.wasm",
      "sqlite3-opfs-async-proxy.js",
    ];

    // 3. Copy files to organized structure
    await Promise.all(
      filesToCopy.map(async (file) => {
        await copyFile(join("src/jswasm", file), join("dist/jswasm", file));
      }),
    );

    console.log(
      `✅ Copied ${filesToCopy.length} SQLite vendor files to dist/jswasm/`,
    );
  },
};
