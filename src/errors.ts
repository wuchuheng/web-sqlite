/**
 * Error handling utilities for Web-SQLite.
 */

import { WebSQLiteError } from "./types.js";

// Re-export WebSQLiteError for convenience
export { WebSQLiteError };

/**
 * Validates SQL input parameters.
 *
 * @param sql - The SQL string to validate
 * @param parameters - Optional parameters to validate
 * @throws {WebSQLiteError} If validation fails
 */
export const validateSqlInput = (sql: string, parameters?: any): void => {
  // 1. SQL validation
  if (!sql || typeof sql !== "string") {
    throw new WebSQLiteError("SQL must be a non-empty string");
  }

  // 2. Parameter validation
  if (parameters !== undefined && !isValidParameters(parameters)) {
    throw new WebSQLiteError("Invalid parameters format");
  }
};

/**
 * Checks if parameters are in valid format.
 *
 * @param params - Parameters to validate
 * @returns true if valid, false otherwise
 */
export const isValidParameters = (params: any): boolean =>
  Array.isArray(params) || (typeof params === "object" && params !== null);

/**
 * Creates a WebSQLiteError from a worker error.
 *
 * @param error - The original error
 * @param context - Additional context about the operation
 * @returns A properly formatted WebSQLiteError
 */
export const createWorkerError = (
  error: any,
  context: string,
): WebSQLiteError => {
  const message = error?.message || error?.toString() || "Unknown worker error";
  return new WebSQLiteError(`${context}: ${message}`, error);
};

/**
 * Validates browser support for required features.
 *
 * @throws {WebSQLiteError} If required features are not supported
 */
export const validateBrowserSupport = (): void => {
  // 1. Worker support check
  if (typeof Worker === "undefined") {
    throw new WebSQLiteError(
      "Web Workers not supported. Please use a modern browser (Chrome 86+, Safari 15.2+).",
    );
  }

  // 2. OPFS support check
  if (!("storage" in navigator) || !("getDirectory" in navigator.storage)) {
    throw new WebSQLiteError(
      "Origin Private File System (OPFS) not supported. Please use Chrome 86+ or Safari 15.2+.",
    );
  }
};
