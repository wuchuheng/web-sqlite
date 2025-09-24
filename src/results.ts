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
