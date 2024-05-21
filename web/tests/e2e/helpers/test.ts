import { test as base, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

export const test = base.extend<{}, { workerStorageState: string }>({
  storageState: ({ workerStorageState }, use) => use(workerStorageState),

  // Authenticate once per worker with a worker-scoped fixture
  workerStorageState: [
    async ({ browser }, use) => {
      if (!process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD) {
        throw new Error("Missing test user credentials!");
      }

      // Use parallelIndex as a unique identifier for each worker
      const id = test.info().parallelIndex;
      const fileName = path.resolve(
        test.info().project.outputDir,
        `.auth/${id}.json`,
      );

      if (fs.existsSync(fileName)) {
        // Reuse existing authentication state if any
        await use(fileName);
        return;
      }

      // Authentication steps via Auth0 UI
      const context = await browser.newContext({
        userAgent: "Chrome/999.0.0.0",
        baseURL: process.env.NEXT_PUBLIC_APP_URL,
      });
      const page = await context.newPage();

      await page.goto("/login");
      await page.locator("[data-testid='button-log-in']").click();

      await page.locator("[name='email']").fill(process.env.TEST_USER_EMAIL);
      await page
        .locator("[name='password']")
        .fill(process.env.TEST_USER_PASSWORD);
      await page.locator("[name='submit']").click();

      await expect(page.getByText("Build your first project")).toBeVisible();

      // Save storage state of the authenticated browser
      await page.context().storageState({ path: fileName });
      await page.close();
      await use(fileName);
    },
    { scope: "worker" },
  ],
});

export { expect } from "@playwright/test";
