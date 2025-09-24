A TypeScript-first runtime library for SQLite WebAssembly with OPFS persistence and functional API.

## Features

- 🎯 **Type-Safe API**: 6 specialized methods for different database operations
- 🗃️ **OPFS Persistence**: Reliable storage via Origin Private File System
- ⚡ **Worker-Based**: Non-blocking execution using Web Workers
- 🔧 **TypeScript**: Full TypeScript support with excellent type inference
- 🎨 **Functional**: Pure functions, immutable data, composable operations
- 📦 **Self-Contained**: No runtime dependencies

## Architecture Overview

Web-SQLite uses a multi-threaded architecture with clear separation between the main thread (UI) and worker thread (database operations). This design ensures non-blocking database operations while providing a type-safe API.

```mermaid
graph TB
    subgraph "Main Thread (UI)"
        A[Application Code] --> B[Web-SQLite API]
        B --> C[Database Interface]
        C --> D[Worker Manager]
    end

    subgraph "Worker Thread"
        E[SQLite3 Worker] --> F[SQLite3 WebAssembly]
        F --> G[OPFS Storage]
    end

    D <--> E

    subgraph "Storage Layer"
        G --> H[Origin Private File System]
        H --> I[Browser File System]
    end

    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style E fill:#fff3e0
    style F fill:#ffebee
    style G fill:#e8f5e8
```

### Communication Flow

```mermaid
sequenceDiagram
    participant App as Application
    participant API as Web-SQLite API
    participant Worker as Worker Manager
    participant SQLite as SQLite Worker
    participant OPFS as OPFS Storage

    App->>API: webSqlite('db.sqlite3')
    API->>Worker: createSQLiteWorker()
    Worker->>SQLite: new Worker()
    SQLite->>SQLite: Initialize SQLite3 WASM
    SQLite->>OPFS: Mount OPFS VFS
    OPFS-->>SQLite: VFS Ready
    SQLite-->>Worker: Worker Ready
    Worker-->>API: Promiser Function
    API->>SQLite: openDatabase(filename)
    SQLite->>OPFS: Open/Create File
    OPFS-->>SQLite: File Handle
    SQLite-->>API: Database Ready
    API-->>App: Database Interface

    Note over App,OPFS: Database is now ready for operations

    App->>API: db.query('SELECT * FROM users')
    API->>SQLite: exec(sql, params)
    SQLite->>OPFS: Read Data
    OPFS-->>SQLite: File Data
    SQLite-->>API: Query Results
    API-->>App: Typed Results
```

### Type-Safe API Design

```mermaid
classDiagram
    class Database {
        +query~T~(sql, params): Promise~T[]~
        +queryOne~T~(sql, params): Promise~T | null~
        +execute(sql, params): Promise~ModificationResult~
        +run(sql, params): Promise~void~
        +transaction(statements): Promise~Array~unknown~~
        +close(): Promise~void~
    }

    class ModificationResult {
        +changes: number
        +lastInsertRowid: number | null
    }

    class TransactionStatement {
        +sql: string
        +parameters?: SqlParameters
        +type?: 'query' | 'execute' | 'run'
    }

    class SqlParameters {
        <<type>>
        ReadonlyArray~SqlValue~ | Record~string, SqlValue~
    }

    class WebSQLiteError {
        +message: string
        +cause?: Error
    }

    Database --> ModificationResult
    Database --> TransactionStatement
    Database --> SqlParameters
    Database --> WebSQLiteError
```

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

// Create table using run() for DDL operations
await db.run(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE
  )
`);

// Insert data using execute() for modifications
const result = await db.execute(
    "INSERT INTO users (name, email) VALUES (?, ?)",
    ["John Doe", "john@example.com"],
);
console.log(`Inserted user with ID: ${result.lastInsertRowid}`);

// Insert with named parameters
await db.execute("INSERT INTO users (name, email) VALUES ($name, $email)", {
    name: "Jane Smith",
    email: "jane@example.com",
});

// Query data with type safety using query()
type User = { id: number; name: string; email: string };
const users = await db.query<User>("SELECT * FROM users");
console.log(`Found ${users.length} users`);

// Get single user with queryOne()
const user = await db.queryOne<User>("SELECT * FROM users WHERE id = ?", [1]);
if (user) {
    console.log(`User: ${user.name}`);
}

// Use transactions for atomic operations
await db.transaction([
    {
        sql: "INSERT INTO users (name, email) VALUES (?, ?)",
        parameters: ["Alice", "alice@example.com"],
        type: "execute",
    },
    {
        sql: "UPDATE users SET name = ? WHERE id = ?",
        parameters: ["Alice Johnson", 1],
        type: "execute",
    },
]);

// Close database
await db.close();
```

## API Reference

### `webSqlite(filename: string): Promise<Database>`

Opens a SQLite database with OPFS persistence.

- **filename**: Name of the database file (stored in OPFS)
- **Returns**: Promise resolving to Database interface with type-safe methods

### Database Interface Methods

#### `Database.query<T>(sql: string, parameters?: SqlParameters): Promise<T[]>`

Execute SELECT queries and return typed results as arrays.

- **sql**: SELECT statement
- **parameters**: Optional parameters (array for positional, object for named)
- **Returns**: Promise resolving to array of rows matching type T

```typescript
interface User {
    id: number;
    name: string;
}
const users = await db.query<User>(
    "SELECT id, name FROM users WHERE active = ?",
    [true],
);
```

#### `Database.queryOne<T>(sql: string, parameters?: SqlParameters): Promise<T | null>`

Execute a SELECT query and return the first row.

- **sql**: SELECT statement
- **parameters**: Optional parameters
- **Returns**: Promise resolving to first row or null if no results

```typescript
const user = await db.queryOne<User>("SELECT * FROM users WHERE id = ?", [1]);
if (user) console.log(user.name);
```

#### `Database.execute(sql: string, parameters?: SqlParameters): Promise<ModificationResult>`

Execute INSERT, UPDATE, DELETE statements.

- **sql**: Data modification statement (INSERT, UPDATE, DELETE)
- **parameters**: Optional parameters
- **Returns**: Promise resolving to modification result with change count and insert ID

```typescript
const result = await db.execute("INSERT INTO users (name) VALUES (?)", [
    "John",
]);
console.log(`Inserted ${result.changes} rows, ID: ${result.lastInsertRowid}`);
```

#### `Database.run(sql: string, parameters?: SqlParameters): Promise<void>`

Execute DDL statements (CREATE, DROP, ALTER, etc.) and utility operations.

- **sql**: DDL or utility statement
- **parameters**: Optional parameters
- **Returns**: Promise resolving to void

```typescript
await db.run("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)");
await db.run("CREATE INDEX idx_users_name ON users(name)");
```

#### `Database.transaction(statements: TransactionStatement[]): Promise<Array<unknown>>`

Execute multiple statements in a transaction atomically.

- **statements**: Array of statements with optional parameters and types
- **Returns**: Promise resolving to array of results from each statement

```typescript
const results = await db.transaction([
    {
        sql: "INSERT INTO users (name) VALUES (?)",
        parameters: ["Alice"],
        type: "execute",
    },
    { sql: "SELECT COUNT(*) as count FROM users", type: "query" },
]);
```

#### `Database.close(): Promise<void>`

Close the database connection and cleanup resources.

```typescript
await db.close();
```

### Types

```typescript
interface ModificationResult {
    changes: number;
    lastInsertRowid: number | null;
}

interface TransactionStatement {
    sql: string;
    parameters?: SqlParameters;
    type?: "query" | "execute" | "run";
}

type SqlParameters =
    | ReadonlyArray<SqlValue>
    | Readonly<Record<string, SqlValue>>;
type SqlValue =
    | string
    | number
    | bigint
    | boolean
    | null
    | Uint8Array
    | ArrayBufferView
    | Date;
```

## Internal Architecture

### Worker Thread Management

```mermaid
graph LR
    subgraph "Main Thread"
        A[webSqlite function] --> B[createSQLiteWorker]
        B --> C[Worker Manager]
        C --> D[Promiser Function]
    end

    subgraph "Worker Thread"
        E[sqlite3-worker1.js] --> F[SQLite3 WASM]
        F --> G[OPFS VFS Driver]
    end

    D <-.->|Message Passing| E
    G --> H[(OPFS Files)]

    style A fill:#e3f2fd
    style E fill:#fff3e0
    style F fill:#ffebee
    style H fill:#e8f5e8
```

### SQL Operation Routing

```mermaid
graph TD
    A[SQL Statement] --> B{Analyze SQL}

    B -->|SELECT| C[query/queryOne]
    B -->|INSERT/UPDATE/DELETE| D[execute]
    B -->|CREATE/DROP/ALTER| E[run]
    B -->|Multiple statements| F[transaction]

    C --> G["Return typed data T[]"]
    D --> H[Return ModificationResult]
    E --> I[Return void]
    F --> J["Return Array&lt;unknown&gt;"]

    subgraph "Worker Execution"
        K[Worker Request] --> L[SQLite3 WASM]
        L --> M[OPFS I/O]
        M --> N[Return Results]
    end

    G --> K
    H --> K
    I --> K
    J --> K

    style C fill:#e8f5e8
    style D fill:#fff3e0
    style E fill:#f3e5f5
    style F fill:#e1f5fe
```

### OPFS Integration Details

```mermaid
sequenceDiagram
    participant App as Application
    participant Worker as SQLite Worker
    participant WASM as SQLite3 WASM
    participant VFS as OPFS VFS
    participant OPFS as Browser OPFS

    App->>Worker: openDatabase('app.db')
    Worker->>WASM: sqlite3_open_v2() with OPFS VFS
    WASM->>VFS: xOpen(filename, flags)
    VFS->>OPFS: navigator.storage.getDirectory()
    OPFS->>VFS: DirectoryHandle
    VFS->>OPFS: getFileHandle('app.db', {create: true})
    OPFS->>VFS: FileHandle
    VFS->>OPFS: createSyncAccessHandle()
    OPFS->>VFS: SyncAccessHandle
    VFS->>WASM: File descriptor
    WASM->>Worker: Database opened
    Worker->>App: Success

    Note over App,OPFS: Subsequent operations use SyncAccessHandle for direct file I/O

    App->>Worker: query('SELECT * FROM table')
    Worker->>WASM: sqlite3_exec()
    WASM->>VFS: xRead(offset, length)
    VFS->>OPFS: read(offset, length)
    OPFS->>VFS: Data buffer
    VFS->>WASM: Data
    WASM->>Worker: Query results
    Worker->>App: Typed results
```

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

**Note:** Firefox is not supported due to lack of OPFS.

### Performance Characteristics

```mermaid
graph LR
    A[SQL Request] --> B[Message Serialization]
    B --> C[Worker Thread]
    C --> D[SQLite WASM]
    D --> E[OPFS I/O]
    E --> F[File System]

    F --> G[Results]
    G --> H[Worker Thread]
    H --> I[Message Deserialization]
    I --> J[Main Thread]

    style E fill:#ffebee
    style B fill:#fff3e0
    style I fill:#fff3e0

    K[Bottlenecks] --> L[Message Passing Overhead]
    K --> M[OPFS I/O Latency]
    K --> N[Serialization Cost]
```

**Performance Tips:**

- Use transactions for bulk operations
- Minimize message passing with batch operations
- OPFS provides near-native file I/O performance
- Worker thread prevents UI blocking

## Development

### Library Structure

```mermaid
graph TB
    subgraph "Public API Layer"
        A[main.ts] --> B[Database Interface]
        B --> C[Type Definitions]
    end

    subgraph "Execution Layer"
        D[exec.ts] --> E[SQL Analysis]
        E --> F[Operation Routing]
        F --> G[Worker Communication]
    end

    subgraph "Worker Management"
        H[worker.ts] --> I[Worker Creation]
        I --> J[Message Handling]
        J --> K[Promiser Function]
    end

    subgraph "SQLite Layer"
        L[sqlite3-worker1.js] --> M[SQLite3 WASM]
        M --> N[OPFS VFS]
        N --> O[File Operations]
    end

    A --> D
    D --> H
    H --> L

    style A fill:#e3f2fd
    style D fill:#f3e5f5
    style H fill:#fff3e0
    style L fill:#ffebee
```

### Running Examples

1. Build the project:

    ```bash
    pnpm build
    ```

2. Start the example server with required security headers:

    ```bash
    pnpm start:examples
    ```

3. Open http://localhost:7411/examples/ in Chrome 86+ or Safari 15.2+

The examples demonstrate:

- All 6 API methods with type safety
- OPFS persistence across page reloads
- Transaction handling
- Error management
- Browser feature detection

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
