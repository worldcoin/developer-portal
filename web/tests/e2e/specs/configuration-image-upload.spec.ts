import { constants, expect, test } from "@e2e/helpers";
import { deleteAppsForTeam } from "@e2e/helpers/hasura/app";
import type { Frame, Locator, Page } from "@playwright/test";
import path from "path";

const imageFixturePath = path.resolve(process.cwd(), "public/logo.png");

const waitForGraphqlOperation = (page: Page, operationName: string) =>
  page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.request().postData()?.includes(operationName) === true,
  );

const sectionFileInput = (page: Page, title: string) =>
  page
    .getByText(title, { exact: true })
    .locator("xpath=../..")
    .locator("input[type=file]");

const uploadWithoutReload = async (
  page: Page,
  operationName: string,
  upload: () => Promise<void>,
) => {
  const initialUrl = page.url();
  let didNavigate = false;
  const onFrameNavigated = (frame: Frame) => {
    if (frame === page.mainFrame()) didNavigate = true;
  };
  page.on("framenavigated", onFrameNavigated);

  try {
    const persisted = waitForGraphqlOperation(page, operationName);
    await upload();
    const response = await persisted;

    expect(response.ok()).toBe(true);
    // A reload triggered from a mutation callback is scheduled after its
    // GraphQL response, so keep the frame listener alive through that turn.
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(initialUrl);
    expect(didNavigate).toBe(false);
  } finally {
    page.off("framenavigated", onFrameNavigated);
  }
};

const uploadWithCrop = async (
  page: Page,
  input: Locator,
  cropDialogTitle: string,
  operationName: string,
) => {
  await uploadWithoutReload(page, operationName, async () => {
    await input.setInputFiles(imageFixturePath);
    await expect(
      page.getByText(cropDialogTitle, { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Crop & upload" }).click();
    await expect(page.getByText(cropDialogTitle, { exact: true })).toBeHidden();
  });
};

test.describe("Configuration image uploads", () => {
  test.afterEach(async () => {
    await deleteAppsForTeam(constants.teamId);
  });

  test("uploads a real image through every field without reloading the configuration page", async ({
    page,
  }) => {
    test.slow();

    await page.goto("/");
    await page.getByTestId("button-create-new-app").click();
    await page
      .getByTestId("input-app-name")
      .fill(`Image upload regression ${Date.now()}`);
    await page.getByTestId("button-create-app").click();

    await expect(page).toHaveURL(
      new RegExp(`/teams/${constants.teamId}/apps/app_[a-f0-9]+/world-id-4-0$`),
    );
    const appId = page.url().match(/apps\/(app_[a-f0-9]+)/)?.[1];
    expect(appId).toBeDefined();

    await page.goto(`/teams/${constants.teamId}/apps/${appId}/configuration`);
    await expect(
      page.getByRole("heading", { name: "Basic information" }),
    ).toBeVisible();

    await uploadWithoutReload(page, "UpdateLogo", async () => {
      await page.getByLabel("Upload app logo").setInputFiles(imageFixturePath);
    });

    await page
      .locator('input[name="app-mode"][value="mini-app"]')
      .check({ force: true });
    await expect(
      page.locator('input[name="app-mode"][value="mini-app"]'),
    ).toBeChecked();

    await page
      .getByRole("button", { name: "Continue to Store listing" })
      .click();
    await expect(
      page.getByRole("heading", { name: "Store listing" }),
    ).toBeVisible();

    await uploadWithCrop(
      page,
      sectionFileInput(page, "Content card image"),
      "Crop content card image",
      "UpdateContentCardImage",
    );

    await page
      .getByRole("button", { name: "Continue to Availability" })
      .click();
    await page
      .getByRole("button", { name: "Continue to Localized content" })
      .click();
    await expect(
      page.getByRole("heading", { name: "Localized content" }),
    ).toBeVisible();

    await uploadWithoutReload(
      page,
      "UpsertLocalisedShowcaseImages",
      async () => {
        await sectionFileInput(page, "Showcase images").setInputFiles(
          imageFixturePath,
        );
        await expect(page.locator('img[src^="blob:"]')).toBeVisible();
      },
    );
    await expect(
      page.getByText("Showcase image uploaded successfully"),
    ).toBeVisible();

    await uploadWithCrop(
      page,
      sectionFileInput(page, "Meta tag image"),
      "Crop meta tag image",
      "UpsertLocalisedMetaTagImage",
    );
    await expect(
      page.getByText("Meta tag image uploaded successfully"),
    ).toBeVisible();
  });
});
