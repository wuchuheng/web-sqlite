/**
 * Main Application Script for SQLite WASM Demo
 *
 * This script initializes the application, coordinates between components,
 * and handles the overall application lifecycle.
 */

class SQLiteWASMDemo {
  constructor() {
    this.databaseManager = null;
    this.uiController = null;
    this.isInitialized = false;

    // Configuration
    this.config = {
      defaultDatabase: "demo.sqlite3",
      initTimeout: 15000,
      enableOpfs: true,
    };
  }

  /**
   * Initialize the application
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log("🚀 Starting SQLite WASM Demo initialization...");

      // Check browser compatibility
      this.checkBrowserCompatibility();

      // Check if required classes are available
      if (typeof DatabaseManager === "undefined") {
        throw new Error(
          "DatabaseManager class not found. Check script loading order."
        );
      }

      if (typeof UIController === "undefined") {
        throw new Error(
          "UIController class not found. Check script loading order."
        );
      }

      // Initialize database manager
      console.log("📊 Initializing DatabaseManager...");
      this.databaseManager = new DatabaseManager();

      // Initialize UI controller
      console.log("🎨 Initializing UIController...");
      this.uiController = new UIController(this.databaseManager);

      // Set up application-level event handlers
      this.setupEventHandlers();

      // Initialize the database
      console.log("🔌 Connecting to database...");
      await this.initializeDatabase();

      // Get SQLite version
      await this.getSQLiteVersion();

      // Show the application
      this.uiController.showApp();

      this.isInitialized = true;
      console.log("✅ SQLite WASM Demo initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize SQLite WASM Demo:", error);
      this.showInitializationError(error);
      throw error;
    }
  }

  /**
   * Check browser compatibility
   */
  checkBrowserCompatibility() {
    const requirements = {
      webAssembly: "WebAssembly" in window,
      webWorkers: "Worker" in window,
      sharedArrayBuffer: "SharedArrayBuffer" in window,
      crossOriginIsolated: window.isSecureContext && window.crossOriginIsolated,
    };

    console.log("🔍 Browser compatibility check:", requirements);

    if (!requirements.webAssembly) {
      throw new Error("WebAssembly is not supported in this browser");
    }

    if (!requirements.webWorkers) {
      throw new Error("Web Workers are not supported in this browser");
    }

    // SharedArrayBuffer and COOP/COEP are recommended but not strictly required
    if (!requirements.sharedArrayBuffer) {
      console.warn(
        "⚠️ SharedArrayBuffer is not available. Some features may be limited."
      );
    }

    if (!requirements.crossOriginIsolated) {
      console.warn(
        "⚠️ Cross-Origin Isolation is not enabled. OPFS features may not work."
      );
    }
  }

  /**
   * Initialize the database connection
   */
  async initializeDatabase() {
    try {
      // Initialize the database manager
      await this.databaseManager.initialize();

      // Open a database connection
      const dbConfig = {
        filename: this.config.defaultDatabase,
        vfs: this.config.enableOpfs ? "opfs" : undefined,
      };

      await this.databaseManager.openDatabase(dbConfig.filename, dbConfig);

      console.log("📊 Database connection established");
    } catch (error) {
      console.error("❌ Database initialization failed:", error);
      throw error;
    }
  }

  /**
   * Get and display SQLite version information
   */
  async getSQLiteVersion() {
    try {
      const result = await this.databaseManager.executeSQL(
        "SELECT sqlite_version() AS version;"
      );
      const version = result.resultRows[0][0];

      // Update UI with version info
      const dbVersionElement = document.getElementById("db-version");
      if (dbVersionElement) {
        dbVersionElement.textContent = `SQLite Version: ${version}`;
      }

      console.log(`📚 SQLite Version: ${version}`);
    } catch (error) {
      console.warn("⚠️ Could not retrieve SQLite version:", error);
    }
  }

  /**
   * Set up application-level event handlers
   */
  setupEventHandlers() {
    // Handle page visibility changes
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        this.onPageVisible();
      } else {
        this.onPageHidden();
      }
    });

    // Handle beforeunload for cleanup
    window.addEventListener("beforeunload", () => {
      this.cleanup();
    });

    // Handle unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      console.error("Unhandled promise rejection:", event.reason);
      this.uiController?.showError("Unexpected error occurred", event.reason);
    });

    // Handle global errors
    window.addEventListener("error", (event) => {
      console.error("Global error:", event.error);
      this.uiController?.showError("Application error", event.error?.message);
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", (event) => {
      this.handleKeyboardShortcuts(event);
    });

    // Database manager events
    this.databaseManager?.on("connect", () => {
      this.onDatabaseConnected();
    });

    this.databaseManager?.on("disconnect", () => {
      this.onDatabaseDisconnected();
    });
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyboardShortcuts(event) {
    // Ctrl/Cmd + Enter: Execute SQL
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      const sqlInput = document.getElementById("sql-input");
      if (sqlInput === document.activeElement) {
        event.preventDefault();
        document.getElementById("execute-sql")?.click();
      }
    }

    // Escape: Close modals
    if (event.key === "Escape") {
      const modals = document.querySelectorAll(".modal:not(.hidden)");
      modals.forEach((modal) => modal.classList.add("hidden"));
    }

    // F5: Refresh schema (when not in input)
    if (event.key === "F5" && !this.isInputActive()) {
      event.preventDefault();
      document.getElementById("refresh-schema")?.click();
    }
  }

  /**
   * Check if an input element is currently active
   */
  isInputActive() {
    const activeElement = document.activeElement;
    return (
      activeElement &&
      (activeElement.tagName === "INPUT" ||
        activeElement.tagName === "TEXTAREA" ||
        activeElement.tagName === "SELECT" ||
        activeElement.isContentEditable)
    );
  }

  /**
   * Handle page becoming visible
   */
  onPageVisible() {
    console.log("👁️ Page became visible");
    // Could refresh connection status or perform other actions
  }

  /**
   * Handle page becoming hidden
   */
  onPageHidden() {
    console.log("🙈 Page became hidden");
    // Could pause operations or save state
  }

  /**
   * Handle database connection established
   */
  onDatabaseConnected() {
    console.log("🔗 Database connected");
    this.enableDatabaseFeatures();
  }

  /**
   * Handle database disconnection
   */
  onDatabaseDisconnected() {
    console.log("🔌 Database disconnected");
    this.disableDatabaseFeatures();
  }

  /**
   * Enable database-dependent UI features
   */
  enableDatabaseFeatures() {
    const buttons = [
      "execute-sql",
      "create-sample-data",
      "run-performance-test",
      "test-transactions",
      "export-db",
      "clear-db",
      "refresh-schema",
      "show-indexes",
    ];

    buttons.forEach((buttonId) => {
      const button = document.getElementById(buttonId);
      if (button) {
        button.disabled = false;
      }
    });

    const sqlInput = document.getElementById("sql-input");
    if (sqlInput) {
      sqlInput.disabled = false;
    }
  }

  /**
   * Disable database-dependent UI features
   */
  disableDatabaseFeatures() {
    const buttons = [
      "execute-sql",
      "create-sample-data",
      "run-performance-test",
      "test-transactions",
      "export-db",
      "clear-db",
      "refresh-schema",
      "show-indexes",
    ];

    buttons.forEach((buttonId) => {
      const button = document.getElementById(buttonId);
      if (button) {
        button.disabled = true;
      }
    });

    const sqlInput = document.getElementById("sql-input");
    if (sqlInput) {
      sqlInput.disabled = true;
    }
  }

  /**
   * Show initialization error
   */
  showInitializationError(error) {
    const loadingElement = document.getElementById("loading");
    if (loadingElement) {
      loadingElement.innerHTML = `
                <div class="error-container">
                    <div class="error-icon">⚠️</div>
                    <div class="error-message">
                        <h3>Initialization Failed</h3>
                        <p>${error.message}</p>
                        <details>
                            <summary>Error Details</summary>
                            <pre>${error.stack || error.toString()}</pre>
                        </details>
                        <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 1rem;">
                            Reload Page
                        </button>
                    </div>
                </div>
            `;
    }
  }

  /**
   * Cleanup resources before page unload
   */
  cleanup() {
    console.log("🧹 Cleaning up resources...");

    if (this.databaseManager) {
      this.databaseManager.destroy();
    }

    // Clear any remaining timers or intervals
    // (Add specific cleanup code as needed)
  }

  /**
   * Get application statistics
   */
  getStats() {
    return {
      initialized: this.isInitialized,
      databaseConnected: this.databaseManager?.isConnected || false,
      performanceStats: this.databaseManager?.getStats() || {},
      memoryUsage: performance.memory
        ? {
            used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
            total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
            limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
          }
        : null,
    };
  }

  /**
   * Development helper: expose app instance globally
   */
  exposeGlobally() {
    if (typeof window !== "undefined") {
      window.sqliteWasmDemo = this;
      window.dbManager = this.databaseManager;
      window.uiController = this.uiController;

      console.log("🔧 Development helpers exposed globally:");
      console.log("  - window.sqliteWasmDemo (main app)");
      console.log("  - window.dbManager (database manager)");
      console.log("  - window.uiController (UI controller)");
    }
  }
}

/**
 * Application initialization
 */
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🎯 DOM Content Loaded - Starting SQLite WASM Demo...");

  try {
    // Create and initialize the application
    const app = new SQLiteWASMDemo();

    // Expose globally for development
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      app.exposeGlobally();
    }

    // Initialize the application
    await app.initialize();
  } catch (error) {
    console.error("💥 Application startup failed:", error);

    // Show a user-friendly error message
    const loadingElement = document.getElementById("loading");
    if (loadingElement) {
      loadingElement.innerHTML = `
                <div class="error-container">
                    <div class="error-icon">💥</div>
                    <div class="error-message">
                        <h3>Failed to Start Application</h3>
                        <p>The SQLite WASM demo could not be initialized.</p>
                        <p>Please check the browser console for more details.</p>
                        <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 1rem;">
                            Try Again
                        </button>
                    </div>
                </div>
            `;
    }
  }
});

/**
 * Add additional CSS for error display
 */
const errorStyles = `
<style>
.error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: white;
    max-width: 500px;
    margin: 0 auto;
}

.error-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
}

.error-message h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: #fef2f2;
}

.error-message p {
    font-size: 1rem;
    margin-bottom: 0.5rem;
    color: #fecaca;
}

.error-message details {
    margin-top: 1rem;
    text-align: left;
}

.error-message summary {
    cursor: pointer;
    color: #fca5a5;
    margin-bottom: 0.5rem;
}

.error-message pre {
    background: rgba(0, 0, 0, 0.3);
    padding: 1rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    overflow: auto;
    max-height: 200px;
    color: #fed7d7;
}
</style>
`;

// Inject error styles
document.head.insertAdjacentHTML("beforeend", errorStyles);
