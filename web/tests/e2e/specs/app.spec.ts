import { expect, test } from "@e2e/helpers";

test.describe("App", () => {
  test("Create an App", async ({ page }) => {
    await page.goto("/create-team");
    await expect(
      page.locator("h1", { hasText: "Create a new team" }),
    ).toBeVisible();
  });
});
