import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/main.ts"],
    outDir: "dist",
    clean: true,
    dts: true,
    format: ["esm"],
    platform: "browser",
    target: "es2022",
  },
  {
    entry: ["src/cli.ts"],
    outDir: "dist",
    clean: false,
    dts: false,
    format: ["cjs"],
    platform: "node",
    target: "es2022",
  },
]);
