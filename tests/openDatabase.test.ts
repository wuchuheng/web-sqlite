import { beforeEach, describe, expect, it } from "vitest";
import openDatabase from "../src/main";

describe("openDatabase", () => {
  beforeEach(() => {
    // Ensure each test starts without cached wasm state interfering with results.
    delete (globalThis as typeof globalThis & { sqlite3InitModuleState?: unknown }).sqlite3InitModuleState;
  });

  it("exec returns typed rows", async () => {
    const dbName = `mem-${crypto.randomUUID?.() ?? Date.now().toString(36)}.db`;
    const db = await openDatabase(dbName);

    try {
      await db.exec("CREATE TABLE items (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL)");
      await db.exec("INSERT INTO items (name) VALUES (?)", { parameters: ["widget"] });

      const rows = await db.exec<Array<{ id: number; name: string }>>(
        "SELECT id, name FROM items ORDER BY id",
      );

      expect(rows).toEqual([{ id: 1, name: "widget" }]);
    } finally {
      await db.close();
    }
  });

  it("persists to OPFS across reloads", async function persistTest() {
    if (!(await isOpfsAvailable())) {
      this.skip();
    }

    const uniqueName = `persist-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`}.db`;
    const db = await openDatabase(uniqueName);

    try {
      await db.exec("CREATE TABLE notes (id INTEGER PRIMARY KEY AUTOINCREMENT, body TEXT NOT NULL)");
      await db.exec("INSERT INTO notes (body) VALUES ($body)", { parameters: { $body: "persistent" } });
    } finally {
      await db.close();
    }

    const reopened = await openDatabase(uniqueName);
    try {
      const rows = await reopened.exec<Array<{ id: number; body: string }>>(
        "SELECT id, body FROM notes ORDER BY id",
      );
      expect(rows).toEqual([{ id: 1, body: "persistent" }]);
    } finally {
      await reopened.close();
      await removeOpfsFile(uniqueName);
    }
  });
});

const isOpfsAvailable = async (): Promise<boolean> => {
  if (typeof navigator === "undefined" || typeof navigator.storage?.getDirectory !== "function") {
    return false;
  }

  try {
    const root = await navigator.storage.getDirectory();
    const marker = `web-sqlite-opfs-${Date.now()}-${Math.random()}`;
    const handle = await root.getFileHandle(marker, { create: true });
    await root.removeEntry(marker);
    return Boolean(handle);
  } catch {
    return false;
  }
};

const removeOpfsFile = async (filename: string): Promise<void> => {
  if (typeof navigator === "undefined" || typeof navigator.storage?.getDirectory !== "function") {
    return;
  }

  const normalized = filename.replace(/^\/+/, "");
  const segments = normalized.split("/").filter(Boolean);
  if (segments.length === 0) {
    return;
  }

  let directory = await navigator.storage.getDirectory();
  for (let index = 0; index < segments.length - 1; index += 1) {
    try {
      directory = await directory.getDirectoryHandle(segments[index], { create: false });
    } catch {
      return;
    }
  }

  try {
    await directory.removeEntry(segments[segments.length - 1]);
  } catch {
    // Ignore cleanup failures.
  }
};
