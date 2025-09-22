/**
 * Entry point for the WebSQLite API.
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
 * Structure of the bind parameters accepted by {@link Database.exec}.
 */
export type SqlParameters =
  | ReadonlyArray<SqlValue>
  | Readonly<Record<string, SqlValue>>;

/**
 * Configuration options for the {@link Database.exec} call.
 */
export interface ExecOptions {
  /**
   * Optional positional (array) or named (object) parameters to bind to the statement.
   */
  readonly parameters?: SqlParameters;
}

/**
 * Represents an opened database handle backed by SQLite compiled to WebAssembly.
 */
export interface Database {
  /**
   * Execute a SQL statement and receive a typed result.
   *
   * @typeParam TResult - The expected shape of the execution result. The default is an
   * array of objects keyed by column name.
   * @param sql - The SQL statement to execute.
   * @param options - Optional configuration such as bind parameters.
   * @returns A promise resolving to a value shaped according to {@link TResult}.
   */
  exec<TResult = Array<Record<string, unknown>>>(
    sql: string,
    options?: ExecOptions,
  ): Promise<TResult>;
}

/**
 * Possible inputs pointing at the underlying SQLite database source.
 */
export type DatabaseSource =
  | string
  | URL
  | ArrayBuffer
  | Uint8Array
  | ArrayBufferView;

/**
 * Options accepted by {@link openDatabase}.
 */
export interface OpenDatabaseOptions {
  /**
   * Custom loader responsible for turning {@link DatabaseSource} into raw bytes.
   * This is primarily useful for environments that require bespoke fetching logic.
   */
  readonly loader?: (source: DatabaseSource) => Promise<ArrayBuffer>;
}

/**
 * Open a SQLite database from the provided {@link DatabaseSource}. The function resolves
 * to an object exposing the high-level database helpers, currently limited to
 * {@link Database.exec}.
 *
 * @param source - Identifier pointing at the SQLite database. This can be a URL, file
 * path, or raw binary buffer.
 * @param options - Optional advanced configuration.
 */
export const openDatabase = async (
  source: DatabaseSource,
  options?: OpenDatabaseOptions,
): Promise<Database> => {
  if (!source) {
    throw new Error("A database source must be provided to openDatabase().");
  }

  // The actual SQLite WASM runtime integration is pending implementation.
  // For now, we surface a placeholder that makes the contract explicit without
  // silently doing nothing.
  const exec: Database["exec"] = async () => {
    throw new Error(
      "web-sqlite: exec() is not implemented yet. The API surface is finalized, " +
        "but the WASM runtime wiring is still in progress.",
    );
  };

  return { exec } satisfies Database;
};

export default openDatabase;
