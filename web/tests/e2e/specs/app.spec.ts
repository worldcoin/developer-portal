import { constants, expect, test } from "@e2e/helpers";
import { deleteAppsForTeam } from "@e2e/helpers/hasura/app";
import { qase } from "playwright-qase-reporter";

test.describe("App", () => {
  test.afterEach(async () => {
    await deleteAppsForTeam(constants.teamId);
  });

  test("Create an App", async ({ page }) => {
    qase.id(2);

    const appName = "World Test!";

    await page.goto("/");
    await expect(page.getByText("Let's create your first app.")).toBeVisible();
    await page.getByTestId("button-create-new-app").click();

    await expect(page.getByText("Setup your app")).toBeVisible();
    await expect(page.getByTestId("button-create-app")).toBeDisabled();

    await page.fill("[data-testid='input-app-name']", appName);
    await expect(page.getByTestId("button-create-app")).toBeEnabled();
    await page.getByTestId("button-create-app").click();

    await expect(page).toHaveURL(
      new RegExp(`/teams/${constants.teamId}/apps/app_[a-f0-9]+/world-id-4-0$`),
    );
    await expect(page.getByText("Set up World ID")).toBeVisible();
    await expect(page.getByText(appName)).toBeVisible();
  });
});
