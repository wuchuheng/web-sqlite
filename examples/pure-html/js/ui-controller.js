/**
 * UI Controller for SQLite WASM Demo
 *
 * This module handles all user interface interactions and coordinates
 * with the DatabaseManager to provide a seamless user experience.
 */

class UIController {
  constructor(databaseManager) {
    this.dbManager = databaseManager;
    this.elements = {};
    this.currentLogLevel = "all";
    this.autoScroll = true;

    this.initializeElements();
    this.bindEventListeners();
    this.setupDatabaseEventListeners();
  }

  /**
   * Initialize DOM element references
   */
  initializeElements() {
    this.elements = {
      // Loading and app containers
      loading: document.getElementById("loading"),
      app: document.getElementById("app"),

      // Connection status
      connectionStatus: document.getElementById("connection-status"),
      dbName: document.getElementById("db-name"),
      dbVersion: document.getElementById("db-version"),

      // SQL execution
      sqlInput: document.getElementById("sql-input"),
      executeSql: document.getElementById("execute-sql"),
      clearSql: document.getElementById("clear-sql"),
      autoCommit: document.getElementById("auto-commit"),
      rowMode: document.getElementById("row-mode"),

      // Quick actions
      createSampleData: document.getElementById("create-sample-data"),
      runPerformanceTest: document.getElementById("run-performance-test"),
      testTransactions: document.getElementById("test-transactions"),
      exportDb: document.getElementById("export-db"),
      clearDb: document.getElementById("clear-db"),

      // Results panel
      resultsContainer: document.getElementById("results-container"),
      clearResults: document.getElementById("clear-results"),
      autoScrollCheckbox: document.getElementById("auto-scroll"),

      // Schema panel
      schemaContainer: document.getElementById("schema-container"),
      refreshSchema: document.getElementById("refresh-schema"),
      showIndexes: document.getElementById("show-indexes"),

      // Performance stats
      totalQueries: document.getElementById("total-queries"),
      avgTime: document.getElementById("avg-time"),
      lastTime: document.getElementById("last-time"),
      rowsAffected: document.getElementById("rows-affected"),

      // Log panel
      logContainer: document.getElementById("log-container"),
      clearLog: document.getElementById("clear-log"),
      logLevel: document.getElementById("log-level"),

      // Modals
      errorDialog: document.getElementById("error-dialog"),
      errorMessage: document.getElementById("error-message"),
      errorDetails: document.getElementById("error-details"),
      showErrorDetails: document.getElementById("show-error-details"),
      closeError: document.getElementById("close-error"),
      okError: document.getElementById("ok-error"),

      featureShowcase: document.getElementById("feature-showcase"),
      closeShowcase: document.getElementById("close-showcase"),
      closeShowcaseBtn: document.getElementById("close-showcase-btn"),
      startTour: document.getElementById("start-tour"),
    };

    // Log missing elements for debugging
    const missingElements = Object.entries(this.elements)
      .filter(([key, element]) => !element)
      .map(([key]) => key);

    if (missingElements.length > 0) {
      console.warn("Missing DOM elements:", missingElements);
    }
  }

  /**
   * Bind event listeners to UI elements
   */
  bindEventListeners() {
    // Helper function to safely add event listener
    const safeAddEventListener = (element, event, handler) => {
      if (element) {
        element.addEventListener(event, handler);
      } else {
        console.warn(`Cannot bind ${event} listener: element is null`);
      }
    };

    // SQL execution
    safeAddEventListener(this.elements.executeSql, "click", () =>
      this.executeSql()
    );
    safeAddEventListener(this.elements.clearSql, "click", () =>
      this.clearSql()
    );
    safeAddEventListener(this.elements.sqlInput, "keydown", (e) => {
      if (e.ctrlKey && e.key === "Enter") {
        this.executeSql();
      }
    });

    // Quick actions
    safeAddEventListener(this.elements.createSampleData, "click", () =>
      this.createSampleData()
    );
    safeAddEventListener(this.elements.runPerformanceTest, "click", () =>
      this.runPerformanceTest()
    );
    safeAddEventListener(this.elements.testTransactions, "click", () =>
      this.testTransactions()
    );
    safeAddEventListener(this.elements.exportDb, "click", () =>
      this.exportDatabase()
    );
    safeAddEventListener(this.elements.clearDb, "click", () =>
      this.clearDatabase()
    );

    // Results panel
    safeAddEventListener(this.elements.clearResults, "click", () =>
      this.clearResults()
    );
    safeAddEventListener(this.elements.autoScrollCheckbox, "change", (e) => {
      this.autoScroll = e.target.checked;
    });

    // Schema panel
    safeAddEventListener(this.elements.refreshSchema, "click", () =>
      this.refreshSchema()
    );
    safeAddEventListener(this.elements.showIndexes, "click", () =>
      this.showIndexes()
    );

    // Log panel
    safeAddEventListener(this.elements.clearLog, "click", () =>
      this.clearLog()
    );
    safeAddEventListener(this.elements.logLevel, "change", (e) => {
      this.currentLogLevel = e.target.value;
      this.filterLogEntries();
    });

    // Error dialog
    safeAddEventListener(this.elements.showErrorDetails, "click", () =>
      this.toggleErrorDetails()
    );
    safeAddEventListener(this.elements.closeError, "click", () =>
      this.hideErrorDialog()
    );
    safeAddEventListener(this.elements.okError, "click", () =>
      this.hideErrorDialog()
    );

    // Feature showcase
    safeAddEventListener(this.elements.closeShowcase, "click", () =>
      this.hideFeatureShowcase()
    );
    safeAddEventListener(this.elements.closeShowcaseBtn, "click", () =>
      this.hideFeatureShowcase()
    );
    safeAddEventListener(this.elements.startTour, "click", () =>
      this.startDemoTour()
    );

    // Click outside modal to close
    safeAddEventListener(this.elements.errorDialog, "click", (e) => {
      if (e.target === this.elements.errorDialog) {
        this.hideErrorDialog();
      }
    });

    safeAddEventListener(this.elements.featureShowcase, "click", (e) => {
      if (e.target === this.elements.featureShowcase) {
        this.hideFeatureShowcase();
      }
    });
  }

  /**
   * Set up database event listeners
   */
  setupDatabaseEventListeners() {
    this.dbManager.on("connect", (data) => {
      this.updateConnectionStatus(true, data.filename);
      this.refreshSchema();
    });

    this.dbManager.on("disconnect", () => {
      this.updateConnectionStatus(false);
    });

    this.dbManager.on("error", (data) => {
      this.showError(data.message, data.error);
    });

    this.dbManager.on("queryComplete", (data) => {
      this.displayQueryResult(data);
      this.updatePerformanceStats(data.stats);
    });

    this.dbManager.on("log", (data) => {
      this.addLogEntry(data);
    });
  }

  /**
   * Show the application after initialization
   */
  showApp() {
    this.elements.loading.classList.add("hidden");
    this.elements.app.classList.remove("hidden");
    this.addLogEntry({
      level: "success",
      message: "Application initialized successfully",
    });
  }

  /**
   * Update connection status indicator
   */
  updateConnectionStatus(connected, filename = "") {
    const status = this.elements.connectionStatus;
    const dbName = this.elements.dbName;

    if (!status) return;

    if (connected) {
      status.classList.remove("disconnected");
      status.classList.add("connected");
      const statusText = status.querySelector(".status-text");
      if (statusText) {
        statusText.textContent = "Connected";
      }
      if (dbName) {
        dbName.textContent = `Database: ${filename || "In-memory"}`;
      }
    } else {
      status.classList.remove("connected");
      status.classList.add("disconnected");
      const statusText = status.querySelector(".status-text");
      if (statusText) {
        statusText.textContent = "Disconnected";
      }
      if (dbName) {
        dbName.textContent = "Database: Not loaded";
      }
    }
  }

  /**
   * Execute SQL from the input textarea
   */
  async executeSql() {
    const sql = this.elements.sqlInput.value.trim();
    if (!sql) {
      this.showError("Please enter SQL commands to execute");
      return;
    }

    this.setButtonLoading(this.elements.executeSql, true);

    try {
      const options = {
        rowMode: this.elements.rowMode.value,
        autoCommit: this.elements.autoCommit.checked,
      };

      await this.dbManager.executeSQL(sql, options);
    } catch (error) {
      this.showError("SQL execution failed", error.message);
    } finally {
      this.setButtonLoading(this.elements.executeSql, false);
    }
  }

  /**
   * Clear SQL input
   */
  clearSql() {
    this.elements.sqlInput.value = "";
    this.elements.sqlInput.focus();
  }

  /**
   * Create sample data
   */
  async createSampleData() {
    this.setButtonLoading(this.elements.createSampleData, true);

    try {
      await this.dbManager.createSampleData();
      this.refreshSchema();
    } catch (error) {
      this.showError("Failed to create sample data", error.message);
    } finally {
      this.setButtonLoading(this.elements.createSampleData, false);
    }
  }

  /**
   * Run performance test
   */
  async runPerformanceTest() {
    this.setButtonLoading(this.elements.runPerformanceTest, true);

    try {
      const results = await this.dbManager.runPerformanceTest();
      this.displayPerformanceTestResults(results);
    } catch (error) {
      this.showError("Performance test failed", error.message);
    } finally {
      this.setButtonLoading(this.elements.runPerformanceTest, false);
    }
  }

  /**
   * Test transactions
   */
  async testTransactions() {
    this.setButtonLoading(this.elements.testTransactions, true);

    try {
      const results = await this.dbManager.testTransactions();
      this.displayTransactionTestResults(results);
    } catch (error) {
      this.showError("Transaction test failed", error.message);
    } finally {
      this.setButtonLoading(this.elements.testTransactions, false);
    }
  }

  /**
   * Export database
   */
  async exportDatabase() {
    this.setButtonLoading(this.elements.exportDb, true);

    try {
      const result = await this.dbManager.exportDatabase();
      this.downloadFile(result.byteArray, result.filename, result.mimetype);
    } catch (error) {
      this.showError("Database export failed", error.message);
    } finally {
      this.setButtonLoading(this.elements.exportDb, false);
    }
  }

  /**
   * Clear database
   */
  async clearDatabase() {
    if (
      !confirm(
        "Are you sure you want to clear all data from the database? This action cannot be undone."
      )
    ) {
      return;
    }

    this.setButtonLoading(this.elements.clearDb, true);

    try {
      await this.dbManager.clearDatabase();
      this.clearResults();
      this.refreshSchema();
    } catch (error) {
      this.showError("Failed to clear database", error.message);
    } finally {
      this.setButtonLoading(this.elements.clearDb, false);
    }
  }

  /**
   * Display query result in the results panel
   */
  displayQueryResult(data) {
    const container = this.elements.resultsContainer;

    // Clear placeholder if present
    const placeholder = container.querySelector(".results-placeholder");
    if (placeholder) {
      placeholder.remove();
    }

    const resultDiv = document.createElement("div");
    resultDiv.className = "query-result";

    // Create header
    const header = document.createElement("div");
    header.className = "result-header";
    header.innerHTML = `
            <div class="result-sql">${this.escapeHtml(
              data.sql.substring(0, 100)
            )}${data.sql.length > 100 ? "..." : ""}</div>
            <div class="result-time">${data.executionTime.toFixed(2)}ms</div>
        `;
    resultDiv.appendChild(header);

    // Display results
    if (data.result.resultRows && data.result.resultRows.length > 0) {
      const table = this.createResultTable(
        data.result.resultRows,
        data.result.columnNames
      );
      resultDiv.appendChild(table);
    } else if (data.result.changeCount !== undefined) {
      const info = document.createElement("div");
      info.className = "result-info";
      info.textContent = `${data.result.changeCount} row(s) affected`;
      resultDiv.appendChild(info);
    }

    container.appendChild(resultDiv);

    if (this.autoScroll) {
      container.scrollTop = container.scrollHeight;
    }
  }

  /**
   * Create result table from data
   */
  createResultTable(rows, columns) {
    const table = document.createElement("table");
    table.className = "result-table";

    // Create header
    if (columns && columns.length > 0) {
      const thead = document.createElement("thead");
      const headerRow = document.createElement("tr");

      columns.forEach((column) => {
        const th = document.createElement("th");
        th.textContent = column;
        headerRow.appendChild(th);
      });

      thead.appendChild(headerRow);
      table.appendChild(thead);
    }

    // Create body
    const tbody = document.createElement("tbody");

    rows.forEach((row) => {
      const tr = document.createElement("tr");

      if (Array.isArray(row)) {
        row.forEach((cell) => {
          const td = document.createElement("td");
          td.textContent = cell === null ? "NULL" : String(cell);
          tr.appendChild(td);
        });
      } else if (typeof row === "object") {
        Object.values(row).forEach((cell) => {
          const td = document.createElement("td");
          td.textContent = cell === null ? "NULL" : String(cell);
          tr.appendChild(td);
        });
      } else {
        const td = document.createElement("td");
        td.textContent = row === null ? "NULL" : String(row);
        tr.appendChild(td);
      }

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    return table;
  }

  /**
   * Clear results panel
   */
  clearResults() {
    const container = this.elements.resultsContainer;
    container.innerHTML =
      '<div class="results-placeholder">Execute SQL commands to see results here...</div>';
  }

  /**
   * Refresh database schema
   */
  async refreshSchema() {
    try {
      const schema = await this.dbManager.getSchema();
      this.displaySchema(schema);
    } catch (error) {
      // Schema might not be available yet
      console.log("Schema not available:", error.message);
    }
  }

  /**
   * Display database schema
   */
  displaySchema(schema) {
    const container = this.elements.schemaContainer;

    if (!schema || Object.keys(schema).length === 0) {
      container.innerHTML =
        '<div class="schema-placeholder">No tables found. Create some tables to explore the schema.</div>';
      return;
    }

    container.innerHTML = "";

    Object.keys(schema).forEach((type) => {
      if (!schema[type] || schema[type].length === 0) return;

      const section = document.createElement("div");
      section.className = "schema-section";

      const title = document.createElement("h4");
      title.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)}s`;
      title.className = "schema-title";
      section.appendChild(title);

      schema[type].forEach((item) => {
        const itemDiv = document.createElement("div");
        itemDiv.className = "schema-item";

        const itemName = document.createElement("div");
        itemName.className = "schema-item-name";
        itemName.textContent = item.name;
        itemDiv.appendChild(itemName);

        if (item.columns) {
          const columnsDiv = document.createElement("div");
          columnsDiv.className = "schema-columns";

          item.columns.forEach((col) => {
            const colDiv = document.createElement("div");
            colDiv.className = "schema-column";
            colDiv.innerHTML = `
                            <span class="column-name">${col.name}</span>
                            <span class="column-type">${col.type}</span>
                            ${
                              col.primaryKey
                                ? '<span class="column-pk">PK</span>'
                                : ""
                            }
                            ${
                              col.notnull
                                ? '<span class="column-notnull">NOT NULL</span>'
                                : ""
                            }
                        `;
            columnsDiv.appendChild(colDiv);
          });

          itemDiv.appendChild(columnsDiv);
        }

        section.appendChild(itemDiv);
      });

      container.appendChild(section);
    });
  }

  /**
   * Show indexes
   */
  async showIndexes() {
    try {
      const result = await this.dbManager.executeSQL(`
                SELECT name, tbl_name, sql 
                FROM sqlite_master 
                WHERE type='index' AND name NOT LIKE 'sqlite_%'
                ORDER BY tbl_name, name;
            `);

      this.displayQueryResult({
        sql: "SHOW INDEXES",
        result,
        executionTime: 0,
      });
    } catch (error) {
      this.showError("Failed to show indexes", error.message);
    }
  }

  /**
   * Update performance statistics
   */
  updatePerformanceStats(stats) {
    if (!stats) return;

    if (this.elements.totalQueries) {
      this.elements.totalQueries.textContent = stats.totalQueries || 0;
    }

    if (this.elements.avgTime) {
      const avgTime =
        stats.avgTime !== undefined
          ? stats.avgTime
          : stats.totalQueries > 0
          ? stats.totalTime / stats.totalQueries
          : 0;
      this.elements.avgTime.textContent = `${avgTime.toFixed(2)}ms`;
    }

    if (this.elements.lastTime) {
      const lastTime =
        stats.lastQueryTime !== undefined ? stats.lastQueryTime : 0;
      this.elements.lastTime.textContent = `${lastTime.toFixed(2)}ms`;
    }

    if (this.elements.rowsAffected) {
      this.elements.rowsAffected.textContent = stats.rowsAffected || 0;
    }
  }

  /**
   * Display performance test results
   */
  displayPerformanceTestResults(results) {
    const resultDiv = document.createElement("div");
    resultDiv.className = "performance-results";
    resultDiv.innerHTML = `
            <h4>Performance Test Results</h4>
            <div class="perf-stats">
                <div class="perf-stat">
                    <span class="perf-label">Total Time:</span>
                    <span class="perf-value">${results.totalTime}ms</span>
                </div>
                <div class="perf-stat">
                    <span class="perf-label">Insert Time:</span>
                    <span class="perf-value">${results.insertTime}ms</span>
                </div>
                <div class="perf-stat">
                    <span class="perf-label">Select Time:</span>
                    <span class="perf-value">${results.selectTime}ms</span>
                </div>
                <div class="perf-stat">
                    <span class="perf-label">Complex Query Time:</span>
                    <span class="perf-value">${results.complexTime}ms</span>
                </div>
                <div class="perf-stat">
                    <span class="perf-label">Records Processed:</span>
                    <span class="perf-value">${results.recordsProcessed}</span>
                </div>
                <div class="perf-stat">
                    <span class="perf-label">Throughput:</span>
                    <span class="perf-value">${results.throughput} records/sec</span>
                </div>
            </div>
        `;

    const container = this.elements.resultsContainer;
    const placeholder = container.querySelector(".results-placeholder");
    if (placeholder) {
      placeholder.remove();
    }

    container.appendChild(resultDiv);

    if (this.autoScroll) {
      container.scrollTop = container.scrollHeight;
    }
  }

  /**
   * Display transaction test results
   */
  displayTransactionTestResults(results) {
    const resultDiv = document.createElement("div");
    resultDiv.className = "transaction-results";
    resultDiv.innerHTML = `
            <h4>Transaction Test Results</h4>
            <div class="transaction-stats">
                <div class="transaction-stat">
                    <span class="transaction-label">Commit Test:</span>
                    <span class="transaction-value ${
                      results.commitTest ? "success" : "failed"
                    }">
                        ${results.commitTest ? "✓ Passed" : "✗ Failed"}
                    </span>
                </div>
                <div class="transaction-stat">
                    <span class="transaction-label">Rollback Test:</span>
                    <span class="transaction-value ${
                      results.rollbackTest ? "success" : "failed"
                    }">
                        ${results.rollbackTest ? "✓ Passed" : "✗ Failed"}
                    </span>
                </div>
            </div>
        `;

    const container = this.elements.resultsContainer;
    const placeholder = container.querySelector(".results-placeholder");
    if (placeholder) {
      placeholder.remove();
    }

    container.appendChild(resultDiv);

    if (this.autoScroll) {
      container.scrollTop = container.scrollHeight;
    }
  }

  /**
   * Add log entry
   */
  addLogEntry(data) {
    const container = this.elements.logContainer;

    // Remove welcome message if present
    const welcome = container.querySelector(".log-entry");
    if (
      welcome &&
      welcome.querySelector(".log-message").textContent.includes("Welcome")
    ) {
      welcome.remove();
    }

    const entry = document.createElement("div");
    entry.className = `log-entry log-${data.level}`;
    entry.setAttribute("data-level", data.level);

    const time = new Date().toLocaleTimeString();
    entry.innerHTML = `
            <span class="log-time">${time}</span>
            <span class="log-message">${this.escapeHtml(data.message)}</span>
        `;

    container.appendChild(entry);

    // Apply current filter
    this.filterLogEntries();

    // Auto scroll to bottom
    container.scrollTop = container.scrollHeight;

    // Limit log entries to prevent memory issues
    const entries = container.querySelectorAll(".log-entry");
    if (entries.length > 1000) {
      entries[0].remove();
    }
  }

  /**
   * Clear log entries
   */
  clearLog() {
    const container = this.elements.logContainer;
    container.innerHTML = `
            <div class="log-entry log-info">
                <span class="log-time">--:--:--</span>
                <span class="log-message">Log cleared</span>
            </div>
        `;
  }

  /**
   * Filter log entries by level
   */
  filterLogEntries() {
    const entries = this.elements.logContainer.querySelectorAll(
      ".log-entry[data-level]"
    );

    entries.forEach((entry) => {
      const level = entry.getAttribute("data-level");
      const shouldShow =
        this.currentLogLevel === "all" || level === this.currentLogLevel;
      entry.style.display = shouldShow ? "flex" : "none";
    });
  }

  /**
   * Show error dialog
   */
  showError(message, details = null) {
    this.elements.errorMessage.textContent = message;

    if (details) {
      this.elements.errorDetails.textContent =
        typeof details === "string"
          ? details
          : JSON.stringify(details, null, 2);
      this.elements.showErrorDetails.style.display = "inline-flex";
    } else {
      this.elements.errorDetails.textContent = "";
      this.elements.showErrorDetails.style.display = "none";
    }

    this.elements.errorDetails.classList.add("hidden");
    this.elements.errorDialog.classList.remove("hidden");

    // Also add to log
    this.addLogEntry({
      level: "error",
      message:
        message +
        (details
          ? ": " +
            (typeof details === "string"
              ? details
              : details.message || "Unknown error")
          : ""),
    });
  }

  /**
   * Hide error dialog
   */
  hideErrorDialog() {
    this.elements.errorDialog.classList.add("hidden");
  }

  /**
   * Toggle error details visibility
   */
  toggleErrorDetails() {
    this.elements.errorDetails.classList.toggle("hidden");
  }

  /**
   * Hide feature showcase
   */
  hideFeatureShowcase() {
    this.elements.featureShowcase.classList.add("hidden");
  }

  /**
   * Start demo tour
   */
  startDemoTour() {
    this.hideFeatureShowcase();

    // Set some sample SQL
    this.elements.sqlInput.value = `-- Welcome to SQLite WASM Demo!
-- Try running these sample queries:

-- 1. Create a simple table
CREATE TABLE demo (id INTEGER PRIMARY KEY, name TEXT, value INTEGER);

-- 2. Insert some data
INSERT INTO demo (name, value) VALUES 
    ('First Item', 100),
    ('Second Item', 200),
    ('Third Item', 300);

-- 3. Query the data
SELECT * FROM demo ORDER BY value DESC;`;

    this.elements.sqlInput.focus();

    this.addLogEntry({
      level: "info",
      message:
        "Demo tour started! Execute the sample SQL to see SQLite WASM in action.",
    });
  }

  /**
   * Set button loading state
   */
  setButtonLoading(button, loading) {
    if (loading) {
      button.disabled = true;
      button.textContent = button.textContent.replace(/^[^\s]+/, "Loading...");
    } else {
      button.disabled = false;
      // Reset text based on button ID
      const buttonTexts = {
        "execute-sql": "Execute SQL",
        "create-sample-data": "Create Sample Tables",
        "run-performance-test": "Performance Test",
        "test-transactions": "Test Transactions",
        "export-db": "Export Database",
        "clear-db": "Clear Database",
      };

      if (buttonTexts[button.id]) {
        button.textContent = buttonTexts[button.id];
      }
    }
  }

  /**
   * Download file
   */
  downloadFile(data, filename, mimetype) {
    const blob = new Blob([data], { type: mimetype });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.addLogEntry({
      level: "success",
      message: `Database exported as ${filename}`,
    });
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// Export for use in other modules
window.UIController = UIController;
