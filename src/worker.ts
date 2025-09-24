/**
 * Worker management for SQLite OPFS Worker communication.
 */

import type { WorkerPromiseFunction } from "./types.js";
import { WebSQLiteError, createWorkerError } from "./errors.js";

/**
 * Creates and initializes a SQLite worker with OPFS support.
 *
 * @returns Promise resolving to worker promiser function
 */
export const createSQLiteWorker = async (): Promise<WorkerPromiseFunction> => {
  // 1. Create worker instance using bundler-friendly worker for proper bundling
  const workerUrl = new URL(
    "./jswasm/sqlite3-worker1-bundler-friendly.mjs",
    import.meta.url,
  ).href;
  const worker = new Worker(workerUrl, { type: "module" });

  // 2. Initialize promiser for async communication
  const promiser = await initializeWorkerPromiser(worker);

  // 3. Return promiser function
  return promiser;
};

/**
 * Initializes the worker promiser for async communication with sqlite3-worker1.js
 *
 * @param worker - The worker instance
 * @returns Promise resolving to promiser function
 */
export const initializeWorkerPromiser = async (
  worker: Worker,
): Promise<WorkerPromiseFunction> => {
  return new Promise((resolve, reject) => {
    let isInitialized = false;
    let messageId = 0;
    const pendingMessages = new Map<
      string,
      { resolve: Function; reject: Function }
    >();

    // 1. Handle worker messages
    worker.onmessage = (event) => {
      const data = event.data;

      // Handle initialization
      if (
        !isInitialized &&
        data.type === "sqlite3-api" &&
        data.result === "worker1-ready"
      ) {
        isInitialized = true;
        resolve(createPromiserFunction());
        return;
      }

      // Handle message responses
      if (data.messageId && pendingMessages.has(data.messageId)) {
        const pending = pendingMessages.get(data.messageId)!;
        pendingMessages.delete(data.messageId);

        if (data.error) {
          pending.reject(createWorkerError(data.error, "Worker execution"));
        } else {
          pending.resolve(data.result);
        }
      }
    };

    // 2. Handle worker errors
    worker.onerror = (error) => {
      if (!isInitialized) {
        reject(createWorkerError(error, "Worker initialization"));
      }
    };

    // 3. Create promiser function
    function createPromiserFunction(): WorkerPromiseFunction {
      return (type: string, args?: any): Promise<any> => {
        return new Promise((resolve, reject) => {
          const msgId = `msg-${++messageId}`;

          pendingMessages.set(msgId, { resolve, reject });

          worker.postMessage({
            type,
            args,
            messageId: msgId,
          });

          // Timeout after 30 seconds
          setTimeout(() => {
            if (pendingMessages.has(msgId)) {
              pendingMessages.delete(msgId);
              reject(new WebSQLiteError("Worker operation timeout"));
            }
          }, 30000);
        });
      };
    }

    // 4. Initialize worker
    worker.postMessage({ type: "start" });
  });
};

/**
 * Opens a database using OPFS persistence.
 *
 * @param promiser - Worker promiser function
 * @param filename - Database filename
 * @returns Promise resolving when database is opened
 */
export const openDatabase = async (
  promiser: WorkerPromiseFunction,
  filename: string,
): Promise<void> => {
  try {
    // 1. Open database with OPFS VFS
    await promiser("open", {
      filename,
      vfs: "opfs",
    });
  } catch (error) {
    throw createWorkerError(error, "Database open");
  }
};

/**
 * Closes the database connection.
 *
 * @param promiser - Worker promiser function
 * @returns Promise resolving when database is closed
 */
export const closeDatabase = async (
  promiser: WorkerPromiseFunction,
): Promise<void> => {
  try {
    // 1. Close database
    await promiser("close", {});
  } catch (error) {
    throw createWorkerError(error, "Database close");
  }
};
