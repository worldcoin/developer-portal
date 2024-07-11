import { constants, expect, test } from "@e2e/helpers";
import { createApp, deleteAppsForTeam } from "@e2e/helpers/hasura/app";
import { qase } from "playwright-qase-reporter";

test.describe("Action", () => {
  const appName = "World Test!";
  let appId: string;

  test.beforeAll(async () => {
    appId = await createApp(appName);
  });

  test.afterAll(async () => {
    await deleteAppsForTeam(constants.teamId);
  });

  test("Create an Action", async ({ page }) => {
    qase.id(3);

    await page.goto(`/teams/${constants.teamId}/apps/${appId}/actions`);
    await page.click("[data-testid='button-create-action']");

    await expect(page.getByText("Create an incognito action")).toBeVisible();
    await expect(page.getByTestId("select-max-verifications")).toHaveText(
      "Unique",
    );
    await expect(page.getByTestId("button-create-action-modal")).toBeDisabled();

    await page.fill("[data-testid='input-name']", "Test Action #1");
    await expect(page.getByTestId("input-id")).toHaveValue("test-action-1");
    await page.fill("[data-testid='input-description']", "Hello, world!");
    await page.click("[data-testid='button-create-action-modal']");

    await expect(
      page.getByText("Test Action #1", { exact: true }),
    ).toBeVisible();

    await expect(page.locator(`input[placeholder='${appId}']`)).toBeVisible();
    await page.waitForTimeout(1000);
  });
});
