/**
 * Type definitions for Web-SQLite library.
 * Provides separate interfaces for different database operations with proper type safety.
 */

/**
 * Supported parameter value types that can be bound to a SQL statement.
 */
export type SqlValue =
  | string
  | number
  | bigint
  | boolean
  | null
  | Uint8Array
  | ArrayBufferView
  | Date;

/**
 * Structure of the bind parameters accepted by Database methods.
 * Can be either positional (array) or named (object) parameters.
 */
export type SqlParameters =
  | ReadonlyArray<SqlValue>
  | Readonly<Record<string, SqlValue>>;

/**
 * Result of data modification operations (INSERT, UPDATE, DELETE).
 */
export interface ModificationResult {
  /** Number of rows affected by the operation */
  changes: number;
  /** Row ID of the last inserted row (INSERT only, null for UPDATE/DELETE) */
  lastInsertRowid: number | null;
}

/**
 * Configuration for individual statements in a transaction.
 */
export interface TransactionStatement {
  /** SQL statement to execute */
  sql: string;
  /** Optional bind parameters */
  parameters?: SqlParameters;
  /** Type of operation - determines return value handling */
  type?: "query" | "execute" | "run";
}

/**
 * Represents an opened database handle backed by SQLite compiled to WebAssembly.
 * Provides separate methods for different types of database operations.
 */
export interface Database {
  /**
   * Execute SELECT queries and return typed results.
   *
   * @typeParam T - Expected shape of each row (defaults to Record<string, unknown>)
   * @param sql - SELECT statement
   * @param parameters - Optional positional (array) or named (object) parameters
   * @returns Promise resolving to array of rows matching type T
   *
   * @example
   * ```typescript
   * interface User { id: number; name: string; }
   * const users = await db.query<User>('SELECT id, name FROM users WHERE active = ?', [true]);
   * ```
   */
  query<T = Record<string, unknown>>(
    sql: string,
    parameters?: SqlParameters,
  ): Promise<T[]>;

  /**
   * Execute a SELECT query and return the first row.
   *
   * @typeParam T - Expected shape of the row (defaults to Record<string, unknown>)
   * @param sql - SELECT statement
   * @param parameters - Optional positional (array) or named (object) parameters
   * @returns Promise resolving to first row or null if no results
   *
   * @example
   * ```typescript
   * const user = await db.queryOne<User>('SELECT * FROM users WHERE id = ?', [1]);
   * if (user) console.log(user.name);
   * ```
   */
  queryOne<T = Record<string, unknown>>(
    sql: string,
    parameters?: SqlParameters,
  ): Promise<T | null>;

  /**
   * Execute INSERT, UPDATE, DELETE statements.
   *
   * @param sql - Data modification statement (INSERT, UPDATE, DELETE)
   * @param parameters - Optional positional (array) or named (object) parameters
   * @returns Promise resolving to modification result with change count and insert ID
   *
   * @example
   * ```typescript
   * const result = await db.execute('INSERT INTO users (name) VALUES (?)', ['John']);
   * console.log(`Inserted ${result.changes} rows, ID: ${result.lastInsertRowid}`);
   * ```
   */
  execute(sql: string, parameters?: SqlParameters): Promise<ModificationResult>;

  /**
   * Execute DDL statements (CREATE, DROP, ALTER, etc.) and utility operations.
   *
   * @param sql - DDL or utility statement
   * @param parameters - Optional positional (array) or named (object) parameters
   * @returns Promise resolving to void
   *
   * @example
   * ```typescript
   * await db.run('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
   * await db.run('CREATE INDEX idx_users_name ON users(name)');
   * ```
   */
  run(sql: string, parameters?: SqlParameters): Promise<void>;

  /**
   * Execute multiple statements in a transaction.
   * All statements succeed or all fail atomically.
   *
   * @param statements - Array of statements with optional parameters and types
   * @returns Promise resolving to array of results from each statement
   *
   * @example
   * ```typescript
   * const results = await db.transaction([
   *   { sql: 'INSERT INTO users (name) VALUES (?)', parameters: ['Alice'], type: 'execute' },
   *   { sql: 'SELECT COUNT(*) as count FROM users', type: 'query' },
   * ]);
   * ```
   */
  transaction(statements: TransactionStatement[]): Promise<Array<unknown>>;

  /**
   * Close the database connection and cleanup resources.
   *
   * @returns Promise that resolves when the database is properly closed
   *
   * @example
   * ```typescript
   * await db.close();
   * ```
   */
  close(): Promise<void>;
}

/**
 * Custom error class for Web-SQLite operations.
 */
export class WebSQLiteError extends Error {
  constructor(
    message: string,
    public cause?: Error,
  ) {
    super(message);
    this.name = "WebSQLiteError";
  }
}

/**
 * Worker message types for communication with sqlite3-worker1.js
 */
export interface WorkerMessage {
  type: string;
  args?: any;
  messageId?: string;
}

/**
 * Worker response structure
 */
export interface WorkerResponse {
  type: string;
  result?: any;
  error?: string;
  messageId?: string;
}

/**
 * Function type for the worker promiser
 */
export type WorkerPromiseFunction = (type: string, args?: any) => Promise<any>;
