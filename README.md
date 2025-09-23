# Web-SQLite

A TypeScript-first runtime library for SQLite WebAssembly with OPFS persistence and functional API.

## Features

- 🎯 **Simple API**: Only 2 methods - `exec()` and `close()`
- 🗃️ **OPFS Persistence**: Reliable storage via Origin Private File System
- ⚡ **Worker-Based**: Non-blocking execution using Web Workers
- 🔧 **TypeScript**: Full TypeScript support with excellent type inference
- 🎨 **Functional**: Pure functions, immutable data, composable operations
- 📦 **Self-Contained**: No runtime dependencies

## Browser Support

| Feature             | Chrome | Safari | Edge | Notes                    |
| ------------------- | ------ | ------ | ---- | ------------------------ |
| **Minimum Version** | 86+    | 15.2+  | 86+  | OPFS + Workers required  |
| Web Workers         | ✅     | ✅     | ✅   | Required for execution   |
| OPFS                | ✅     | ✅     | ✅   | Required for persistence |
| WebAssembly         | ✅     | ✅     | ✅   | SQLite runtime           |

**Note:** Firefox is not supported due to lack of OPFS.

## Installation

```bash
npm install web-sqlite
# or
pnpm add web-sqlite
# or
yarn add web-sqlite
```

## Quick Start

```typescript
import webSqlite from "web-sqlite";

// Open database with OPFS persistence
const db = await webSqlite("my-app.sqlite3");

// Create table
await db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE
  )
`);

// Insert data with positional parameters
await db.exec("INSERT INTO users (name, email) VALUES (?, ?)", [
    "John Doe",
    "john@example.com",
]);

// Insert data with named parameters
await db.exec("INSERT INTO users (name, email) VALUES ($name, $email)", {
    name: "Jane Smith",
    email: "jane@example.com",
});

// Query data with type safety
type User = { id: number; name: string; email: string };
const users = await db.exec<User[]>("SELECT * FROM users");
console.log(users);

// Close database
await db.close();
```

## API Reference

### `webSqlite(filename: string): Promise<Database>`

Opens a SQLite database with OPFS persistence.

- **filename**: Name of the database file (stored in OPFS)
- **Returns**: Promise resolving to Database interface

### `Database.exec<T>(sql: string, parameters?: SqlParameters): Promise<T>`

Execute a SQL statement with optional parameter binding.

- **sql**: SQL statement to execute
- **parameters**: Optional parameters (array for positional, object for named)
- **Returns**: Promise resolving to query results

### `Database.close(): Promise<void>`

Close the database connection and cleanup resources.

## Important Notes

### Security Headers Required

Web-SQLite's OPFS functionality requires specific security headers for SharedArrayBuffer support:

```
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

These headers enable cross-origin isolation, which is required for OPFS persistence.

### Browser Support

- Chrome 86+
- Safari 15.2+
- Edge 86+

No special headers or configuration needed for basic functionality!

## Development

### Running Examples

1. Build the project:

    ```bash
    pnpm build
    ```

2. Start the example server with required security headers:

    ```bash
    pnpm start:examples:secure
    ```

3. Open http://localhost:7411/examples/ in Chrome 86+ or Safari 15.2+

    ```

    ```

### Building from Source

```bash
# Install dependencies
pnpm install

# Build the library
pnpm build

# Watch mode for development
pnpm build:dev
```

## License

MIT © wuchuheng
