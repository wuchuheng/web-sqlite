# web-sqlite

A TypeScript-first runtime for working with SQLite compiled to WebAssembly from the browser or other Web runtimes. The library focuses on a small, expressive surface area inspired by the 2025 `frension` style: a single `openDatabase` entry point that returns functional helpers such as `exec`.

> **Status**: early design preview. The API surface is stable, but the underlying WASM plumbing is still being implemented.

## Installation

```bash
pnpm add web-sqlite
```

## Usage

```ts
import websqlite from "web-sqlite";

type Row = {
  id: number;
  name: string;
};

const sqlite = await websqlite("app.sqlite3");
const rows = await sqlite.exec<Row[]>("select id, name from users");
```

### Passing parameters

`exec` accepts positional or named parameters via the `parameters` option:

```ts
const users = await sqlite.exec<Array<{ id: number; name: string }>>(
  "select id, name from users where active = ?",
  { parameters: [1] },
);

const projects = await sqlite.exec<Array<{ id: number; name: string }>>(
  "select id, name from projects where slug = :slug",
  { parameters: { slug: "web-sqlite" } },
);
```

### Custom loaders

If you need custom fetching logic (for example, using the File System Access API), provide a `loader` function when opening the database. It will receive whatever you passed as the `source` argument and must resolve to an `ArrayBuffer`.

```ts
const sqlite = await websqlite(myFileHandle, {
  loader: async (source) => {
    if (source instanceof FileSystemFileHandle) {
      const file = await source.getFile();
      return file.arrayBuffer();
    }

    throw new TypeError("Unsupported loader source");
  },
});
```

## API reference

### `openDatabase(source, options?)`

Returns a promise that resolves to a `Database` instance exposing:

- `exec<TResult = Array<Record<string, unknown>>>(sql: string, options?: ExecOptions): Promise<TResult>` — execute a SQL statement with optional bind parameters and receive the result typed according to `TResult`.

Additional helpers such as transactions and prepared statements will be added in future iterations.

## License

MIT © wuchuheng
