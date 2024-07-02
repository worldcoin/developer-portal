import { constants, expect, test } from "@e2e/helpers";
import { deleteAppsForTeam } from "@e2e/helpers/hasura/app";

test.describe("App", () => {
  test.afterAll(async () => {
    await deleteAppsForTeam(constants.teamId);
  });

  test("Create an App", async ({ page }) => {
    const appName = "World Test!";

    await page.goto("/");
    await expect(page.getByText("Build your first project")).toBeVisible();
    await page.click("[data-testid='button-create-an-app']");

    await expect(page.getByTestId("radio-build-staging")).toBeChecked();
    await expect(page.getByTestId("radio-verification-cloud")).toBeChecked();
    await expect(page.getByTestId("button-create-app")).toBeDisabled();

    await page.fill("[data-testid='input-app-name']", appName);
    await expect(page.getByTestId("button-create-app")).toBeEnabled();
    await page.getByTestId("button-create-app").click();

    await expect(
      page.getByText("Create your first incognito action"),
    ).toBeVisible();
    await expect(page.getByTestId("title-app-1")).toHaveText(appName);
    await expect(page.getByTestId("title-app-1")).toBeVisible();
  });
});
