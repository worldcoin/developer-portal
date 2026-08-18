import { constants, expect, test } from "@e2e/helpers";
import { deleteAppsForTeam } from "@e2e/helpers/hasura/app";

test.describe("App", () => {
  test.afterEach(async () => {
    await deleteAppsForTeam(constants.teamId);
  });

  test("Create an App", async ({ page }) => {
    test.slow();

    const appName = "World Test!";

    await page.goto("/");
    await expect(page.getByText("Let's create your first app.")).toBeVisible();
    await page.getByTestId("button-create-new-app").click();

    await expect(
      page.getByRole("heading", { name: "Create a new app" }),
    ).toBeVisible({
      timeout: 90_000,
    });
    await expect(page.getByTestId("button-create-app")).toBeDisabled();

    await page.fill("[data-testid='input-app-name']", appName);
    await expect(page.getByTestId("button-create-app")).toBeEnabled();
    await page.getByTestId("button-create-app").click();

    await expect(page).toHaveURL(
      new RegExp(`/teams/${constants.teamId}/apps/app_[a-f0-9]+/world-id$`),
    );
    await expect(
      page.getByRole("heading", { name: "World ID Configuration" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Register relying party" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create action" }),
    ).toHaveCount(0);
    // The arrival toast ("New app <name> was created") also renders the app
    // name, so the bare text query is ambiguous while it is on screen.
    await expect(page.getByText(appName).first()).toBeVisible();
  });
});
