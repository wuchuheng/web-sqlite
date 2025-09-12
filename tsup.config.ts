export default {
  // Entry files for the build
  entry: ["src/main.ts", "src/cli.ts"],

  // Specify output directory
  outDir: "dist",

  // Remove previous build files
  clean: true,

  // Generate .d.ts files
  dts: true,
};
