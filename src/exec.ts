/**
 * SQL execution functionality for Web-SQLite.
 * Provides separate implementations for different types of database operations.
 */

import type {
  SqlParameters,
  WorkerPromiseFunction,
  ModificationResult,
  TransactionStatement,
} from "./types.js";
import { validateSqlInput, createWorkerError } from "./errors.js";
import { bindParameters, validateParameterTypes } from "./parameters.js";

/**
 * SQL operation types for routing to appropriate handlers.
 */
type SqlOperationType =
  | "select"
  | "insert"
  | "update"
  | "delete"
  | "ddl"
  | "utility";

/**
 * Analyzes SQL statement to determine its operation type.
 *
 * @param sql - SQL statement to analyze
 * @returns Operation type for routing to appropriate handler
 */
export const analyzeSqlOperation = (sql: string): SqlOperationType => {
  // 1. Normalize SQL for analysis
  const normalizedSql = sql.trim().toLowerCase();

  // 2. Check for SELECT operations
  if (/^select\s/.test(normalizedSql)) {
    return "select";
  }

  // 3. Check for data modification operations
  if (/^insert\s/.test(normalizedSql)) {
    return "insert";
  }
  if (/^update\s/.test(normalizedSql)) {
    return "update";
  }
  if (/^delete\s/.test(normalizedSql)) {
    return "delete";
  }

  // 4. Check for DDL operations
  if (/^(create|drop|alter)\s/.test(normalizedSql)) {
    return "ddl";
  }

  // 5. Default to utility operations
  return "utility";
};

/**
 * Executes a worker request with proper error handling.
 *
 * @param promiser - Worker promiser function
 * @param sql - SQL statement
 * @param parameters - Optional parameters
 * @param forceResultRows - Whether to force resultRows for SELECT operations
 * @returns Raw worker result
 */
const executeWorkerRequest = async (
  promiser: WorkerPromiseFunction,
  sql: string,
  parameters?: SqlParameters,
  forceResultRows: boolean = false,
): Promise<any> => {
  // 1. Input validation
  validateSqlInput(sql, parameters);

  if (parameters && !validateParameterTypes(parameters)) {
    throw createWorkerError(
      new Error("Invalid parameter types"),
      "Parameter validation",
    );
  }

  // 2. Parameter binding
  const bindings = bindParameters(parameters);

  try {
    // 3. Execute query via worker
    const config: any = {
      sql,
      bind: bindings,
      rowMode: "object",
    };

    // Only add resultRows for SELECT statements
    if (forceResultRows) {
      config.resultRows = [];
    }

    const result = await promiser("exec", config);
    return result;
  } catch (error) {
    throw createWorkerError(error, "SQL execution");
  }
};

/**
 * Creates a query function for SELECT operations returning arrays.
 *
 * @param promiser - Worker promiser function for database communication
 * @returns Function to execute SELECT statements and return typed arrays
 */
export const createQueryFunction = (promiser: WorkerPromiseFunction) => {
  return async <T>(sql: string, parameters?: SqlParameters): Promise<T[]> => {
    // 1. Validate operation type
    const opType = analyzeSqlOperation(sql);
    if (opType !== "select") {
      throw createWorkerError(
        new Error(`Expected SELECT statement, got ${opType.toUpperCase()}`),
        "SQL operation type mismatch",
      );
    }

    // 2. Execute query with result rows
    const result = await executeWorkerRequest(promiser, sql, parameters, true);

    // 3. Return typed result array
    if (Array.isArray(result.resultRows)) {
      return result.resultRows as T[];
    }

    // 4. Handle edge cases
    return [] as T[];
  };
};

/**
 * Creates a queryOne function for SELECT operations returning single rows.
 *
 * @param promiser - Worker promiser function for database communication
 * @returns Function to execute SELECT statements and return single typed rows
 */
export const createQueryOneFunction = (promiser: WorkerPromiseFunction) => {
  return async <T>(
    sql: string,
    parameters?: SqlParameters,
  ): Promise<T | null> => {
    // 1. Validate operation type
    const opType = analyzeSqlOperation(sql);
    if (opType !== "select") {
      throw createWorkerError(
        new Error(`Expected SELECT statement, got ${opType.toUpperCase()}`),
        "SQL operation type mismatch",
      );
    }

    // 2. Execute query with result rows
    const result = await executeWorkerRequest(promiser, sql, parameters, true);

    // 3. Return first row or null
    if (Array.isArray(result.resultRows) && result.resultRows.length > 0) {
      return result.resultRows[0] as T;
    }

    return null;
  };
};

/**
 * Creates an execute function for data modification operations.
 *
 * @param promiser - Worker promiser function for database communication
 * @returns Function to execute INSERT/UPDATE/DELETE statements
 */
export const createExecuteFunction = (promiser: WorkerPromiseFunction) => {
  return async (
    sql: string,
    parameters?: SqlParameters,
  ): Promise<ModificationResult> => {
    // 1. Validate operation type
    const opType = analyzeSqlOperation(sql);
    if (!["insert", "update", "delete"].includes(opType)) {
      throw createWorkerError(
        new Error(
          `Expected INSERT/UPDATE/DELETE statement, got ${opType.toUpperCase()}`,
        ),
        "SQL operation type mismatch",
      );
    }

    // 2. Execute modification without result rows
    const result = await executeWorkerRequest(promiser, sql, parameters, false);

    // 3. Return modification result
    return {
      changes: result.changes || result.changeCount || 0,
      lastInsertRowid: result.lastInsertRowid || result.lastInsertRowId || null,
    };
  };
};

/**
 * Creates a run function for DDL and utility operations.
 *
 * @param promiser - Worker promiser function for database communication
 * @returns Function to execute DDL and utility statements
 */
export const createRunFunction = (promiser: WorkerPromiseFunction) => {
  return async (sql: string, parameters?: SqlParameters): Promise<void> => {
    // 1. Validate operation type
    const opType = analyzeSqlOperation(sql);
    if (opType === "select") {
      throw createWorkerError(
        new Error("Use query() or queryOne() for SELECT statements"),
        "SQL operation type mismatch",
      );
    }

    // 2. Execute operation without result rows
    await executeWorkerRequest(promiser, sql, parameters, false);

    // 3. Return void for DDL/utility operations
  };
};

/**
 * Creates a transaction function for atomic multi-statement operations.
 *
 * @param promiser - Worker promiser function for database communication
 * @returns Function to execute multiple statements atomically
 */
export const createTransactionFunction = (promiser: WorkerPromiseFunction) => {
  return async (
    statements: TransactionStatement[],
  ): Promise<Array<unknown>> => {
    // 1. Input validation
    if (!Array.isArray(statements) || statements.length === 0) {
      throw createWorkerError(
        new Error("Transaction requires at least one statement"),
        "Transaction validation",
      );
    }

    // 2. Begin transaction
    await executeWorkerRequest(promiser, "BEGIN TRANSACTION", undefined, false);

    try {
      const results: Array<unknown> = [];

      // 3. Execute each statement
      for (const stmt of statements) {
        const { sql, parameters, type } = stmt;
        const opType = type || detectOperationType(sql);

        let result: unknown;

        switch (opType) {
          case "query":
            const queryResult = await executeWorkerRequest(
              promiser,
              sql,
              parameters,
              true,
            );
            result = Array.isArray(queryResult.resultRows)
              ? queryResult.resultRows
              : [];
            break;

          case "execute":
            const execResult = await executeWorkerRequest(
              promiser,
              sql,
              parameters,
              false,
            );
            result = {
              changes: execResult.changes || execResult.changeCount || 0,
              lastInsertRowid:
                execResult.lastInsertRowid ||
                execResult.lastInsertRowId ||
                null,
            };
            break;

          case "run":
          default:
            await executeWorkerRequest(promiser, sql, parameters, false);
            result = undefined;
            break;
        }

        results.push(result);
      }

      // 4. Commit transaction
      await executeWorkerRequest(promiser, "COMMIT", undefined, false);

      return results;
    } catch (error) {
      // 5. Rollback on error
      try {
        await executeWorkerRequest(promiser, "ROLLBACK", undefined, false);
      } catch (rollbackError) {
        // Log rollback error but throw original error
        console.error("Failed to rollback transaction:", rollbackError);
      }

      throw createWorkerError(error, "Transaction execution");
    }
  };
};

/**
 * Detects operation type from SQL statement for transaction handling.
 *
 * @param sql - SQL statement to analyze
 * @returns Operation type for transaction handling
 */
const detectOperationType = (sql: string): "query" | "execute" | "run" => {
  const opType = analyzeSqlOperation(sql);

  if (opType === "select") {
    return "query";
  }

  if (["insert", "update", "delete"].includes(opType)) {
    return "execute";
  }

  return "run";
};
