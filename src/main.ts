// // Reference the WASM URL to avoid unused import warning
// // This ensures Vite includes the WASM file in the build

// /**
//  * Web-SQLite - A TypeScript-first runtime library for SQLite WebAssembly.
//  * Provides a clear, type-safe API with separate methods for different database operations.
//  */

// // Re-export types for public API
// export type {
//   Database,
//   SqlValue,
//   SqlParameters,
//   ModificationResult,
//   TransactionStatement,
//   WebSQLiteError,
// } from "./types.js";

// import type { Database, WorkerPromiseFunction } from "./types.js";
// import { validateBrowserSupport, WebSQLiteError } from "./errors.js";
// import { createSQLiteWorker, openDatabase, closeDatabase } from "./worker.js";
// import {
//   createQueryFunction,
//   createQueryOneFunction,
//   createExecuteFunction,
//   createRunFunction,
//   createTransactionFunction,
// } from "./exec.js";

// /**
//  * Creates a database interface with separate methods for different operations.
//  *
//  * @param promiser - Worker promiser function
//  * @returns Database interface with type-safe methods
//  */
// const createDatabaseInterface = (
//   promiser: WorkerPromiseFunction,
// ): Database => ({
//   // Query operations - return typed data
//   query: createQueryFunction(promiser),
//   queryOne: createQueryOneFunction(promiser),

//   // Data modification operations - return metadata
//   execute: createExecuteFunction(promiser),

//   // DDL and utility operations - return void
//   run: createRunFunction(promiser),

//   // Transaction operations - atomic execution
//   transaction: createTransactionFunction(promiser),

//   // Resource cleanup
//   close: async (): Promise<void> => {
//     // 1. Close database connection
//     await closeDatabase(promiser);
//   },
// });

// /**
//  * Opens a SQLite database with OPFS persistence using Web Workers.
//  * This is the main entry point for the Web-SQLite library.
//  *
//  * @param filename - Name of the SQLite database file in OPFS
//  * @returns Promise resolving to Database interface with type-safe methods
//  * @throws {WebSQLiteError} If browser doesn't support required features
//  *
//  * @example
//  * ```typescript
//  * import webSqlite from 'web-sqlite';
//  *
//  * const db = await webSqlite('app.sqlite3');
//  *
//  * // Type-safe query operations
//  * interface User { id: number; name: string; }
//  * const users = await db.query<User>('SELECT id, name FROM users');
//  * const user = await db.queryOne<User>('SELECT * FROM users WHERE id = ?', [1]);
//  *
//  * // Data modification operations
//  * const result = await db.execute('INSERT INTO users (name) VALUES (?)', ['John']);
//  * console.log(`Inserted ${result.changes} rows, ID: ${result.lastInsertRowid}`);
//  *
//  * // DDL operations
//  * await db.run('CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT)');
//  *
//  * // Transaction operations
//  * await db.transaction([
//  *   { sql: 'INSERT INTO users (name) VALUES (?)', parameters: ['Alice'], type: 'execute' },
//  *   { sql: 'INSERT INTO users (name) VALUES (?)', parameters: ['Bob'], type: 'execute' },
//  * ]);
//  *
//  * // Clean up
//  * await db.close();
//  * ```
//  */
// const webSqlite = async (filename: string): Promise<Database> => {
//   // 1. Validate browser support
//   validateBrowserSupport();

//   // 2. Validate filename
//   if (!filename || typeof filename !== "string") {
//     throw new WebSQLiteError("Filename must be a non-empty string");
//   }

//   try {
//     // 3. Create and initialize worker
//     const promiser = await createSQLiteWorker();

//     // 4. Open database with OPFS persistence
//     await openDatabase(promiser, filename);

//     // 5. Return database interface with type-safe methods
//     return createDatabaseInterface(promiser);
//   } catch (error) {
//     if (error instanceof WebSQLiteError) {
//       throw error;
//     }
//     throw new WebSQLiteError("Failed to initialize database", error as Error);
//   }
// };

// export default webSqlite;

// Modern approach: Using new URL() constructor for workers with module imports
// This is the recommended way in latest Vite for workers that need to import other modules

import InlineWorker from "./worker-with-imports?worker&inline";

export const workDemo = async (): Promise<void> => {
  // 1. Create worker using modern URL constructor approach
  // This allows the worker to use ES modules and import statements
  const worker = new InlineWorker();

  // 2. Set up message handler
  worker.onmessage = (event) => {
    console.log("Main thread received:", event.data);
  };

  // 3. Send message to worker
  worker.postMessage({ cmd: "start", msg: "Hello from main thread!" });

  // 4. Wait for processing
  await new Promise((resolve) => setTimeout(resolve, 10000));

  // 5. Clean up worker
  worker.terminate();
};

// Alternative: Dynamic import approach for complex module dependencies
export const workDemoWithDynamicImports = async (): Promise<void> => {
  // 1. Create worker code that uses dynamic imports
  const workerCode = `
    // Dynamic imports work in workers
    const loadAndProcess = async (data) => {
      // This would work if the modules are available
      // const { someUtilFunction } = await import('./utils/helper.js');
      // return someUtilFunction(data);
      
      // For now, just process inline
      return \`[PROCESSED] \${data.toUpperCase()}\`;
    };

    self.onmessage = async (event) => {
      console.log("Worker received:", event.data);
      
      const processed = await loadAndProcess(event.data.msg);
      
      self.postMessage({
        original: event.data,
        processed,
        timestamp: Date.now()
      });
    };
  `;

  // 2. Create worker from blob
  const blob = new Blob([workerCode], { type: "application/javascript" });
  const worker = new Worker(URL.createObjectURL(blob));

  // 3. Handle worker messages
  worker.onmessage = (event) => {
    console.log("Main received:", event.data);
  };

  // 4. Send data to worker
  worker.postMessage({ cmd: "process", msg: "test data" });

  // 5. Wait and cleanup
  await new Promise((resolve) => setTimeout(resolve, 5000));
  worker.terminate();
};
