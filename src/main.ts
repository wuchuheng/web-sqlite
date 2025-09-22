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

  /**
   * Close the underlying SQLite database handle and release its resources.
   */
  close(): Promise<void>;
}

/**
 * Possible inputs pointing at the underlying SQLite database source.
 */
export type DatabaseSource = string | URL | ArrayBuffer | Uint8Array | ArrayBufferView;

const SQLITE_WASM_BASE_URL = new URL("./sqlite-wasm/jswasm/", import.meta.url);
const SQLITE_WASM_ASSET_URL = new URL("./sqlite-wasm/jswasm/sqlite3.wasm", import.meta.url).toString();

/**
 * Options accepted by {@link openDatabase}.
 */
export interface OpenDatabaseOptions {
  /**
   * Custom loader responsible for turning {@link DatabaseSource} into raw bytes.
   * This is primarily useful for environments that require bespoke fetching logic.
   */
  readonly loader?: (source: DatabaseSource) => Promise<ArrayBuffer>;

  /**
   * Optional filename override used when persisting the database to a virtual
   * filesystem such as OPFS. If omitted, the name is derived from the provided
   * {@link DatabaseSource}.
   */
  readonly filename?: string;
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

  const sqlite3 = await loadSqliteRuntime();
  const { oo1 } = sqlite3 ?? {};

  if (!oo1?.DB) {
    throw new Error("web-sqlite: The sqlite3 WASM module failed to expose the oo1.DB API.");
  }

  const dbFilename = deriveDatabaseFilename(source, options);
  const canUseOpfs = canUseOpfsPersistence(sqlite3);
  const DatabaseCtor = canUseOpfs && oo1.OpfsDb ? oo1.OpfsDb : oo1.DB;
  const shouldLoadSeedBytes = await shouldSeedDatabase(sqlite3, DatabaseCtor, dbFilename);
  const hasSeedSource = shouldLoadSeedBytes && hasSeedPayload(source, options);
  const seedBytes = hasSeedSource
    ? await resolveDatabaseSource(source, options)
    : undefined;

  if (isOpfsConstructor(sqlite3, DatabaseCtor)) {
    await ensureOpfsPath(dbFilename);
  }

  if (seedBytes) {
    await injectSeedBytes(sqlite3, DatabaseCtor, dbFilename, seedBytes);
  }

  const dbHandle = new DatabaseCtor(dbFilename, "c");

  const exec: Database["exec"] = async <TResult>(sql: string, execOptions?: ExecOptions) => {
    const result = dbHandle.exec({
      sql,
      bind: execOptions?.parameters,
      returnValue: "resultRows",
      rowMode: "object",
    });

    return result as TResult;
  };

  const close = async () => {
    dbHandle.close();
  };

  return { exec, close } satisfies Database;
};

export default openDatabase;

interface Sqlite3Static {
  readonly oo1: {
    readonly DB: Sqlite3DatabaseConstructor;
    readonly OpfsDb?: Sqlite3OpfsDatabaseConstructor;
  };
  readonly FS?: Sqlite3FileSystem;
}

type Sqlite3DatabaseConstructor = new (...args: ReadonlyArray<unknown>) => Sqlite3DatabaseHandle;

interface Sqlite3OpfsDatabaseConstructor extends Sqlite3DatabaseConstructor {
  importDb(name: string, bytes: ArrayBuffer | Uint8Array): Promise<number> | number;
}

interface Sqlite3DatabaseHandle {
  exec(config: {
    readonly sql: string;
    readonly bind?: SqlParameters;
    readonly returnValue?: string;
    readonly rowMode?: string;
  }): unknown;
  close(): void;
}

interface Sqlite3FileSystem {
  analyzePath(path: string): { readonly exists: boolean };
  mkdirTree?(path: string): void;
  mkdir(path: string): void;
  writeFile(path: string, data: Uint8Array): void;
}

let sqlite3InstancePromise: Promise<Sqlite3Static> | undefined;

const loadSqliteRuntime = async (): Promise<Sqlite3Static> => {
  if (!sqlite3InstancePromise) {
    sqlite3InstancePromise = import("./sqlite-wasm/jswasm/sqlite3-bundler-friendly.mjs").then(
      async ({ default: sqlite3InitModule }) => {
        return sqlite3InitModule({
          locateFile: (file: string) =>
            file === "sqlite3.wasm"
              ? SQLITE_WASM_ASSET_URL
              : new URL(file, SQLITE_WASM_BASE_URL).toString(),
        });
      },
    );
  }

  return sqlite3InstancePromise;
};

const deriveDatabaseFilename = (
  source: DatabaseSource,
  options?: OpenDatabaseOptions,
): string => {
  if (options?.filename) {
    return sanitizeFilename(options.filename);
  }

  if (source instanceof URL) {
    return filenameFromUrl(source);
  }

  if (typeof source === "string") {
    if (looksLikeUrl(source)) {
      return filenameFromUrl(resolveUrl(source));
    }
    return sanitizeFilename(source);
  }

  return "database.sqlite3";
};

const sanitizeFilename = (name: string): string => {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : "database.sqlite3";
};

const filenameFromUrl = (value: URL): string => {
  const pathname = value.pathname.replace(/\/+$/, "");
  const lastSegment = pathname.split("/").filter(Boolean).pop();
  return sanitizeFilename(lastSegment ?? "database.sqlite3");
};

const hasSeedPayload = (source: DatabaseSource, options?: OpenDatabaseOptions): boolean => {
  if (options?.loader) {
    return true;
  }

  if (source instanceof ArrayBuffer) {
    return true;
  }

  if (ArrayBuffer.isView(source)) {
    return true;
  }

  if (source instanceof URL) {
    return true;
  }

  return typeof source === "string" && looksLikeUrl(source);
};

const looksLikeUrl = (value: string): boolean => /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value.trim());

const resolveDatabaseSource = async (
  source: DatabaseSource,
  options?: OpenDatabaseOptions,
): Promise<ArrayBuffer> => {
  if (options?.loader) {
    const result = await options.loader(source);
    if (!(result instanceof ArrayBuffer)) {
      throw new TypeError("web-sqlite: Custom database loaders must resolve to an ArrayBuffer.");
    }
    return result;
  }

  if (source instanceof ArrayBuffer) {
    return source;
  }

  if (ArrayBuffer.isView(source)) {
    const view = source as ArrayBufferView;
    const bytes = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
    return bytes.slice().buffer;
  }

  if (source instanceof URL) {
    return fetchArrayBuffer(source);
  }

  if (typeof source === "string" && looksLikeUrl(source)) {
    return fetchArrayBuffer(resolveUrl(source));
  }

  throw new TypeError("web-sqlite: Unable to resolve the provided database source to raw bytes.");
};

const fetchArrayBuffer = async (input: URL | string): Promise<ArrayBuffer> => {
  const response = await fetch(input instanceof URL ? input.toString() : input);
  if (!response.ok) {
    throw new Error(
      `web-sqlite: Failed to fetch database source (${response.status} ${response.statusText}).`,
    );
  }
  return response.arrayBuffer();
};

const resolveUrl = (value: string): URL => {
  try {
    return new URL(value);
  } catch {
    if (typeof document !== "undefined" && document.baseURI) {
      return new URL(value, document.baseURI);
    }
    if (typeof location !== "undefined" && location.href) {
      return new URL(value, location.href);
    }
    throw new TypeError(`web-sqlite: Cannot resolve relative URL \"${value}\".`);
  }
};

const shouldSeedDatabase = async (
  sqlite3: Sqlite3Static,
  DatabaseCtor: Sqlite3DatabaseConstructor,
  filename: string,
): Promise<boolean> => {
  if (isOpfsConstructor(sqlite3, DatabaseCtor)) {
    return !(await opfsFileExists(filename));
  }

  const fs = sqlite3.FS;
  if (fs) {
    return !fs.analyzePath(filename).exists;
  }

  return true;
};

const injectSeedBytes = async (
  sqlite3: Sqlite3Static,
  DatabaseCtor: Sqlite3DatabaseConstructor,
  filename: string,
  bytes: ArrayBuffer,
): Promise<void> => {
  if (isOpfsConstructor(sqlite3, DatabaseCtor)) {
    await Promise.resolve(DatabaseCtor.importDb(filename, bytes));
    return;
  }

  const fs = sqlite3.FS;
  if (fs) {
    ensureMemfsPath(fs, filename);
    fs.writeFile(filename, new Uint8Array(bytes));
    return;
  }

  throw new Error("web-sqlite: Unable to seed the database bytes without a filesystem backend.");
};

const ensureMemfsPath = (fs: Sqlite3FileSystem, filename: string): void => {
  const segments = filename.split("/");
  segments.pop();
  if (segments.length === 0) {
    return;
  }

  let current = "";
  for (const segment of segments) {
    if (!segment) {
      continue;
    }
    current = current ? `${current}/${segment}` : segment;
    if (!fs.analyzePath(current).exists) {
      if (fs.mkdirTree) {
        fs.mkdirTree(current);
      } else {
        fs.mkdir(current);
      }
    }
  }
};

const canUseOpfsPersistence = (sqlite3: Sqlite3Static): boolean =>
  Boolean(
    sqlite3.oo1?.OpfsDb &&
      typeof navigator !== "undefined" &&
      typeof navigator.storage?.getDirectory === "function",
  );

const isOpfsConstructor = (
  sqlite3: Sqlite3Static,
  ctor: Sqlite3DatabaseConstructor,
): ctor is Sqlite3OpfsDatabaseConstructor => sqlite3.oo1?.OpfsDb === ctor;

const opfsFileExists = async (filename: string): Promise<boolean> => {
  if (typeof navigator === "undefined" || typeof navigator.storage?.getDirectory !== "function") {
    return false;
  }

  try {
    const normalized = filename.replace(/^\/+/, "");
    const segments = normalized.split("/").filter(Boolean);
    if (segments.length === 0) {
      return false;
    }

    let directory = await navigator.storage.getDirectory();
    for (let index = 0; index < segments.length - 1; index += 1) {
      directory = await directory.getDirectoryHandle(segments[index], { create: false });
    }

    await directory.getFileHandle(segments[segments.length - 1], { create: false });
    return true;
  } catch {
    return false;
  }
};

const ensureOpfsPath = async (filename: string): Promise<void> => {
  if (typeof navigator === "undefined" || typeof navigator.storage?.getDirectory !== "function") {
    return;
  }

  const normalized = filename.replace(/^\/+/, "");
  const segments = normalized.split("/").filter(Boolean);
  if (segments.length <= 1) {
    return;
  }

  let directory = await navigator.storage.getDirectory();
  for (let index = 0; index < segments.length - 1; index += 1) {
    directory = await directory.getDirectoryHandle(segments[index], { create: true });
  }
};
