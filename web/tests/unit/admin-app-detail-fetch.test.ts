const mockFetchAdminAppDetails = jest.fn();

jest.mock("server-only", () => ({}));

jest.mock("@/api/helpers/graphql", () => ({
  getInternalDashboardGraphqlClient: jest.fn().mockResolvedValue({}),
}));

jest.mock(
  "@/scenes/Admin/apps/graphql/server/fetch-admin-app-details.generated",
  () => ({
    getSdk: () => ({ FetchAdminAppDetails: mockFetchAdminAppDetails }),
  }),
);

jest.mock("@/lib/logger", () => ({
  logger: {
    error: jest.fn(),
  },
}));

import { logger } from "@/lib/logger";
import { fetchAdminAppDetails } from "@/scenes/Admin/apps/id/server/fetch-app-details";

describe("admin app detail fetch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("maps app identity, team, and metadata workflow", async () => {
    mockFetchAdminAppDetails.mockResolvedValue({
      app_by_pk: {
        created_at: "2026-01-01",
        deleted_at: null,
        draft_metadata: [
          {
            name: "Draft app",
            updated_at: "2026-01-02",
            verification_status: "awaiting_review",
          },
        ],
        id: "app_current",
        name: "Current app",
        team: {
          created_at: "2026-01-01",
          deleted_at: null,
          id: "team_current",
          name: "Current team",
        },
        team_id: "team_current",
        verified_metadata: [
          {
            name: "Verified app",
            updated_at: "2026-01-03",
            verification_status: "verified",
            verified_at: "2026-01-03",
          },
        ],
      },
      metadata_versions: [
        {
          app_id: "app_current",
          name: "Verified app",
          updated_at: "2026-01-03",
          verification_status: "verified",
          verified_at: "2026-01-03",
        },
      ],
    });

    await expect(fetchAdminAppDetails("app_current")).resolves.toEqual(
      expect.objectContaining({
        app: expect.objectContaining({
          id: "app_current",
          name: "Current app",
        }),
        draftMetadata: expect.objectContaining({ name: "Draft app" }),
        metadataVersions: [expect.objectContaining({ name: "Verified app" })],
        team: expect.objectContaining({
          id: "team_current",
          name: "Current team",
        }),
        verifiedMetadata: expect.objectContaining({ name: "Verified app" }),
      }),
    );
  });

  it("returns null when the app does not exist", async () => {
    mockFetchAdminAppDetails.mockResolvedValue({
      app_by_pk: null,
      metadata_versions: [],
    });

    await expect(fetchAdminAppDetails("app_missing")).resolves.toBeNull();
  });

  it("logs and throws GraphQL errors", async () => {
    const error = new Error("GraphQL request failed");
    mockFetchAdminAppDetails.mockRejectedValue(error);

    await expect(fetchAdminAppDetails("app_current")).rejects.toThrow(error);

    expect(logger.error).toHaveBeenCalledWith(
      "Failed to fetch admin app details",
      {
        appId: "app_current",
        error,
      },
    );
  });
});
