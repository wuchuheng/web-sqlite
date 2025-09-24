# SQLite WASM Demo

A comprehensive demonstration of SQLite WebAssembly capabilities using Web Workers for non-blocking database operations.

## Features

🔄 **Web Workers Integration**: Non-blocking database operations using dedicated worker threads  
💾 **OPFS Storage**: Persistent storage using Origin Private File System  
🚀 **Full SQL Support**: Complete SQLite SQL syntax with joins, indexes, triggers, and more  
🔧 **Custom Functions**: Define JavaScript functions callable from SQL  
📊 **Multiple Row Modes**: Flexible result formats: arrays, objects, or raw statements  
🔒 **Transactions**: ACID transactions with rollback and savepoint support  
📈 **Performance Monitoring**: Real-time query performance statistics  
🗂️ **Schema Explorer**: Interactive database schema browser  
⚡ **Quick Actions**: Pre-built demonstrations and sample data  
🎨 **Modern UI**: Clean, responsive interface with dark theme support

## Getting Started

### Prerequisites

-   Modern web browser with WebAssembly support
-   Web server (required for WASM files - cannot run from `file://`)

### For OPFS Features (Recommended)

Your server needs to include these headers for full functionality:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

### Quick Setup

1. **Clone or download this repository**

2. **Start a web server**

    Using Python:

    ```bash
    # Python 3
    python -m http.server 8000

    # Python 2
    python -m SimpleHTTPServer 8000
    ```

    Using Node.js (with serve):

    ```bash
    npx serve .
    ```

    Using PHP:

    ```bash
    php -S localhost:8000
    ```

3. **Open in browser**

    Navigate to `http://localhost:8000`

## Architecture

### File Structure

```
/
├── index.html              # Main HTML page
├── css/
│   └── styles.css         # Comprehensive styling
├── js/
│   ├── main.js           # Application initialization
│   ├── database-manager.js # Database operations wrapper
│   └── ui-controller.js   # UI event handling
└── jswasm/               # SQLite WASM files
    ├── sqlite3-worker1.js
    ├── sqlite3.wasm
    └── ...
```

### Components

-   **DatabaseManager**: Handles all SQLite operations via Web Worker
-   **UIController**: Manages user interface and user interactions
-   **Main Application**: Coordinates components and handles lifecycle

## Usage Examples

### Basic SQL Execution

```sql
-- Create a table
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE
);

-- Insert data
INSERT INTO users (name, email) VALUES
    ('Alice Johnson', 'alice@example.com'),
    ('Bob Smith', 'bob@example.com');

-- Query data
SELECT * FROM users WHERE name LIKE '%Alice%';
```

### Advanced Features

```sql
-- Transactions
BEGIN TRANSACTION;
UPDATE users SET name = 'Alice Cooper' WHERE id = 1;
COMMIT;

-- Indexes
CREATE INDEX idx_users_email ON users(email);

-- Views
CREATE VIEW active_users AS
SELECT * FROM users WHERE email IS NOT NULL;
```

## API Reference

### DatabaseManager

```javascript
const db = new DatabaseManager();

// Initialize and connect
await db.initialize();
await db.openDatabase("mydb.sqlite3");

// Execute SQL
const result = await db.executeSQL("SELECT * FROM users");

// Get schema information
const schema = await db.getSchema();

// Export database
const exportData = await db.exportDatabase();
```

### UIController

```javascript
const ui = new UIController(databaseManager);

// Event handling is automatic
// Methods for programmatic control:
ui.showError("Custom error message");
ui.addLogEntry({ level: "info", message: "Custom log" });
ui.displayQueryResult(queryData);
```

## Browser Compatibility

### Required Features

-   ✅ WebAssembly
-   ✅ Web Workers
-   ✅ ES6+ JavaScript

### Optional Features

-   SharedArrayBuffer (for better performance)
-   OPFS (for persistent storage)
-   Cross-Origin Isolation (for security features)

### Tested Browsers

-   Chrome 90+
-   Firefox 89+
-   Safari 14+
-   Edge 90+

## Performance

The demo includes built-in performance testing that measures:

-   **Insert Performance**: Bulk insert operations
-   **Query Performance**: Complex SELECT queries
-   **Transaction Performance**: ACID transaction overhead
-   **Memory Usage**: JavaScript heap utilization

Typical performance metrics:

-   ~1000 records/second for bulk inserts
-   Sub-millisecond simple queries
-   Full ACID transaction support

## Development

### Adding Custom Features

1. **Database Operations**: Extend `DatabaseManager` class
2. **UI Components**: Add to `UIController` class
3. **Styling**: Modify `css/styles.css`

### Custom SQL Functions

```javascript
// In database-manager.js
await this.executeSQL(
    `
    SELECT custom_function(column) FROM table;
`,
    {
        customFunctions: {
            custom_function: (value) => {
                return value.toUpperCase();
            },
        },
    }
);
```

### Event System

```javascript
// Listen to database events
dbManager.on("queryComplete", (data) => {
    console.log("Query completed:", data);
});

dbManager.on("error", (error) => {
    console.error("Database error:", error);
});
```

## Troubleshooting

### Common Issues

**WASM not loading**

-   Ensure you're using a web server (not `file://`)
-   Check browser console for CORS errors

**OPFS not working**

-   Requires Cross-Origin Isolation headers
-   Only works in secure contexts (HTTPS/localhost)

**Performance issues**

-   Enable SharedArrayBuffer with proper headers
-   Use transactions for bulk operations
-   Consider indexes for large datasets

### Debug Mode

Open browser console to see detailed logging:

```javascript
// Access development helpers (localhost only)
window.sqliteWasmDemo.getStats();
window.dbManager.executeSQL("EXPLAIN QUERY PLAN SELECT * FROM users");
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Acknowledgments

-   SQLite team for the excellent WASM implementation
-   The SQLite project for the robust database engine
-   Web standards contributors for enabling WASM in browsers

---

**Note**: This is a demonstration application. For production use, consider additional security measures, error handling, and performance optimizations based on your specific requirements.
