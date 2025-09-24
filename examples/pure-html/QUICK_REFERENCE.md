# SQLite WASM Quick Reference

A concise reference guide for developers using the SQLite WASM API.

## Quick Start

```javascript
// 1. Initialize the application
const app = new SQLiteWASMDemo();
await app.initialize();

// 2. Get database manager
const db = app.databaseManager;

// 3. Execute SQL
const result = await db.executeSQL("SELECT 1 as test");
console.log(result.resultRows); // [[1]]
```

## Core API Methods

| Method                        | Purpose                 | Returns                |
| ----------------------------- | ----------------------- | ---------------------- |
| `initialize()`                | Start the SQLite worker | `Promise<void>`        |
| `executeSQL(sql, options)`    | Run SQL commands        | `Promise<QueryResult>` |
| `getSchema()`                 | Get database structure  | `Promise<SchemaInfo>`  |
| `openDatabase(name, options)` | Open/create database    | `Promise<DbInfo>`      |
| `exportDatabase()`            | Export to file          | `Promise<ExportData>`  |

## SQL Execution Options

```javascript
await db.executeSQL(sql, {
    bind: [value1, value2],     // Parameter binding
    rowMode: 'object',          // 'array' | 'object' | 'stmt'
    resultRows: [],             // Collect results here
    columnNames: [],            // Collect column names
    callback: (row) => {...}    // Process row by row
});
```

## Event System

```javascript
// Listen for events
db.on("queryComplete", (data) => {
    console.log(`Query took ${data.executionTime}ms`);
});

db.on("error", (error) => {
    console.error("Database error:", error.message);
});

// Available events: connect, disconnect, queryComplete, error, log
```

## Common SQL Patterns

### CREATE TABLE

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### INSERT with Parameters

```javascript
await db.executeSQL("INSERT INTO users (name, email) VALUES (?, ?)", {
    bind: ["John Doe", "john@example.com"],
});
```

### SELECT with JOIN

```javascript
const result = await db.executeSQL(
    `
    SELECT u.name, COUNT(p.id) as post_count
    FROM users u
    LEFT JOIN posts p ON u.id = p.user_id
    GROUP BY u.id
`,
    { rowMode: "object" }
);
```

### Transactions

```javascript
await db.executeSQL("BEGIN TRANSACTION");
try {
    await db.executeSQL("INSERT INTO ...");
    await db.executeSQL("UPDATE ...");
    await db.executeSQL("COMMIT");
} catch (error) {
    await db.executeSQL("ROLLBACK");
    throw error;
}
```

## Storage Options

| Option          | Description                    | Persistence |
| --------------- | ------------------------------ | ----------- |
| `':memory:'`    | RAM-based, fastest             | No          |
| `'filename.db'` | OPFS storage (modern browsers) | Yes         |
| `vfs: 'memdb'`  | In-memory with shared access   | No          |

## Performance Tips

```javascript
// 1. Use indexes for frequent queries
await db.executeSQL("CREATE INDEX idx_email ON users(email)");

// 2. Use transactions for bulk operations
await db.executeSQL("BEGIN");
for (const item of items) {
    await db.executeSQL("INSERT INTO ...", { bind: [item] });
}
await db.executeSQL("COMMIT");

// 3. Use row callbacks for large datasets
await db.executeSQL("SELECT * FROM large_table", {
    callback: (row) => processRow(row), // Don't accumulate in memory
});
```

## Error Handling

```javascript
try {
    await db.executeSQL("SELECT * FROM nonexistent_table");
} catch (error) {
    if (error.message.includes("no such table")) {
        // Handle missing table
        await db.executeSQL("CREATE TABLE ...");
    }
}
```

## Browser Requirements

-   **WebAssembly**: Chrome 57+, Firefox 52+, Safari 11+
-   **Web Workers**: All modern browsers
-   **OPFS**: Chrome 86+, Firefox 111+ (Safari not supported)
-   **SharedArrayBuffer**: Requires COOP/COEP headers

## Server Setup

```python
# Minimal server setup (server.py example)
from http.server import HTTPServer, SimpleHTTPRequestHandler

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        super().end_headers()

HTTPServer(('', 8000), CORSRequestHandler).serve_forever()
```

## Debugging

```javascript
// Enable debug mode (localhost only)
if (location.hostname === "localhost") {
    db.on("log", console.log);

    // Inspect database state
    console.log("Stats:", db.getStats());
    console.log("Schema:", await db.getSchema());
}
```

## Common Gotchas

1. **Script loading order**: Load `database-manager.js` before `ui-controller.js` before `main.js`
2. **Parameter binding**: Always use `bind` parameter to prevent SQL injection
3. **Async operations**: Always await database operations
4. **Worker initialization**: Check worker is ready before executing SQL
5. **Memory management**: Use callbacks for large result sets

## File Structure

```
your-project/
├── index.html          # Main application
├── css/
│   └── styles.css      # Styling
├── js/
│   ├── main.js         # Application entry point
│   ├── database-manager.js  # Core SQLite API
│   └── ui-controller.js     # UI management
└── jswasm/
    ├── sqlite3-worker1.js   # SQLite worker
    └── sqlite3.wasm         # WebAssembly binary
```

## Example Application Structure

```javascript
class MyApp {
    constructor() {
        this.sqliteApp = null;
        this.db = null;
    }

    async init() {
        // Initialize SQLite WASM
        this.sqliteApp = new SQLiteWASMDemo();
        await this.sqliteApp.initialize();
        this.db = this.sqliteApp.databaseManager;

        // Set up event listeners
        this.db.on("error", (error) => this.handleError(error));

        // Create your schema
        await this.createSchema();
    }

    async createSchema() {
        await this.db.executeSQL(`
            CREATE TABLE IF NOT EXISTS my_table (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL
            )
        `);
    }

    handleError(error) {
        console.error("Database error:", error);
        // Handle error appropriately
    }
}

// Usage
const app = new MyApp();
await app.init();
```

---

_For complete documentation, see [DOCUMENTATION.md](./DOCUMENTATION.md) and [UML_DIAGRAMS.md](./UML_DIAGRAMS.md)_
