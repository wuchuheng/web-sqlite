import { spawn } from "child_process";

/**
 * Executes a command and returns a promise.
 */
const runCommand = (cmd: string, args: string[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    const childProcess = spawn(cmd, args, {
      stdio: "inherit",
      cwd: process.cwd(),
    });
    childProcess.on("close", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`Command failed with code ${code}`)),
    );
    childProcess.on("error", reject);
  });
};

const main = async () => {
  console.log("Building SQLite WASM...");

  // Build and extract files in one step using Docker's --output flag
  await runCommand("docker", [
    "build",
    "-f",
    "docker/sqlite-wasm.Dockerfile",
    "--no-cache",
    "--target",
    "export",
    "--output",
    "type=local,dest=./src/jswasm",
    ".",
  ]);

  console.log("✅ Build complete!");
};

main().catch(console.error);
