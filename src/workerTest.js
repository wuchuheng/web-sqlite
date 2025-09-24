// Generate some codes in the worker context

console.log("Worker context is running.");

// Access message for main thread.
self.onmessage = (event) => {
  console.log("Message received from main thread:", event.data);
  // Echo the message back to the main thread.
  self.postMessage(`Worker received: ${event.data}`);
};
