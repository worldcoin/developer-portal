// #region Mocks
const getAPIServiceGraphqlClient = jest.fn();
jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: (...args: unknown[]) =>
    getAPIServiceGraphqlClient(...args),
}));

const UpdatePermissions = jest.fn();
jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/Advanced/page/SetupForm/graphql/server/update-permissions.generated",
  () => ({
    getSdk: () => ({ UpdatePermissions }),
  }),
);

jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/Advanced/page/SetupForm/graphql/server/update-setup.generated",
  () => ({
    getSdk: () => ({ UpdateSetup: jest.fn() }),
  }),
);

const getIsUserAllowedToUpdateAppMetadata = jest.fn();
jest.mock("@/lib/permissions", () => ({
  getIsUserAllowedToUpdateAppMetadata: (...args: unknown[]) =>
    getIsUserAllowedToUpdateAppMetadata(...args),
}));

jest.mock("@/lib/server-utils", () => ({
  getPathFromHeaders: () => "/teams/team_1/apps/app_1/mini-app/permissions",
  extractIdsFromPath: () => ({ Apps: "app_1", Teams: "team_1" }),
}));

import { validateAndUpdatePermissionsServerSide } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/Advanced/page/server/submit";
// #endregion

// #region Test Data
const appMetadataId = "meta_1234567890abcdef1234567890abcdef";
const permissions = {
  whitelisted_addresses: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  is_whitelist_disabled: false,
  associated_domains: "https://example.com",
  contracts: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  permit2_tokens: "0xcccccccccccccccccccccccccccccccccccccccc",
  can_import_all_contacts: false,
  can_use_attestation: false,
  max_notifications_per_day: 1,
  is_allowed_unlimited_notifications: false,
};
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  getAPIServiceGraphqlClient.mockResolvedValue({});
  getIsUserAllowedToUpdateAppMetadata.mockResolvedValue(true);
  UpdatePermissions.mockResolvedValue({});
});

// #region Permissions-only mutation
describe("validateAndUpdatePermissionsServerSide", () => {
  it("updates permission fields without writing app_mode", async () => {
    const result = await validateAndUpdatePermissionsServerSide(
      permissions,
      appMetadataId,
    );

    expect(result).toEqual({
      success: true,
      message: "Mini App permissions updated successfully",
    });
    expect(UpdatePermissions).toHaveBeenCalledWith({
      app_metadata_id: appMetadataId,
      whitelisted_addresses: `{${JSON.stringify(permissions.whitelisted_addresses)}}`,
      associated_domains: `{${JSON.stringify(permissions.associated_domains)}}`,
      contracts: `{${JSON.stringify(permissions.contracts)}}`,
      permit2_tokens: `{${JSON.stringify(permissions.permit2_tokens)}}`,
      can_import_all_contacts: false,
      can_use_attestation: false,
      is_allowed_unlimited_notifications: false,
      max_notifications_per_day: 1,
    });
    expect(UpdatePermissions.mock.calls[0][0]).not.toHaveProperty("app_mode");
  });
});
// #endregion
