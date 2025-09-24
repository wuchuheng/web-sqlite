/**
 * Result transformation utilities for Web-SQLite.
 */

/**
 * Transforms raw SQLite worker results into user-friendly format.
 *
 * @param result - Raw result from sqlite3-worker1.js
 * @returns Transformed result suitable for user consumption
 */
export const transformResult = <T>(result: any): T => {
  // 1. Handle null/undefined results
  if (!result) {
    return [] as T;
  }

  // 2. Handle array results (SELECT queries)
  if (Array.isArray(result.resultRows)) {
    return result.resultRows as T;
  }

  // 3. Handle modification results (INSERT, UPDATE, DELETE)
  if (typeof result.changes === "number") {
    return {
      changes: result.changes,
      lastInsertRowid: result.lastInsertRowid || null,
    } as T;
  }

  // 4. Handle single row results
  if (result.row) {
    return [result.row] as T;
  }

  // 5. Default empty array
  return [] as T;
};

/**
 * Formats column values from SQLite to JavaScript types.
 *
 * @param value - Raw column value
 * @param columnType - SQLite column type (if available)
 * @returns Formatted value
 */
export const formatColumnValue = (value: any, columnType?: string): any => {
  // 1. Handle null values
  if (value === null || value === undefined) {
    return null;
  }

  // 2. Handle dates (if stored as ISO strings)
  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
  ) {
    return new Date(value);
  }

  // 3. Handle binary data
  if (value instanceof Uint8Array) {
    return value;
  }

  // 4. Return value as-is for other types
  return value;
};
