// Regression tests for the "mini app => category != External" invariant on
// the MiniAppConfiguration app-mode write path (follow-up to #2108/#2122).
//
// Those PRs enforced the invariant on every app_mode write path; the redesign
// added this one (the Configuration page's Mini App section). These tests pin
// that switching to mini-app clears a lingering "External" category in the
// same UpdateAppMode request — and that switching to external does not.

// #region Mocks
const getAPIServiceGraphqlClient = jest.fn();
jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: (...args: unknown[]) =>
    getAPIServiceGraphqlClient(...args),
}));

const UpdateAppMode = jest.fn();
jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/MiniAppConfiguration/graphql/server/update-app-mode.generated",
  () => ({
    getSdk: () => ({ UpdateAppMode }),
  }),
);

const getIsUserAllowedToUpdateAppMetadata = jest.fn();
jest.mock("@/lib/permissions", () => ({
  getIsUserAllowedToUpdateAppMetadata: (...args: unknown[]) =>
    getIsUserAllowedToUpdateAppMetadata(...args),
}));

jest.mock("@/lib/server-utils", () => ({
  getPathFromHeaders: () => "/teams/team_1/apps/app_1/configuration",
  extractIdsFromPath: () => ({ Apps: "app_1", Teams: "team_1" }),
}));

const errorFormAction = jest.fn();
jest.mock("@/api/helpers/errors", () => ({
  errorFormAction: (args: { message: string }) => errorFormAction(args),
}));

import { updateAppMode } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/MiniAppConfiguration/server/submit";
// #endregion

// #region Test Data
const appMetadataId = "meta_1234567890abcdef1234567890abcdef";
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  getAPIServiceGraphqlClient.mockResolvedValue({});
  getIsUserAllowedToUpdateAppMetadata.mockResolvedValue(true);
  UpdateAppMode.mockResolvedValue({});
  errorFormAction.mockImplementation(({ message }: { message: string }) => ({
    success: false,
    message,
  }));
});

// #region External category is cleared exactly when switching to mini-app
describe("updateAppMode [clear_external_category invariant]", () => {
  it("clears a lingering External category when switching to mini-app", async () => {
    const result = await updateAppMode(appMetadataId, "mini-app");

    expect(result).toEqual({
      success: true,
      message: "App mode updated successfully",
    });
    expect(UpdateAppMode).toHaveBeenCalledWith({
      app_metadata_id: appMetadataId,
      app_mode: "mini-app",
      clear_external_category: true,
    });
  });

  it("leaves the category untouched when switching to external", async () => {
    const result = await updateAppMode(appMetadataId, "external");

    expect(result).toEqual({
      success: true,
      message: "App mode updated successfully",
    });
    expect(UpdateAppMode).toHaveBeenCalledWith({
      app_metadata_id: appMetadataId,
      app_mode: "external",
      clear_external_category: false,
    });
  });
});
// #endregion

// #region Guard branches
describe("updateAppMode [guards]", () => {
  it("rejects without writing when the user lacks permission", async () => {
    getIsUserAllowedToUpdateAppMetadata.mockResolvedValue(false);

    const result = await updateAppMode(appMetadataId, "mini-app");

    expect(result).toEqual({
      success: false,
      message: "The user does not have permission to update this app metadata",
    });
    expect(UpdateAppMode).not.toHaveBeenCalled();
  });

  it("surfaces a form error when the mutation fails", async () => {
    UpdateAppMode.mockRejectedValue(new Error("hasura down"));

    const result = await updateAppMode(appMetadataId, "mini-app");

    expect(result).toEqual({
      success: false,
      message: "An error occurred while updating the app mode",
    });
    expect(errorFormAction).toHaveBeenCalledWith(
      expect.objectContaining({
        additionalInfo: {
          app_metadata_id: appMetadataId,
          app_mode: "mini-app",
        },
        logLevel: "error",
      }),
    );
  });
});
// #endregion
