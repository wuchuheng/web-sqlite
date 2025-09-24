import { useEffect, useState } from "react";
import webSqlite from "@wuchuheng/web-sqlite";

type Status = "pending" | "success" | "error";

const App = () => {
  const [status, setStatus] = useState<Status>("pending");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const run = async () => {
      try {
        const db = await webSqlite("playwright.sqlite3");
        await db.run("CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY, value TEXT)");
        await db.close();

        if (isActive) {
          setStatus("success");
        }
      } catch (error) {
        if (!isActive) {
          return;
        }

        setStatus("error");
        if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage(String(error));
        }
      }
    };

    run();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <main style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>Web SQLite Integration Test</h1>
      <p data-testid="status">{status}</p>
      {errorMessage ? (
        <pre data-testid="error" style={{ color: "red" }}>
          {errorMessage}
        </pre>
      ) : null}
    </main>
  );
};

export default App;
