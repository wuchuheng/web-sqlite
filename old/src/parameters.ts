/**
 * Parameter binding utilities for SQL statements.
 */

import type { SqlParameters } from "./types.js";

/**
 * Binds parameters to SQL statement for worker execution.
 * Converts both positional and named parameters to the format expected by sqlite3-worker1.js
 *
 * @param parameters - The parameters to bind (array or object)
 * @returns Bound parameters in worker-compatible format
 */
export const bindParameters = (parameters?: SqlParameters): any => {
  // 1. Handle undefined parameters
  if (!parameters) {
    return undefined;
  }

  // 2. Handle positional parameters (arrays)
  if (Array.isArray(parameters)) {
    return parameters;
  }

  // 3. Handle named parameters (objects)
  // Convert to object format that sqlite3-worker1.js expects
  return parameters;
};

/**
 * Processes parameter values to ensure they're compatible with SQLite.
 *
 * @param value - The parameter value to process
 * @returns Processed value compatible with SQLite
 */
export const processParameterValue = (value: any): any => {
  // 1. Handle Date objects
  if (value instanceof Date) {
    return value.toISOString();
  }

  // 2. Handle ArrayBuffer and related types
  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }

  // 3. Handle other types as-is
  return value;
};

/**
 * Validates that all parameter values are of supported types.
 *
 * @param parameters - Parameters to validate
 * @returns true if all parameters are valid
 */
export const validateParameterTypes = (parameters: SqlParameters): boolean => {
  const supportedTypes = ["string", "number", "bigint", "boolean"];

  // 1. Handle array parameters
  if (Array.isArray(parameters)) {
    return parameters.every(
      (value) =>
        value === null ||
        supportedTypes.includes(typeof value) ||
        value instanceof Uint8Array ||
        value instanceof Date ||
        ArrayBuffer.isView(value),
    );
  }

  // 2. Handle object parameters
  return Object.values(parameters).every(
    (value) =>
      value === null ||
      supportedTypes.includes(typeof value) ||
      value instanceof Uint8Array ||
      value instanceof Date ||
      ArrayBuffer.isView(value),
  );
};
