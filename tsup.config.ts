import { Color, inColor } from "./src/util/color";
import fs from "fs";

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
      "src/jswasm/sqlite3-worker1.js",
      "src/jswasm/sqlite3-worker1-promiser.js",
      "src/jswasm/sqlite3.js",
      "src/jswasm/sqlite3.wasm",
      "src/jswasm/sqlite3-opfs-async-proxy.js",
    ];

    // 3. Copy files to organized structure
    await Promise.all(
      filesToCopy.map(async (from) => {
        const fileName = from.split("/").pop()!;
        const to = join("dist/jswasm", fileName);
        await copyFile(from, to);
        const fileSize = fs.statSync(from).size;
        // convert size in prefect human readable format
        // e.g., 1024 -> 1 KB, 1048576 -> 1 MB
        let humanReadableSize: string;
        if (fileSize < 1024) {
          humanReadableSize = `${fileSize} B`;
        } else if (fileSize < 1048576) {
          humanReadableSize = `${(fileSize / 1024).toFixed(2)} KB`;
        } else {
          humanReadableSize = `${(fileSize / 1048576).toFixed(2)} MB`;
        }

        console.log(
          `${inColor("COPY", Color.green, Color.bold)} ${from} to ${to} ${inColor(humanReadableSize, Color.green)}`,
        );
      }),
    );

    console.log(
      `✅ Copied ${filesToCopy.length} SQLite vendor files to dist/jswasm/`,
    );
  },
};
