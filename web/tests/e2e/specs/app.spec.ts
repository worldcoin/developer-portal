import { constants, expect, test } from "@e2e/helpers";
import { deleteAppsForTeam } from "@e2e/helpers/hasura/app";
import { qase } from "playwright-qase-reporter";

test.describe("App", () => {
  test.afterAll(async () => {
    await deleteAppsForTeam(constants.teamId);
  });

  test("Create an App", async ({ page }) => {
    qase.id(2);

    const appName = "World Test!";

    await page.goto("/");
    await expect(page.getByText("Build your first project")).toBeVisible();
    await page.click("[data-testid='button-create-an-app']");

    await expect(page.getByTestId("radio-verification-cloud")).toBeChecked();
    await expect(page.getByTestId("button-create-app")).toBeDisabled();

    await page.fill("[data-testid='input-app-name']", appName);
    await page.click("[data-testid='button-select-category']");
    await page.locator("li", { hasText: "Social" }).click();
    await expect(page.getByTestId("button-create-app")).toBeEnabled();
    await page.getByTestId("button-create-app").click();

    expect(page).toHaveURL(/.*configuration/);
    await expect(page.getByTestId("title-app-name")).toHaveText(appName);
  });
});
