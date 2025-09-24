/**
 * SQLite WASM Database Manager
 *
 * This module provides a comprehensive interface to SQLite WebAssembly
 * using Web Workers for non-blocking database operations.
 *
 * Features:
 * - Promise-based API
 * - Web Worker integration
 * - OPFS (Origin Private File System) support
 * - Multiple result formats
 * - Performance monitoring
 * - Transaction support
 * - Error handling
 */

class DatabaseManager {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
    this.messageId = 0;
    this.pendingMessages = new Map();
    this.dbId = null;
    this.isConnected = false;

    // Performance monitoring
    this.stats = {
      totalQueries: 0,
      totalTime: 0,
      lastQueryTime: 0,
      rowsAffected: 0,
    };

    // Event listeners
    this.eventListeners = {
      connect: [],
      disconnect: [],
      error: [],
      queryComplete: [],
      log: [],
    };
  }

  /**
   * Initialize the database manager with SQLite WASM worker
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      this.emit("log", {
        level: "info",
        message: "Initializing SQLite WASM worker...",
      });

      // Check if worker file exists by creating a test worker
      let workerUrl = "jswasm/sqlite3-worker1.js";

      // Create worker from the SQLite WASM worker file
      this.worker = new Worker(workerUrl);

      // Set up message handling
      this.worker.onmessage = (event) => this.handleWorkerMessage(event);
      this.worker.onerror = (error) => this.handleWorkerError(error);

      // Wait for worker initialization with timeout
      const initPromise = this.waitForWorkerReady();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Worker initialization timeout")),
          15000
        );
      });

      await Promise.race([initPromise, timeoutPromise]);

      this.isInitialized = true;
      this.emit("log", {
        level: "success",
        message: "SQLite WASM worker initialized successfully",
      });
    } catch (error) {
      console.error("DatabaseManager initialization error:", error);
      this.emit("error", {
        message: "Failed to initialize SQLite WASM",
        error,
      });
      throw error;
    }
  }

  /**
   * Wait for the worker to be ready
   */
  waitForWorkerReady() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Worker initialization timeout after 15 seconds"));
      }, 15000);

      const messageHandler = (event) => {
        try {
          const data = event.data;
          console.log("Worker message during init:", data);

          if (
            data &&
            data.type === "sqlite3-api" &&
            data.result === "worker1-ready"
          ) {
            clearTimeout(timeout);
            this.worker.removeEventListener("message", messageHandler);
            console.log("✅ SQLite worker is ready");
            resolve();
          }
        } catch (error) {
          clearTimeout(timeout);
          reject(error);
        }
      };

      this.worker.addEventListener("message", messageHandler);
    });
  }

  /**
   * Open a database connection
   */
  async openDatabase(filename = ":memory:", options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      this.emit("log", {
        level: "info",
        message: `Opening database: ${filename}`,
      });

      const result = await this.sendMessage("open", {
        filename,
        ...options,
      });

      this.dbId = result.dbId;
      this.isConnected = true;

      this.emit("connect", {
        filename: result.filename,
        dbId: this.dbId,
        vfs: result.vfs,
      });

      this.emit("log", {
        level: "success",
        message: `Database opened successfully: ${result.filename} (VFS: ${result.vfs})`,
      });

      return result;
    } catch (error) {
      this.emit("error", { message: "Failed to open database", error });
      throw error;
    }
  }

  /**
   * Execute SQL commands
   */
  async executeSQL(sql, options = {}) {
    if (!this.isConnected) {
      throw new Error("Database not connected");
    }

    const startTime = performance.now();

    try {
      this.emit("log", {
        level: "info",
        message: `Executing SQL: ${sql.substring(0, 100)}${
          sql.length > 100 ? "..." : ""
        }`,
      });

      const result = await this.sendMessage("exec", {
        sql,
        rowMode: options.rowMode || "array",
        resultRows: options.resultRows !== false ? [] : undefined,
        columnNames: options.columnNames !== false ? [] : undefined,
        callback: options.callback,
        bind: options.bind,
        ...options,
      });

      const queryTime = performance.now() - startTime;

      // Update statistics
      this.stats.totalQueries++;
      this.stats.totalTime += queryTime;
      this.stats.lastQueryTime = queryTime;
      this.stats.rowsAffected = result.changeCount || 0;

      this.emit("queryComplete", {
        sql,
        result,
        executionTime: queryTime,
        stats: this.getStats(),
      });

      this.emit("log", {
        level: "success",
        message: `SQL executed successfully (${queryTime.toFixed(2)}ms)`,
      });

      return result;
    } catch (error) {
      const queryTime = performance.now() - startTime;
      this.stats.lastQueryTime = queryTime;

      this.emit("error", { message: "SQL execution failed", error, sql });
      throw error;
    }
  }

  /**
   * Create sample data for demonstration
   */
  async createSampleData() {
    const sampleSQL = `
            -- Create users table
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                age INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Create posts table
            CREATE TABLE IF NOT EXISTS posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                content TEXT,
                published BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            -- Create index on users email
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

            -- Insert sample users
            INSERT OR REPLACE INTO users (id, name, email, age) VALUES
                (1, 'Alice Johnson', 'alice@example.com', 28),
                (2, 'Bob Smith', 'bob@example.com', 35),
                (3, 'Charlie Brown', 'charlie@example.com', 22),
                (4, 'Diana Prince', 'diana@example.com', 30),
                (5, 'Eve Wilson', 'eve@example.com', 27);

            -- Insert sample posts
            INSERT OR REPLACE INTO posts (id, user_id, title, content, published) VALUES
                (1, 1, 'Getting Started with SQLite', 'SQLite is a great embedded database...', 1),
                (2, 1, 'Web Development Tips', 'Here are some useful tips for web development...', 1),
                (3, 2, 'Introduction to WASM', 'WebAssembly brings new possibilities...', 1),
                (4, 3, 'JavaScript Best Practices', 'Writing clean JavaScript code...', 0),
                (5, 4, 'Database Design Patterns', 'Good database design is crucial...', 1),
                (6, 5, 'Modern CSS Techniques', 'CSS has evolved significantly...', 0);
        `;

    await this.executeSQL(sampleSQL);

    this.emit("log", {
      level: "success",
      message: "Sample data created successfully",
    });
  }

  /**
   * Run performance test
   */
  async runPerformanceTest() {
    this.emit("log", { level: "info", message: "Running performance test..." });

    const startTime = performance.now();
    const testSize = 1000;

    try {
      // Create test table
      await this.executeSQL(`
                DROP TABLE IF EXISTS perf_test;
                CREATE TABLE perf_test (
                    id INTEGER PRIMARY KEY,
                    data TEXT,
                    number INTEGER,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            `);

      // Insert test data
      let insertSQL = "INSERT INTO perf_test (data, number) VALUES ";
      const values = [];
      for (let i = 0; i < testSize; i++) {
        values.push(`('Test data ${i}', ${Math.floor(Math.random() * 1000)})`);
      }
      insertSQL += values.join(",") + ";";

      const insertStart = performance.now();
      await this.executeSQL(insertSQL);
      const insertTime = performance.now() - insertStart;

      // Run select test
      const selectStart = performance.now();
      const result = await this.executeSQL(
        "SELECT COUNT(*) as count FROM perf_test"
      );
      const selectTime = performance.now() - selectStart;

      // Run complex query test
      const complexStart = performance.now();
      await this.executeSQL(`
                SELECT 
                    AVG(number) as avg_number,
                    MAX(number) as max_number,
                    MIN(number) as min_number,
                    COUNT(*) as total_count
                FROM perf_test 
                WHERE number > 500
            `);
      const complexTime = performance.now() - complexStart;

      const totalTime = performance.now() - startTime;

      const results = {
        totalTime: totalTime.toFixed(2),
        insertTime: insertTime.toFixed(2),
        selectTime: selectTime.toFixed(2),
        complexTime: complexTime.toFixed(2),
        recordsProcessed: testSize,
        throughput: (testSize / (totalTime / 1000)).toFixed(0),
      };

      this.emit("log", {
        level: "success",
        message: `Performance test completed in ${totalTime.toFixed(2)}ms`,
      });

      return results;
    } catch (error) {
      this.emit("error", { message: "Performance test failed", error });
      throw error;
    }
  }

  /**
   * Test transaction functionality
   */
  async testTransactions() {
    this.emit("log", {
      level: "info",
      message: "Testing transaction functionality...",
    });

    try {
      // Test successful transaction
      await this.executeSQL("BEGIN TRANSACTION;");
      await this.executeSQL(`
                INSERT INTO users (name, email, age) 
                VALUES ('Transaction Test User', 'transaction@example.com', 25);
            `);

      const result = await this.executeSQL(`
                SELECT COUNT(*) as count FROM users WHERE email = 'transaction@example.com';
            `);

      await this.executeSQL("COMMIT;");

      this.emit("log", {
        level: "success",
        message: "Transaction committed successfully",
      });

      // Test rollback
      await this.executeSQL("BEGIN TRANSACTION;");
      await this.executeSQL(`
                INSERT INTO users (name, email, age) 
                VALUES ('Rollback Test User', 'rollback@example.com', 30);
            `);
      await this.executeSQL("ROLLBACK;");

      const rollbackResult = await this.executeSQL(`
                SELECT COUNT(*) as count FROM users WHERE email = 'rollback@example.com';
            `);

      this.emit("log", {
        level: "success",
        message: "Transaction rollback successful",
      });

      return {
        commitTest: result.resultRows[0][0] > 0,
        rollbackTest: rollbackResult.resultRows[0][0] === 0,
      };
    } catch (error) {
      // Ensure we rollback any pending transaction
      try {
        await this.executeSQL("ROLLBACK;");
      } catch (rollbackError) {
        // Ignore rollback errors
      }

      this.emit("error", { message: "Transaction test failed", error });
      throw error;
    }
  }

  /**
   * Get database schema information
   */
  async getSchema() {
    try {
      const tables = await this.executeSQL(`
                SELECT name, type, sql 
                FROM sqlite_master 
                WHERE type IN ('table', 'index', 'view') 
                ORDER BY type, name;
            `);

      const schema = {};

      for (const row of tables.resultRows) {
        const [name, type, sql] = row;

        if (!schema[type]) {
          schema[type] = [];
        }

        if (type === "table") {
          // Get column information for tables
          const columns = await this.executeSQL(`PRAGMA table_info(${name});`);
          schema[type].push({
            name,
            sql,
            columns: columns.resultRows.map((col) => ({
              name: col[1],
              type: col[2],
              notnull: col[3] === 1,
              defaultValue: col[4],
              primaryKey: col[5] === 1,
            })),
          });
        } else {
          schema[type].push({ name, sql });
        }
      }

      return schema;
    } catch (error) {
      this.emit("error", { message: "Failed to get schema", error });
      throw error;
    }
  }

  /**
   * Export database
   */
  async exportDatabase() {
    try {
      this.emit("log", { level: "info", message: "Exporting database..." });

      const result = await this.sendMessage("export", {});

      this.emit("log", {
        level: "success",
        message: `Database exported successfully (${result.byteArray.length} bytes)`,
      });

      return result;
    } catch (error) {
      this.emit("error", { message: "Database export failed", error });
      throw error;
    }
  }

  /**
   * Clear all data from database
   */
  async clearDatabase() {
    try {
      this.emit("log", { level: "info", message: "Clearing database..." });

      // Get all table names
      const tables = await this.executeSQL(`
                SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';
            `);

      // Drop all tables
      for (const row of tables.resultRows) {
        await this.executeSQL(`DROP TABLE IF EXISTS ${row[0]};`);
      }

      this.emit("log", {
        level: "success",
        message: "Database cleared successfully",
      });
    } catch (error) {
      this.emit("error", { message: "Failed to clear database", error });
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async closeDatabase() {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.sendMessage("close", { unlink: false });

      this.isConnected = false;
      this.dbId = null;

      this.emit("disconnect", { message: "Database connection closed" });
      this.emit("log", {
        level: "info",
        message: "Database connection closed",
      });
    } catch (error) {
      this.emit("error", { message: "Failed to close database", error });
      throw error;
    }
  }

  /**
   * Get performance statistics
   */
  getStats() {
    return {
      ...this.stats,
      avgTime:
        this.stats.totalQueries > 0
          ? this.stats.totalTime / this.stats.totalQueries
          : 0,
    };
  }

  /**
   * Send message to worker and wait for response
   */
  sendMessage(type, args = {}) {
    return new Promise((resolve, reject) => {
      const messageId = `${type}-${++this.messageId}`;

      this.pendingMessages.set(messageId, { resolve, reject });

      const message = {
        type,
        args,
        dbId: this.dbId,
        messageId,
        departureTime: performance.now(),
      };

      this.worker.postMessage(message);

      // Set timeout for message
      setTimeout(() => {
        if (this.pendingMessages.has(messageId)) {
          this.pendingMessages.delete(messageId);
          reject(new Error(`Message timeout: ${type}`));
        }
      }, 30000); // 30 second timeout
    });
  }

  /**
   * Handle worker messages
   */
  handleWorkerMessage(event) {
    try {
      const data = event.data;

      if (!data || typeof data !== "object") {
        console.warn("Unknown worker message format:", event);
        return;
      }

      console.log("Worker message:", data);

      // Handle initialization message
      if (data.type === "sqlite3-api" && data.result === "worker1-ready") {
        return; // Handled by waitForWorkerReady
      }

      // Handle response messages
      if (data.messageId && this.pendingMessages.has(data.messageId)) {
        const { resolve, reject } = this.pendingMessages.get(data.messageId);
        this.pendingMessages.delete(data.messageId);

        if (data.type === "error") {
          const error = new Error(data.result?.message || "Worker error");
          error.details = data.result;
          reject(error);
        } else {
          resolve(data.result);
        }
        return;
      }

      // Handle other messages
      console.log("Unhandled worker message:", data);
    } catch (error) {
      console.error("Error handling worker message:", error);
      this.emit("error", { message: "Worker message handling error", error });
    }
  }

  /**
   * Handle worker errors
   */
  handleWorkerError(error) {
    console.error("SQLite Worker Error:", error);
    this.emit("error", {
      message: "SQLite worker error occurred",
      error: {
        message: error.message || "Unknown worker error",
        filename: error.filename,
        lineno: error.lineno,
        colno: error.colno,
      },
    });

    // If we have pending messages, reject them
    this.pendingMessages.forEach(({ reject }, messageId) => {
      reject(new Error("Worker error: " + (error.message || "Unknown error")));
    });
    this.pendingMessages.clear();
  }

  /**
   * Event system
   */
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  off(event, callback) {
    if (!this.eventListeners[event]) {
      return;
    }
    const index = this.eventListeners[event].indexOf(callback);
    if (index > -1) {
      this.eventListeners[event].splice(index, 1);
    }
  }

  emit(event, data) {
    if (!this.eventListeners[event]) {
      return;
    }
    this.eventListeners[event].forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Event listener error:`, error);
        // Don't re-emit error events to prevent infinite loops
        if (event !== "error") {
          this.emit("error", {
            message: "Event listener error",
            error: error.message || error,
          });
        }
      }
    });
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    this.pendingMessages.clear();
    this.isInitialized = false;
    this.isConnected = false;
    this.dbId = null;

    // Clear event listeners
    Object.keys(this.eventListeners).forEach((event) => {
      this.eventListeners[event] = [];
    });
  }
}

// Export for use in other modules
window.DatabaseManager = DatabaseManager;
