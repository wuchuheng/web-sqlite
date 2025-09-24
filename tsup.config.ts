import { Color, inColor } from "./src/util/color";

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
  sourcemap: false,

  // Minify output
  minify: true,

  // Target ES2020 for modern browser support
  target: "es2020",

  // Copy SQLite vendor files to organized jswasm directory
  async onSuccess() {
    const { mkdir, cp, readdir, stat } = await import("fs/promises");
    const { join, relative } = await import("path");

    const sourceDir = "src/jswasm";
    const targetDir = "dist/jswasm";

    await mkdir(targetDir, { recursive: true });
    await cp(sourceDir, targetDir, { recursive: true });

    const walkFiles = async (directory: string): Promise<string[]> => {
      const entries = await readdir(directory, { withFileTypes: true });
      const files = await Promise.all(
        entries.map(async (entry) => {
          const entryPath = join(directory, entry.name);
          if (entry.isDirectory()) {
            return walkFiles(entryPath);
          }
          return [entryPath];
        }),
      );
      return files.flat();
    };

    const formatSize = (size: number): string => {
      if (size < 1024) {
        return `${size} B`;
      }
      if (size < 1048576) {
        return `${(size / 1024).toFixed(2)} KB`;
      }
      return `${(size / 1048576).toFixed(2)} MB`;
    };

    const files = await walkFiles(sourceDir);
    let totalSize = 0;

    for (const file of files) {
      const { size } = await stat(file);
      totalSize += size;
      const relativePath = relative(sourceDir, file);
      const destination = join(targetDir, relativePath);

      console.log(
        `${inColor("COPY", Color.green, Color.bold)} ${file} -> ${destination} ${inColor(formatSize(size), Color.green)}`,
      );
    }

    console.log(
      `✅ Copied ${files.length} SQLite vendor files (${formatSize(totalSize)}) to ${targetDir}/`,
    );
  },
};
