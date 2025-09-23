# 📋 **Web-SQLite Project Reorganization Plan**

**Document Version:** 1.0  
**Date:** September 23, 2025  
**Author:** Development Team  
**Status:** Planning Phase

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Proposed Structure](#proposed-structure)
4. [Migration Plan](#migration-plan)
5. [Implementation Phases](#implementation-phases)
6. [Success Metrics](#success-metrics)
7. [Risk Assessment](#risk-assessment)
8. [Rollback Strategy](#rollback-strategy)

---

## Executive Summary

### 🎯 **Objective**

Transform the current flat file structure into a professional, maintainable, and scalable codebase that follows industry best practices while preserving all existing functionality.

### 🔍 **Key Problems Addressed**

- **Flat Structure**: All core files at the same level without logical grouping
- **Mixed Concerns**: Large files handling multiple responsibilities
- **Poor Discoverability**: Hard to find related functionality
- **Maintenance Burden**: Difficult to modify without affecting unrelated code
- **Scalability Issues**: No clear patterns for adding new features

### 💡 **Solution Approach**

- **Domain-Driven Organization**: Group files by functionality and purpose
- **Single Responsibility**: Each file has one clear, focused purpose
- **Clear Boundaries**: Separate public API from internal implementation
- **Professional Standards**: Follow patterns from successful TypeScript libraries

---

## Current State Analysis

### 📊 **File Inventory**

| Current File        | Size    | Purpose               | Issues                      | Priority       |
| ------------------- | ------- | --------------------- | --------------------------- | -------------- |
| `main.ts`           | 3.2KB   | Factory + exports     | ✅ Well-structured          | Keep structure |
| `types.ts`          | 4.1KB   | All type definitions  | ⚠️ Could be split by domain | High           |
| `exec.ts`           | 8.5KB   | All SQL operations    | ❌ Large, mixed concerns    | Critical       |
| `worker.ts`         | 4.2KB   | Worker management     | ✅ Good separation          | Minor updates  |
| `errors.ts`         | Unknown | Error handling        | ✅ Good separation          | Keep           |
| `parameters.ts`     | Unknown | Parameter binding     | ✅ Good separation          | Relocate       |
| `results.ts`        | Unknown | Result transformation | ✅ Good separation          | Relocate       |
| `cli.ts`            | 100B    | CLI stub              | ❌ Not implemented          | Implement      |
| `types-improved.ts` | Unknown | Duplicate types?      | ❌ Needs cleanup            | Remove         |
| `jswasm/*`          | ~2MB    | SQLite WASM files     | ⚠️ Vendor code mixed        | Organize       |

### 🔍 **Code Quality Assessment**

#### ✅ **Strengths**

- Well-structured main factory function
- Good TypeScript usage with proper types
- Functional programming principles followed
- Clear API design with separate methods

#### ⚠️ **Areas for Improvement**

- Large `exec.ts` file (8.5KB) handling all SQL operations
- Types could be better organized by domain
- No clear separation between public API and internals
- CLI not properly implemented

#### ❌ **Critical Issues**

- Flat file structure makes navigation difficult
- Mixed vendor code with application code
- Duplicate type files suggesting incomplete refactoring
- No clear module boundaries

---

## Proposed Structure

### 🏗️ **New Directory Architecture**

```
src/
├── index.ts                    # 📦 Main public API export
├── lib/                        # 🏗️ Core library implementation
│   ├── index.ts               # Re-exports from lib
│   ├── factory.ts             # webSqlite factory function
│   ├── database.ts            # Database interface implementation
│   └── operations/            # SQL operations by type
│       ├── index.ts          # Operation exports
│       ├── query.ts          # SELECT operations (query, queryOne)
│       ├── execute.ts        # DML operations (INSERT/UPDATE/DELETE)
│       ├── run.ts            # DDL operations (CREATE/ALTER/DROP)
│       └── transaction.ts    # Transaction handling
├── worker/                     # 🔧 Worker management
│   ├── index.ts              # Worker exports
│   ├── factory.ts            # Worker creation and initialization
│   ├── promiser.ts           # Promise wrapper for worker communication
│   └── lifecycle.ts          # Database open/close operations
├── sql/                        # 🔍 SQL utilities
│   ├── index.ts              # SQL utility exports
│   ├── analyzer.ts           # SQL operation detection and parsing
│   ├── parameters.ts         # Parameter binding logic
│   └── validator.ts          # Input validation
├── types/                      # 📝 Type definitions
│   ├── index.ts              # Main type exports
│   ├── database.ts           # Database interfaces and core types
│   ├── operations.ts         # Operation-specific types
│   ├── worker.ts             # Worker communication types
│   └── sql.ts                # SQL parameter and result types
├── utils/                      # 🛠️ Utilities
│   ├── index.ts              # Utility exports
│   ├── errors.ts             # Error classes and handling
│   └── results.ts            # Result transformation utilities
├── vendor/                     # 📦 Third-party code
│   └── sqlite/               # SQLite WASM files
│       ├── worker/           # Worker-related files
│       │   ├── sqlite3-worker1.js
│       │   ├── sqlite3-worker1-promiser.js
│       │   └── sqlite3-opfs-async-proxy.js
│       ├── core/             # Core SQLite files
│       │   ├── sqlite3.js
│       │   ├── sqlite3.mjs
│       │   └── sqlite3.wasm
│       └── variants/         # Different build variants
│           ├── bundler-friendly/
│           │   ├── sqlite3-bundler-friendly.mjs
│           │   └── sqlite3-worker1-bundler-friendly.mjs
```

### 📋 **File Migration Mapping**

| Current File    | New Location                  | Transformation Required                                    |
| --------------- | ----------------------------- | ---------------------------------------------------------- |
| `main.ts`       | `lib/factory.ts` + `index.ts` | Split factory from exports                                 |
| `types.ts`      | `types/*.ts`                  | Split by domain (database, operations, sql, worker)        |
| `exec.ts`       | `lib/operations/*.ts`         | Split by operation type (query, execute, run, transaction) |
| `worker.ts`     | `worker/*.ts`                 | Split by responsibility (factory, promiser, lifecycle)     |
| `errors.ts`     | `utils/errors.ts`             | Move to utilities                                          |
| `parameters.ts` | `sql/parameters.ts`           | Move to SQL utilities                                      |
| `results.ts`    | `utils/results.ts`            | Move to utilities                                          |
| `jswasm/*`      | `vendor/sqlite/*`             | Organize by purpose and functionality                      |

---

## Migration Plan

### 🎯 **Design Principles**

#### 1. **Single Responsibility Principle**

Each file and module has one clear, focused purpose:

- `lib/operations/query.ts` - Only SELECT operations
- `lib/operations/execute.ts` - Only INSERT/UPDATE/DELETE operations
- `sql/analyzer.ts` - Only SQL parsing and analysis

#### 2. **Clear Module Boundaries**

```typescript
// Public API (what users import)
src/index.ts

// Core implementation (internal)
src/lib/

// Support utilities (internal)
src/sql/, src/utils/, src/worker/

// Type definitions (public + internal)
src/types/

// External dependencies (vendor)
src/vendor/
```

#### 3. **Dependency Flow**

```
index.ts → lib/ → sql/, utils/, worker/ → types/ → vendor/
```

#### 4. **Barrel Exports**

Each directory contains an `index.ts` for clean imports:

```typescript
// Instead of
import { createQueryFunction } from "../lib/operations/query.js";
import { createExecuteFunction } from "../lib/operations/execute.js";

// Use
import {
    createQueryFunction,
    createExecuteFunction,
} from "../lib/operations/index.js";
```

### 📝 **Detailed File Specifications**

#### **`src/index.ts`** - Public API Entry Point

```typescript
/**
 * Main public API for Web-SQLite library.
 * This is the only file users should import from.
 */

// Re-export default factory function
export { default } from "./lib/factory.js";

// Re-export all public types
export type * from "./types/database.js";
export type * from "./types/operations.js";
export type * from "./types/sql.js";

// Re-export error classes for user error handling
export { WebSQLiteError } from "./utils/errors.js";
```

#### **`src/lib/factory.ts`** - Core Factory Function

```typescript
/**
 * Main factory function for creating database instances.
 * Extracted from main.ts with improved organization.
 */

import type { Database } from "../types/database.js";
import { validateBrowserSupport } from "../utils/errors.js";
import { createSQLiteWorker, openDatabase } from "../worker/index.js";
import { createDatabase } from "./database.js";

export default async function webSqlite(filename: string): Promise<Database> {
    // 1. Validation
    validateBrowserSupport();
    validateFilename(filename);

    // 2. Worker creation and database opening
    const promiser = await createSQLiteWorker();
    await openDatabase(promiser, filename);

    // 3. Create and return database interface
    return createDatabase(promiser);
}

const validateFilename = (filename: string): void => {
    if (!filename || typeof filename !== "string") {
        throw new WebSQLiteError("Filename must be a non-empty string");
    }
};
```

#### **`src/lib/database.ts`** - Database Interface Implementation

```typescript
/**
 * Creates the Database interface implementation.
 * Composes all operation functions into a single interface.
 */

import type { Database, WorkerPromiseFunction } from "../types/index.js";
import {
    createQueryFunction,
    createQueryOneFunction,
    createExecuteFunction,
    createRunFunction,
    createTransactionFunction,
} from "./operations/index.js";
import { closeDatabase } from "../worker/index.js";

export const createDatabase = (promiser: WorkerPromiseFunction): Database => ({
    // Query operations - return typed data
    query: createQueryFunction(promiser),
    queryOne: createQueryOneFunction(promiser),

    // Data modification operations - return metadata
    execute: createExecuteFunction(promiser),

    // DDL and utility operations - return void
    run: createRunFunction(promiser),

    // Transaction operations - atomic execution
    transaction: createTransactionFunction(promiser),

    // Resource cleanup
    close: async (): Promise<void> => {
        await closeDatabase(promiser);
    },
});
```

#### **`src/lib/operations/query.ts`** - SELECT Operations

```typescript
/**
 * Query operations for SELECT statements.
 * Returns typed data arrays or single rows.
 */

import type {
    SqlParameters,
    WorkerPromiseFunction,
} from "../../types/index.js";
import { analyzeSqlOperation } from "../../sql/analyzer.js";
import { executeWorkerRequest } from "../shared/execution.js";
import { WebSQLiteError } from "../../utils/errors.js";

export const createQueryFunction = (promiser: WorkerPromiseFunction) => {
    return async <T>(sql: string, parameters?: SqlParameters): Promise<T[]> => {
        // 1. Validate operation type
        const opType = analyzeSqlOperation(sql);
        if (opType !== "select") {
            throw new WebSQLiteError(
                `Expected SELECT statement, got ${opType.toUpperCase()}`,
            );
        }

        // 2. Execute query with result rows
        const result = await executeWorkerRequest(
            promiser,
            sql,
            parameters,
            true,
        );

        // 3. Return typed result array
        return Array.isArray(result.resultRows)
            ? (result.resultRows as T[])
            : [];
    };
};

export const createQueryOneFunction = (promiser: WorkerPromiseFunction) => {
    return async <T>(
        sql: string,
        parameters?: SqlParameters,
    ): Promise<T | null> => {
        // 1. Validate operation type
        const opType = analyzeSqlOperation(sql);
        if (opType !== "select") {
            throw new WebSQLiteError(
                `Expected SELECT statement, got ${opType.toUpperCase()}`,
            );
        }

        // 2. Execute query with result rows
        const result = await executeWorkerRequest(
            promiser,
            sql,
            parameters,
            true,
        );

        // 3. Return first row or null
        if (Array.isArray(result.resultRows) && result.resultRows.length > 0) {
            return result.resultRows[0] as T;
        }

        return null;
    };
};
```

#### **`src/types/database.ts`** - Core Database Types

```typescript
/**
 * Core database interface and related types.
 * Contains the main Database interface that users interact with.
 */

import type {
    SqlParameters,
    ModificationResult,
    TransactionStatement,
} from "./index.js";

/**
 * Represents an opened database handle backed by SQLite compiled to WebAssembly.
 * Provides separate methods for different types of database operations.
 */
export interface Database {
    query<T = Record<string, unknown>>(
        sql: string,
        parameters?: SqlParameters,
    ): Promise<T[]>;

    queryOne<T = Record<string, unknown>>(
        sql: string,
        parameters?: SqlParameters,
    ): Promise<T | null>;

    execute(
        sql: string,
        parameters?: SqlParameters,
    ): Promise<ModificationResult>;

    run(sql: string, parameters?: SqlParameters): Promise<void>;

    transaction(statements: TransactionStatement[]): Promise<Array<unknown>>;

    close(): Promise<void>;
}
```

---

## Implementation Phases

### 🎯 **Phase 1: Structure Creation (Day 1 - 4 hours)**

#### 1.1 Create Directory Structure

- [ ] Create all new directories
- [ ] Set up `index.ts` files with barrel exports
- [ ] Document directory purposes

#### 1.2 Type Organization

- [ ] Split `types.ts` into domain-specific files
- [ ] Create proper type exports in `types/index.ts`
- [ ] Remove duplicate `types-improved.ts`
- [ ] Validate all type dependencies

**Deliverables:**

- Complete directory structure
- Organized type definitions
- Clean type dependency graph

### 🎯 **Phase 2: Core Library Refactoring (Day 2 - 6 hours)**

#### 2.1 Factory Function Extraction

- [ ] Move main logic from `main.ts` to `lib/factory.ts`
- [ ] Create clean `src/index.ts` with public API exports
- [ ] Implement `lib/database.ts` composition function

#### 2.2 Operation Split

- [ ] Extract SELECT operations to `lib/operations/query.ts`
- [ ] Extract DML operations to `lib/operations/execute.ts`
- [ ] Extract DDL operations to `lib/operations/run.ts`
- [ ] Extract transaction logic to `lib/operations/transaction.ts`
- [ ] Create shared execution utilities

#### 2.3 Worker Management Refactoring

- [ ] Split worker creation to `worker/factory.ts`
- [ ] Move promiser logic to `worker/promiser.ts`
- [ ] Extract lifecycle operations to `worker/lifecycle.ts`

**Deliverables:**

- Modular operation functions
- Clean worker management
- Functional core library

### 🎯 **Phase 3: Utilities & SQL Organization (Day 2 - 2 hours)**

#### 3.1 SQL Utilities

- [ ] Move SQL analysis to `sql/analyzer.ts`
- [ ] Relocate parameter binding to `sql/parameters.ts`
- [ ] Create input validation in `sql/validator.ts`

#### 3.2 Utility Functions

- [ ] Move error handling to `utils/errors.ts`
- [ ] Relocate result transformation to `utils/results.ts`
- [ ] Create utility barrel exports

**Deliverables:**

- Organized SQL utilities
- Clean utility functions
- Proper error handling

### 🎯 **Phase 4: Vendor Code (Day 3 - 4 hours)**

#### 4.1 Vendor Organization

- [ ] Move SQLite WASM files to `vendor/sqlite/`
- [ ] Organize by functionality (worker/, core/, variants/)
- [ ] Update import paths
- [ ] Document vendor file purposes

#### 4.2 CLI Implementation

- [ ] Implement proper CLI with commander.js
- [ ] Add interactive mode support
- [ ] Create useful database utilities
- [ ] Add proper error handling

#### 4.3 Build Configuration

- [ ] Update `tsup.config.ts` for new structure
- [ ] Update `package.json` exports
- [ ] Verify build outputs
- [ ] Test bundle sizes

**Deliverables:**

- Organized vendor code
- Functional CLI
- Updated build process

### 🎯 **Phase 5: Testing & Validation (Day 4 - 4 hours)**

#### 5.1 Build Validation

- [ ] Ensure `pnpm build` completes without errors
- [ ] Verify all TypeScript types resolve correctly
- [ ] Check bundle sizes haven't increased significantly
- [ ] Validate source maps are generated correctly

#### 5.2 Functionality Testing

- [ ] Run existing demo to ensure compatibility
- [ ] Test all API methods work correctly
- [ ] Verify worker communication functions
- [ ] Test CLI functionality

#### 5.3 Documentation Updates

- [ ] Update import examples in README
- [ ] Document new file organization
- [ ] Update development setup instructions
- [ ] Create migration guide for contributors

**Deliverables:**

- Fully functional reorganized codebase
- Validated API compatibility
- Updated documentation

---

## Success Metrics

### 📊 **Quantitative Metrics**

| Metric                  | Current            | Target           | Measurement             |
| ----------------------- | ------------------ | ---------------- | ----------------------- |
| **Max File Size**       | 8.5KB (`exec.ts`)  | <3KB             | Line count reduction    |
| **Directory Depth**     | 2 levels           | 3-4 levels       | Logical organization    |
| **Files per Directory** | 11 files in `src/` | <6 files per dir | Better organization     |
| **Bundle Size**         | Current size       | ±5% change       | Build output comparison |
| **Build Time**          | Current time       | <110% current    | Build performance       |

### 📈 **Qualitative Metrics**

#### ✅ **Must Have**

- [ ] All existing functionality preserved
- [ ] No breaking changes to public API
- [ ] TypeScript compilation without errors
- [ ] Existing demos work unchanged
- [ ] Import paths remain stable for users

#### 🎯 **Should Have**

- [ ] Improved code discoverability
- [ ] Easier to add new operations
- [ ] Clear separation of concerns
- [ ] Better test isolation
- [ ] Cleaner import statements

#### 💫 **Nice to Have**

- [ ] Reduced cognitive load for new developers
- [ ] Better IDE navigation experience
- [ ] More logical file organization
- [ ] Easier debugging and profiling
- [ ] Simplified onboarding process

---

## Risk Assessment

### 🚨 **High Risk Items**

#### 1. **Import Path Changes**

**Risk:** Breaking internal imports during refactoring  
**Mitigation:**

- Use absolute imports with proper extensions
- Update all imports systematically
- Test build after each major change

#### 2. **Type Resolution Issues**

**Risk:** TypeScript compilation errors after splitting types  
**Mitigation:**

- Maintain type export compatibility
- Use barrel exports for clean type imports
- Validate types with each change

#### 3. **Worker Path Dependencies**

**Risk:** Worker creation may fail with new vendor organization  
**Mitigation:**

- Update worker paths in build configuration
- Test worker functionality early
- Maintain backup of working paths

### ⚠️ **Medium Risk Items**

#### 1. **Bundle Size Increase**

**Risk:** New file structure may increase bundle size  
**Mitigation:**

- Monitor bundle size throughout process
- Use tree-shaking friendly exports
- Optimize import patterns

#### 2. **Build Configuration Complexity**

**Risk:** New structure requires complex build setup  
**Mitigation:**

- Keep build configuration simple
- Use standard patterns
- Test incrementally

### ✅ **Low Risk Items**

#### 1. **Performance Impact**

**Risk:** New structure affects runtime performance  
**Assessment:** Minimal risk - structure changes don't affect runtime
**Mitigation:** Validate performance with existing benchmarks

#### 2. **Development Experience**

**Risk:** New structure is harder to work with  
**Assessment:** Low risk - structure follows industry standards
**Mitigation:** Create clear documentation and examples

---

## Rollback Strategy

### 🔄 **Backup Plan**

#### 1. **Git Branch Strategy**

```bash
# Create backup branch before starting
git checkout -b backup/pre-reorganization

# Create feature branch for changes
git checkout -b feature/reorganize-structure

# Each phase gets its own commit
git commit -m "Phase 1: Create directory structure"
git commit -m "Phase 2: Refactor core library"
# ... etc
```

#### 2. **Phase-by-Phase Rollback**

Each phase creates a working intermediate state:

- **Phase 1 Complete:** Directory structure created, types organized
- **Phase 2 Complete:** Core library refactored, operations split
- **Phase 3 Complete:** Utilities organized, SQL functions moved
- **Phase 4 Complete:** Vendor code organized, CLI implemented
- **Phase 5 Complete:** Testing complete, documentation updated

#### 3. **Rollback Triggers**

- Build failures that can't be resolved within 2 hours
- Type resolution errors affecting public API
- Bundle size increase >10%
- Performance degradation >20%
- Any functionality breaking existing demos

#### 4. **Recovery Process**

```bash
# Quick rollback to previous phase
git reset --hard HEAD~1

# Complete rollback to pre-reorganization
git checkout backup/pre-reorganization
git checkout -b hotfix/restore-structure
```

---

## Next Steps

### 🚀 **Immediate Actions**

1. **Review and Approval**
    - [ ] Review this plan with team
    - [ ] Get approval for reorganization approach
    - [ ] Confirm timeline and resource allocation

2. **Pre-Implementation Setup**
    - [ ] Create backup branch
    - [ ] Set up monitoring for bundle size
    - [ ] Prepare test validation checklist

3. **Phase 1 Execution**
    - [ ] Begin directory structure creation
    - [ ] Start type organization
    - [ ] Set up barrel exports

### 📋 **Success Checklist**

Before considering the reorganization complete:

- [ ] All phases completed successfully
- [ ] Build passes without errors or warnings
- [ ] All existing functionality works unchanged
- [ ] Bundle size within acceptable range (<10% increase)
- [ ] TypeScript types resolve correctly
- [ ] Existing demos work without modification
- [ ] CLI functionality implemented and tested
- [ ] Documentation updated with new structure
- [ ] Team can navigate new structure easily
- [ ] New contributor onboarding improved

---

**Document Status:** Complete and Ready for Implementation  
**Estimated Total Time:** 18 hours over 4 days  
**Risk Level:** Medium (with proper mitigation strategies)  
**Expected Benefits:** Significant improvement in maintainability and scalability
