// Alternative approach: Dynamic worker import
// This creates the worker from a URL that works in both dev and production

export const createWorkerFromUrl = async (): Promise<Worker> => {
  // Worker code as a string
  const workerCode = `
    console.log("Worker context is running.");

    self.onmessage = (event) => {
      console.log("Message received from main thread:", event.data);
      self.postMessage(\`Worker received: \${JSON.stringify(event.data)}\`);
    };
  `;

  // Create blob URL for worker
  const blob = new Blob([workerCode], { type: "application/javascript" });
  const workerUrl = URL.createObjectURL(blob);

  return new Worker(workerUrl);
};

// Alternative function using URL approach
export const workDemoWithUrl = async (): Promise<void> => {
  // 1. Create worker from URL
  const worker = await createWorkerFromUrl();

  // 2. Handle logic
  worker.postMessage({ cmd: "start", msg: "hi" });

  // 3. Listen for responses
  worker.onmessage = (event) => {
    console.log("Main thread received:", event.data);
  };

  // Sleep 10s
  await new Promise((resolve) => setTimeout(resolve, 10000));

  // Clean up
  worker.terminate();
};
