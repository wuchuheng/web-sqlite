# Web-SQLite Library - Software Design Document

**Version:** 1.0  
**Date:** September 22, 2025  
**Author:** Development Team  
**Status:** Draft

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Overview](#2-project-overview)
3. [System Architecture](#3-system-architecture)
4. [Detailed Design](#4-detailed-design)
5. [API Specification](#5-api-specification)
6. [Implementation Strategy](#6-implementation-strategy)
7. [Performance Considerations](#7-performance-considerations)
8. [Security & Reliability](#8-security--reliability)
9. [Testing Strategy](#9-testing-strategy)
10. [Deployment & Distribution](#10-deployment--distribution)
11. [Future Roadmap](#11-future-roadmap)

---

## 1. Executive Summary

### 1.1 Project Goals

Web-SQLite is a TypeScript-first runtime library that provides a simple, functional API for working with SQLite databases compiled to WebAssembly in browser environments. The library emphasizes:

-   **Simplicity**: Minimal API surface with just `exec` and `close` methods
-   **Functional Programming**: Pure functions, immutable data, and composable operations
-   **OPFS Persistence**: Reliable persistent storage via Origin Private File System
-   **Worker-Based**: Asynchronous execution via Web Workers to prevent UI blocking

### 1.2 Key Success Metrics

-   **API Simplicity**: Only 2 core methods (`exec`, `close`)
-   **Bundle Size**: Core library <30KB gzipped
-   **Performance**: <10ms execution time for simple queries
-   **Compatibility**: Chrome 86+, Safari 15.2+ (OPFS + Workers required)

---

## 2. Project Overview

### 2.1 Problem Statement

Current SQLite WASM solutions lack:

-   Simple, functional APIs (most are object-oriented and complex)
-   Reliable persistent storage that works across browser sessions
-   Non-blocking execution patterns
-   Clean TypeScript integration

### 2.2 Solution Approach

A minimal, functional architecture that:

-   Exposes only two methods: `exec()` and `close()`
-   Uses OPFS Worker strategy exclusively for reliability
-   Follows functional programming principles
-   Provides excellent TypeScript experience

### 2.3 Target Users

-   **Frontend Developers**: Building data-intensive web applications with simple needs
-   **PWA Developers**: Requiring offline-capable database solutions
-   **Functional Programming Advocates**: Preferring pure functions over OOP patterns

---

## 3. System Architecture

### 3.1 Functional Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Functional API Layer                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   webSqlite()   │  │   db.exec()     │  │  db.close()  │ │
│  │   (factory)     │  │   (pure fn)     │  │  (cleanup)   │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                Worker Communication Layer                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Promise-based Worker Messages                      │   │
│  │  • SQL Execution  • Parameter Binding               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                SQLite OPFS Worker                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  • sqlite3-worker1.js  • OPFS VFS                   │   │
│  │  • sqlite3.wasm        • Message Handling           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Functional Programming Principles

#### 3.2.1 Pure Functions

```typescript
// Factory function - creates database connection
const webSqlite = (filename: string): Promise<Database> => { ... }

// Pure execution function - no side effects beyond SQL execution
const exec = <T>(sql: string, parameters?: SqlParameters): Promise<T> => { ... }

// Cleanup function - properly releases resources
const close = (): Promise<void> => { ... }
```

#### 3.2.2 Immutable Data Flow

```typescript
// Input → Processing → Output (no mutation)
const processQuery = (sql: string, params?: SqlParameters) =>
    validateSql(sql)
        .then(bindParameters(params))
        .then(executeInWorker)
        .then(transformResult);
```

### 3.3 Single Strategy: OPFS Worker

No strategy pattern complexity - just one reliable implementation:

-   **OPFS Worker**: The only execution strategy
-   **No Fallbacks**: If OPFS + Workers not available, fail fast with clear error
-   **No Runtime Detection**: Assume modern browser environment

### 3.4 OPFS Implementation Details

#### 3.4.1 OPFS Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Main Thread                              │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │   webSqlite()   │  │   db.exec()     │                   │
│  │   factory       │  │   calls         │                   │
│  └─────────────────┘  └─────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
                                │ Worker Messages
┌─────────────────────────────────────────────────────────────┐
│                sqlite3-worker1.js                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  • SQLite WASM Runtime                              │   │
│  │  • OPFS VFS Integration                             │   │
│  │  • Message Handling                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                                │ OPFS API Calls
┌─────────────────────────────────────────────────────────────┐
│              sqlite3-opfs-async-proxy.js                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  • Asynchronous OPFS File Operations               │   │
│  │  • SharedArrayBuffer Communication                  │   │
│  │  • File Handle Management                          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                                │ File System Access
┌─────────────────────────────────────────────────────────────┐
│                    Browser OPFS                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  • Origin-Private File System                       │   │
│  │  • Persistent Storage                               │   │
│  │  • app.sqlite3 Database File                        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

#### 3.4.2 File Roles in OPFS Implementation

| File                          | Purpose                                       | Developer Notes                        |
| ----------------------------- | --------------------------------------------- | -------------------------------------- |
| `sqlite3-worker1.js`          | Main worker containing SQLite WASM + OPFS VFS | Entry point for worker-based execution |
| `sqlite3-worker1-promiser.js` | Promise wrapper for worker messages           | Provides async/await interface         |
| `sqlite3.js`                  | Complete SQLite runtime with OPFS support     | Contains `sqlite3.oo1.OpfsDb` class    |
| `sqlite3.wasm`                | SQLite WebAssembly binary                     | Core database engine                   |
| `sqlite3-opfs-async-proxy.js` | OPFS async operations worker                  | Handles file I/O behind the scenes     |

#### 3.4.3 OPFS vs Other Storage Options

| Storage Type | Persistence         | Performance  | Browser Support          | Our Choice      |
| ------------ | ------------------- | ------------ | ------------------------ | --------------- |
| **OPFS**     | ✅ True persistence | ⚡ High      | Chrome 86+, Safari 15.2+ | ✅ **Selected** |
| Memory       | ❌ Session only     | ⚡ Highest   | All browsers             | ❌ Not suitable |
| IndexedDB    | ✅ Persistent       | 🐌 Slower    | All browsers             | ❌ Not used     |
| localStorage | ✅ Persistent       | 🐌 Very slow | All browsers             | ❌ Not used     |

---

## 4. Detailed Design

### 4.1 Core Functional Components

#### 4.1.1 Factory Function

```typescript
// Main entry point - pure factory function
const webSqlite = async (filename: string): Promise<Database> => {
    const worker = createSQLiteWorker();
    const promiser = await initializeWorkerPromiser(worker);

    // Open database in OPFS
    await promiser("open", {
        filename,
        vfs: "opfs",
    });

    return createDatabaseInterface(promiser);
};

// Helper function - creates database interface
const createDatabaseInterface = (
    promiser: WorkerPromiseFunction
): Database => ({
    exec: createExecFunction(promiser),
    close: createCloseFunction(promiser),
});
```

#### 4.1.2 Execution Function

```typescript
// Pure execution function
const createExecFunction =
    (promiser: WorkerPromiseFunction) =>
    async <T>(sql: string, parameters?: SqlParameters): Promise<T> => {
        // Input validation
        validateSqlInput(sql, parameters);

        // Parameter binding
        const bindings = bindParameters(parameters);

        // Execute query
        const result = await promiser("exec", {
            sql,
            bind: bindings,
            resultRows: [],
            rowMode: "object",
        });

        // Transform result
        return transformQueryResult<T>(result);
    };
```

#### 4.1.3 Cleanup Function

```typescript
// Resource cleanup function
const createCloseFunction =
    (promiser: WorkerPromiseFunction) => async (): Promise<void> => {
        await promiser("close", {});
        // Worker cleanup handled by promiser
    };
```

### 4.2 Pure Helper Functions

#### 4.2.1 Input Validation

```typescript
const validateSqlInput = (sql: string, parameters?: SqlParameters): void => {
    if (!sql || typeof sql !== "string") {
        throw new Error("SQL must be a non-empty string");
    }

    if (parameters !== undefined && !isValidParameters(parameters)) {
        throw new Error("Invalid parameters format");
    }
};

const isValidParameters = (params: any): params is SqlParameters =>
    Array.isArray(params) || (typeof params === "object" && params !== null);
```

#### 4.2.2 Parameter Binding

```typescript
const bindParameters = (parameters?: SqlParameters): any[] => {
    if (!parameters) return [];

    if (Array.isArray(parameters)) {
        return parameters;
    }

    // Convert named parameters to positional for worker
    return Object.values(parameters);
};
```

#### 4.2.3 Result Transformation

```typescript
const transformQueryResult = <T>(result: any): T => {
    if (!result.resultRows) {
        throw new Error("Invalid query result");
    }

    return result.resultRows as T;
};
```

### 4.4 OPFS VFS Options

The SQLite WASM runtime provides multiple OPFS implementations. Understanding these options helps developers make informed decisions:

#### 4.4.1 Available OPFS VFS Types

**1. Standard OPFS VFS** (`vfs: "opfs"`) - **Our Choice**

```typescript
// Usage in worker
await promiser("open", {
    filename: "app.sqlite3",
    vfs: "opfs", // Standard OPFS implementation
});
```

**Characteristics:**

-   ✅ Direct OPFS file access
-   ✅ True persistent storage
-   ✅ Simple integration
-   ✅ Proven reliability
-   ⚠️ Requires Worker thread
-   ⚠️ One database per connection

**2. OPFS SAH Pool VFS** (`vfs: "opfs-sahpool"`) - **Available but not used**

```typescript
// Advanced usage (not implemented in our library)
const poolUtil = await sqlite3.installOpfsSAHPoolVfs({
    name: "my-pool",
});
```

**Characteristics:**

-   ✅ SharedAccessHandle pooling
-   ✅ Multiple database support
-   ✅ Better performance for many connections
-   ❌ More complex setup
-   ❌ Additional API surface
-   ❌ Overkill for simple use cases

#### 4.4.2 Why We Choose Standard OPFS VFS

For our minimal, functional library, the standard OPFS VFS is optimal because:

1. **Simplicity**: Single VFS, single purpose
2. **Reliability**: Battle-tested implementation
3. **Integration**: Works seamlessly with `sqlite3-worker1.js`
4. **Performance**: Excellent for single-database use cases
5. **Maintenance**: No additional complexity

#### 4.4.3 OPFS Worker Communication Flow

```typescript
// 1. Main thread creates worker
const worker = new Worker("sqlite3-worker1.js");

// 2. Worker initializes OPFS VFS automatically
// (sqlite3-worker1.js contains OPFS VFS code)

// 3. Worker opens database with OPFS persistence
worker.postMessage({
    type: "open",
    args: { filename: "app.sqlite3", vfs: "opfs" },
});

// 4. All subsequent operations use OPFS for persistence
worker.postMessage({
    type: "exec",
    args: { sql: "SELECT * FROM users" },
});
```

---

## 5. API Specification

### 5.1 Primary API

```typescript
// Main entry point - factory function
export default function webSqlite(filename: string): Promise<Database>;

// Database interface - only 2 methods
export interface Database {
    exec<TResult = Array<Record<string, unknown>>>(
        sql: string,
        parameters?: SqlParameters
    ): Promise<TResult>;

    close(): Promise<void>;
}

// Parameter types
export type SqlParameters =
    | ReadonlyArray<SqlValue>
    | Readonly<Record<string, SqlValue>>;

export type SqlValue =
    | string
    | number
    | bigint
    | boolean
    | null
    | Uint8Array
    | ArrayBufferView
    | Date;
```

### 5.2 Error Types

```typescript
export class WebSQLiteError extends Error {
    constructor(message: string, public cause?: Error) {
        super(message);
        this.name = "WebSQLiteError";
    }
}
```

### 5.3 Usage Examples

```typescript
// Basic usage
import webSqlite from "web-sqlite";

const db = await webSqlite("app.sqlite3");

// Select multiple records
type User = { id: number; name: string };
const users = await db.exec<User[]>("SELECT id, name FROM users");

// Select single record
const oneUser = await db.exec<User>("SELECT id, name FROM users LIMIT 1");

// With positional parameters
const activeUsers = await db.exec<User[]>(
    "SELECT id, name FROM users WHERE active = ? AND age > ?",
    [true, 18]
);

// With named parameters
const userById = await db.exec<User[]>(
    "SELECT id, name FROM users WHERE id = $userId",
    { userId: 123 }
);

// Insert/Update/Delete operations
await db.exec("INSERT INTO users (name, email) VALUES (?, ?)", [
    "John",
    "john@example.com",
]);
await db.exec("UPDATE users SET active = $active WHERE id = $id", {
    active: false,
    id: 123,
});
await db.exec("DELETE FROM users WHERE id = ?", [123]);

// Cleanup
await db.close();
```

---

## 6. Implementation Strategy

### 6.1 Development Phases

#### Phase 1: Core Foundation (Week 1)

-   [x] Functional type definitions
-   [ ] Worker creation and initialization
-   [ ] Basic OPFS Worker communication
-   [ ] Simple error handling
-   [ ] Unit test setup

#### Phase 2: Core Implementation (Week 2)

-   [ ] Complete exec() function implementation
-   [ ] Parameter binding (positional and named)
-   [ ] Result transformation
-   [ ] close() function implementation
-   [ ] Integration testing

#### Phase 3: Refinement (Week 3)

-   [ ] Error handling improvements
-   [ ] TypeScript type refinements
-   [ ] Performance optimization
-   [ ] Cross-browser testing
-   [ ] Documentation

### 6.2 Required Files

#### Core Implementation

```
src/
├── main.ts                 # Main entry point (webSqlite factory)
├── types.ts               # Type definitions
├── worker.ts              # Worker management functions
├── exec.ts                # exec() implementation
├── parameters.ts          # Parameter binding functions
├── results.ts             # Result transformation functions
└── errors.ts              # Error handling
```

#### SQLite WASM Files (from existing)

```
src/jswasm/
├── sqlite3-worker1.js                    # Worker implementation
├── sqlite3-worker1-promiser.js           # Promise wrapper for Worker API
├── sqlite3.js                           # Core SQLite runtime with all features
├── sqlite3.wasm                         # SQLite WebAssembly binary
└── sqlite3-opfs-async-proxy.js          # OPFS async file operations worker
```

#### OPFS-Related Files Overview

**Core OPFS Support:**

-   `sqlite3.js` - Contains the main OPFS VFS implementation (`sqlite3_vfs named "opfs"`)
-   `sqlite3-opfs-async-proxy.js` - Dedicated worker for handling asynchronous OPFS file operations

**Key OPFS Features Available:**

1. **OPFS VFS** (`vfs: "opfs"`):

    - Standard OPFS implementation for direct file access
    - Requires Worker thread (cannot run in main thread)
    - Uses `sqlite3.oo1.OpfsDb` for database instances

2. **OPFS SAH Pool** (`vfs: "opfs-sahpool"`):

    - SharedAccessHandle pool-based OPFS implementation
    - More efficient for multiple database connections
    - Available via `installOpfsSAHPoolVfs()` function

3. **Async Proxy Worker**:
    - Handles asynchronous OPFS operations
    - Bridges synchronous SQLite API with async OPFS APIs
    - Automatically managed by the OPFS VFS

**For Our Implementation:**
We'll use the standard **OPFS VFS** (`vfs: "opfs"`) with `sqlite3-worker1.js` as it provides:

-   Reliable persistent storage
-   Automatic OPFS file management
-   Built-in worker-based execution
-   Simple integration with existing Promise wrapper

### 6.3 Minimal Dependencies

```json
{
    "devDependencies": {
        "typescript": "^5.9.2",
        "tsup": "^8.5.0"
    }
}
```

No runtime dependencies - completely self-contained.

---

## 7. Performance Considerations

### 7.1 Performance Targets

| Metric          | Target        | Measurement                  |
| --------------- | ------------- | ---------------------------- |
| Bundle Size     | <30KB gzipped | Core library only            |
| Query Execution | <10ms         | Simple SELECT queries        |
| Database Open   | <100ms        | OPFS database initialization |
| Memory Usage    | <5MB          | For 1MB database             |

### 7.2 Functional Optimization Strategies

#### 7.2.1 Pure Function Benefits

-   Predictable performance characteristics
-   Easy to cache and memoize
-   No hidden side effects or memory leaks
-   Simple to test and optimize

#### 7.2.2 Minimal API Surface

-   Smaller bundle size
-   Faster runtime initialization
-   Reduced complexity and maintenance
-   Better tree-shaking effectiveness

#### 7.2.3 Single Strategy Approach

-   No runtime overhead for strategy selection
-   Optimized code path for OPFS Worker
-   Predictable performance profile
-   Simpler debugging and profiling

---

## 8. Security & Reliability

### 8.1 Security Considerations

#### 8.1.1 SQL Injection Prevention

-   Mandatory parameter binding for all variables
-   No string concatenation in SQL allowed
-   Input validation for parameters
-   Clear error messages for binding failures

#### 8.1.2 Data Protection

-   OPFS sandboxing for data isolation
-   No cross-origin data access
-   Secure worker communication
-   Automatic memory cleanup

### 8.2 Reliability Features

#### 8.2.1 Fail-Fast Philosophy

-   Clear error messages when OPFS/Workers unavailable
-   No silent fallbacks to unreliable strategies
-   Immediate validation of runtime requirements
-   Predictable behavior across environments

#### 8.2.2 Data Integrity

-   ACID compliance through SQLite
-   Transaction support (future)
-   Corruption detection via SQLite
-   Consistent error handling

---

## 9. Testing Strategy

### 9.1 Test Categories

#### 9.1.1 Unit Tests

-   Pure function testing
-   Parameter binding validation
-   Result transformation accuracy
-   Error handling scenarios

#### 9.1.2 Integration Tests

-   Worker communication testing
-   OPFS persistence validation
-   End-to-end query execution
-   Database lifecycle management

#### 9.1.3 Browser Tests

-   Chrome 86+ compatibility
-   Safari 15.2+ compatibility
-   OPFS functionality testing
-   Worker support validation

### 9.2 Test Environment Requirements

| Browser      | Worker Support | OPFS Support | Test Status   |
| ------------ | -------------- | ------------ | ------------- |
| Chrome 86+   | ✅             | ✅           | Required      |
| Safari 15.2+ | ✅             | ✅           | Required      |
| Firefox 82+  | ✅             | ❌           | Not Supported |
| Edge 86+     | ✅             | ✅           | Recommended   |

### 9.3 Simple Test Setup

```typescript
// Basic functional testing
describe("webSqlite", () => {
    test("creates database connection", async () => {
        const db = await webSqlite("test.db");
        expect(db).toHaveProperty("exec");
        expect(db).toHaveProperty("close");
    });

    test("executes simple queries", async () => {
        const db = await webSqlite("test.db");
        await db.exec("CREATE TABLE users (id INTEGER, name TEXT)");
        await db.exec('INSERT INTO users VALUES (1, "John")');

        const users = await db.exec("SELECT * FROM users");
        expect(users).toHaveLength(1);
        expect(users[0]).toEqual({ id: 1, name: "John" });

        await db.close();
    });
});
```

---

## 10. Deployment & Distribution

### 10.1 Simple Package Structure

```
web-sqlite/
├── dist/
│   ├── index.js           # Main bundle (UMD)
│   ├── index.mjs          # ES modules
│   ├── index.d.ts         # TypeScript definitions
│   └── sqlite3-worker1.js # Worker bundle
├── package.json
├── README.md
└── CHANGELOG.md
```

### 10.2 Build Configuration

```javascript
// tsup.config.ts
export default {
    entry: ["src/main.ts"],
    format: ["cjs", "esm"],
    dts: true,
    sourcemap: true,
    clean: true,
    minify: true,
    target: "es2020",
};
```

### 10.3 Release Strategy

#### Simple Versioning

-   v1.0.0: Core functionality (exec, close)
-   v1.1.0: Performance improvements
-   v1.2.0: Additional convenience features
-   v2.0.0: Breaking changes (if ever needed)

#### Release Process

1. Automated testing
2. Bundle size check
3. NPM publication
4. GitHub release

---

## 11. Future Roadmap

### 11.1 Version 1.0 (Core MVP)

-   [x] Functional API design
-   [ ] OPFS Worker implementation
-   [ ] Basic exec() and close() methods
-   [ ] Parameter binding
-   [ ] TypeScript support

### 11.2 Version 1.1 (Polish)

-   [ ] Performance optimizations
-   [ ] Better error messages
-   [ ] Documentation improvements
-   [ ] Browser compatibility testing

### 11.3 Version 1.2 (Convenience)

-   [ ] Transaction helper functions
-   [ ] Prepared statement syntax sugar
-   [ ] Query result streaming for large datasets

### 11.4 Long-term (if needed)

-   Consider prepared statements API
-   Potential transaction helpers
-   Performance monitoring utilities
-   Migration utilities

**Note:** The goal is to keep the library minimal and focused. Most advanced features should be built on top of this library rather than included in it.

---

## Appendices

### Appendix A: Browser Compatibility

| Feature              | Chrome  | Safari    | Edge    |
| -------------------- | ------- | --------- | ------- |
| WebAssembly          | 57+     | 11+       | 16+     |
| Web Workers          | 4+      | 4+        | 10+     |
| OPFS                 | 86+     | 15.2+     | 86+     |
| **Minimum Required** | **86+** | **15.2+** | **86+** |

_Note: Firefox not supported due to lack of OPFS_

### Appendix B: OPFS File Reference

| File                          | Size   | Purpose                        | When Loaded             |
| ----------------------------- | ------ | ------------------------------ | ----------------------- |
| `sqlite3-worker1.js`          | ~200KB | Main worker with SQLite + OPFS | Always (main worker)    |
| `sqlite3-worker1-promiser.js` | ~10KB  | Promise wrapper                | Always (main thread)    |
| `sqlite3.js`                  | ~500KB | Complete SQLite runtime        | Alternative to worker   |
| `sqlite3.wasm`                | ~1MB   | SQLite WebAssembly binary      | Always (by worker)      |
| `sqlite3-opfs-async-proxy.js` | ~15KB  | OPFS async operations          | Auto-loaded by OPFS VFS |

**Note:** Our library only directly uses the first 4 files. The async proxy is automatically managed by the OPFS VFS.

### Appendix C: Bundle Size Targets

```typescript
const targets = {
    core: { target: 30, unit: "KB gzipped" },
    worker: { target: 20, unit: "KB gzipped" },
    total: { target: 50, unit: "KB gzipped" },
};
```

### Appendix D: Error Reference

| Error                   | Cause                  | Solution                       |
| ----------------------- | ---------------------- | ------------------------------ |
| WebSQLiteError          | General library error  | Check error message            |
| Worker creation failed  | No Worker support      | Use modern browser             |
| OPFS not supported      | No OPFS support        | Use Chrome 86+ or Safari 15.2+ |
| SQL execution failed    | Invalid SQL            | Check SQL syntax               |
| Parameter binding error | Wrong parameter format | Check parameter types          |

### Appendix E: OPFS Development Notes

**File Locations in OPFS:**

-   Database files are stored in the browser's Origin-Private File System
-   Path: `navigator.storage.getDirectory()` → `/your-filename.sqlite3`
-   Not accessible via regular file system APIs
-   Persistent across browser sessions
-   Isolated per origin (domain)

**OPFS Limitations:**

-   Only available in Worker contexts (for most operations)
-   Chrome 86+ and Safari 15.2+ only
-   Cannot be accessed from main thread synchronously
-   File handles must be properly closed to avoid locks

**Debugging OPFS:**

```javascript
// Check if OPFS is available
const opfsSupported =
    "storage" in navigator && "getDirectory" in navigator.storage;

// List OPFS files (in Worker context)
const rootDir = await navigator.storage.getDirectory();
for await (const [name, handle] of rootDir.entries()) {
    console.log("OPFS file:", name, handle);
}
```

---

**Document Status:** Simplified Draft  
**Philosophy:** Keep it simple, functional, and reliable  
**Target:** Minimal viable product with excellent developer experience

This simplified design focuses on the core requirements: functional programming, minimal API, and OPFS Worker strategy only.
