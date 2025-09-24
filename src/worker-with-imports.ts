// Modern worker example that can import modules
import { someUtilFunction, calculateHash } from "./utils/helper";

console.log("Module Worker is running!");

// Test the imported function
console.log("Testing util function:", someUtilFunction("Hello from worker!"));

self.onmessage = (event) => {
  console.log("Message received from main thread:", event.data);

  // 1. Use imported modules in worker logic
  const processedData = someUtilFunction(event.data.msg);

  // 2. Calculate hash of the message
  const messageHash = calculateHash(JSON.stringify(event.data));

  // 3. Send response back to main thread
  self.postMessage({
    originalData: event.data,
    processedData,
    messageHash,
    timestamp: Date.now(),
  });
};
