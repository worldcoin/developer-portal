import { expect, test } from "@e2e/helpers";

test.describe("App", () => {
  test("Create an App", async ({ page }) => {
    await page.goto("/create-team");
    await expect(page.getByText("Build your first project")).toBeVisible();
  });
});
