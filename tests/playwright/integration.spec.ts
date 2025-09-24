import { expect, test } from "@playwright/test";

const REQUIRED_ASSETS = [
  "sqlite3-worker1-bundler-friendly.mjs",
  "sqlite3-bundler-friendly.mjs",
  "sqlite3.wasm",
];

const ASSET_TIMEOUT_MS = 30_000;

type AssetTracker = {
  done: boolean;
  resolve: () => void;
  reject: (error: Error) => void;
};

test("loads sqlite worker assets via bundler", async ({ page }) => {
  const pageErrors: Error[] = [];
  const assetTrackers = new Map<string, AssetTracker>();
  const assetPromises = REQUIRED_ASSETS.map((assetName) => {
    return new Promise<void>((resolve, reject) => {
      let timeoutId: ReturnType<typeof setTimeout>;
      const tracker: AssetTracker = {
        done: false,
        resolve: () => {
          if (tracker.done) {
            return;
          }

          tracker.done = true;
          clearTimeout(timeoutId);
          assetTrackers.delete(assetName);
          resolve();
        },
        reject: (error: Error) => {
          if (tracker.done) {
            return;
          }

          tracker.done = true;
          clearTimeout(timeoutId);
          assetTrackers.delete(assetName);
          reject(error);
        },
      };

      timeoutId = setTimeout(() => {
        tracker.reject(new Error(`Timed out waiting for ${assetName} to load`));
      }, ASSET_TIMEOUT_MS);

      assetTrackers.set(assetName, tracker);
    });
  });

  page.on("pageerror", (error) => {
    pageErrors.push(error);
  });

  page.on("response", (response) => {
    const url = response.url();

    for (const assetName of REQUIRED_ASSETS) {
      if (!url.includes(assetName)) {
        continue;
      }

      const tracker = assetTrackers.get(assetName);
      if (!tracker || tracker.done) {
        continue;
      }

      if (!response.ok()) {
        tracker.reject(
          new Error(
            `Failed to load ${assetName}: ${response.status()} ${response.statusText()}`,
          ),
        );
        return;
      }

      tracker.resolve();
      return;
    }
  });

  page.on("requestfailed", (request) => {
    const url = request.url();

    for (const assetName of REQUIRED_ASSETS) {
      if (!url.includes(assetName)) {
        continue;
      }

      const tracker = assetTrackers.get(assetName);
      if (!tracker || tracker.done) {
        continue;
      }

      const failure = request.failure();
      const failureMessage = failure?.errorText ?? "unknown error";

      tracker.reject(
        new Error(`Request failed for ${assetName}: ${failureMessage}`),
      );
      return;
    }
  });

  await page.goto("/");
  await expect(page.getByTestId("status")).toHaveText("success", { timeout: 90000 });
  await expect(page.getByTestId("error")).toHaveCount(0);

  await Promise.all(assetPromises);

  expect(pageErrors, "There should be no page errors when loading wasm assets").toHaveLength(0);
});
