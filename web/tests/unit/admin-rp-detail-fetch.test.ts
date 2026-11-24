const mockFetchAdminRpDetails = jest.fn();

jest.mock("server-only", () => ({}));

jest.mock("@/api/helpers/graphql", () => ({
  getInternalDashboardGraphqlClient: jest.fn().mockResolvedValue({}),
}));

jest.mock(
  "@/scenes/Admin/rps/graphql/server/fetch-admin-rp-details.generated",
  () => ({
    getSdk: () => ({ FetchAdminRpDetails: mockFetchAdminRpDetails }),
  }),
);

jest.mock("@/lib/logger", () => ({
  logger: {
    error: jest.fn(),
  },
}));

import { logger } from "@/lib/logger";
import { fetchAdminRpDetails } from "@/scenes/Admin/rps/id/server/fetch-rp-details";

describe("admin RP detail fetch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("maps RP identity, app, and owning team", async () => {
    mockFetchAdminRpDetails.mockResolvedValue({
      rp_registration_by_pk: {
        app: {
          created_at: "2026-01-01",
          deleted_at: null,
          id: "app_current",
          name: "Current app",
          team: {
            created_at: "2026-01-01",
            deleted_at: null,
            id: "team_current",
            name: "Current team",
          },
          team_id: "team_current",
        },
        app_id: "app_current",
        created_at: "2026-01-02",
        mode: "managed",
        operation_hash: "0xabc",
        rp_id: "rp_0123456789abcdef",
        signer_address: "0x123",
        staging_operation_hash: null,
        staging_status: "registered",
        status: "registered",
        updated_at: "2026-01-03",
      },
    });

    await expect(fetchAdminRpDetails("rp_0123456789abcdef")).resolves.toEqual(
      expect.objectContaining({
        app: expect.objectContaining({ id: "app_current" }),
        rp: expect.objectContaining({
          mode: "managed",
          rp_id: "rp_0123456789abcdef",
          status: "registered",
        }),
        team: expect.objectContaining({
          id: "team_current",
          name: "Current team",
        }),
      }),
    );
  });

  it("returns null when the RP does not exist", async () => {
    mockFetchAdminRpDetails.mockResolvedValue({
      rp_registration_by_pk: null,
    });

    await expect(
      fetchAdminRpDetails("rp_0123456789abcdef"),
    ).resolves.toBeNull();
  });

  it("logs and throws GraphQL errors", async () => {
    const error = new Error("GraphQL request failed");
    mockFetchAdminRpDetails.mockRejectedValue(error);

    await expect(fetchAdminRpDetails("rp_0123456789abcdef")).rejects.toThrow(
      error,
    );

    expect(logger.error).toHaveBeenCalledWith(
      "Failed to fetch admin RP details",
      {
        error,
        rpId: "rp_0123456789abcdef",
      },
    );
  });
});
