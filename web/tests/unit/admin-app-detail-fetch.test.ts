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
        actions: [
          {
            action: "claim-offer",
            created_at: "2026-01-04",
            id: "action_claim",
            name: "Claim offer",
            nullifiers_aggregate: {
              aggregate: { count: 3, sum: { uses: 7 } },
            },
            status: "active",
          },
          {
            action: "",
            created_at: "2026-01-01",
            id: "action_sign_in",
            name: "",
            nullifiers_aggregate: { aggregate: null },
            status: "active",
          },
        ],
        created_at: "2026-01-01",
        deleted_at: null,
        draft_metadata: [
          {
            name: "Draft app",
            supported_countries: ["US", "GB"],
            updated_at: "2026-01-04",
            verification_status: "awaiting_review",
          },
        ],
        id: "app_current",
        name: "Current app",
        rp_registration: [
          {
            actions_v4: [
              {
                action: "production-action",
                created_at: "2026-01-05",
                environment: "production",
                id: "action_v4_production",
                nullifiers_aggregate: { aggregate: { count: 11 } },
              },
            ],
            rp_id: "rp_1111111111111111",
          },
          {
            actions_v4: [
              {
                action: "staging-action",
                created_at: "2026-01-06",
                environment: "staging",
                id: "action_v4_staging",
                nullifiers_aggregate: { aggregate: null },
              },
            ],
            rp_id: "rp_2222222222222222",
          },
        ],
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
            supported_countries: ["US"],
            updated_at: "2026-01-03",
            verification_status: "verified",
            verified_at: "2026-01-03",
          },
        ],
      },
      metadata_versions: [
        {
          app_id: "app_current",
          name: "Draft app",
          updated_at: "2026-01-04",
          verification_status: "awaiting_review",
          verified_at: null,
        },
        {
          app_id: "app_current",
          name: "Verified app",
          updated_at: "2026-01-03",
          verification_status: "verified",
          verified_at: "2026-01-03",
        },
        {
          app_id: "app_current",
          name: "Earlier app",
          updated_at: "2026-01-01",
          verification_status: "changes_requested",
          verified_at: null,
        },
      ],
    });

    await expect(fetchAdminAppDetails("app_current")).resolves.toEqual(
      expect.objectContaining({
        app: expect.objectContaining({
          id: "app_current",
          name: "Current app",
        }),
        draftMetadata: expect.objectContaining({
          name: "Draft app",
          supported_countries: ["US", "GB"],
        }),
        legacyActions: [
          {
            action: "claim-offer",
            createdAt: "2026-01-04",
            id: "action_claim",
            name: "Claim offer",
            status: "active",
            totalUses: 7,
            uniqueNullifiers: 3,
          },
          {
            action: "",
            createdAt: "2026-01-01",
            id: "action_sign_in",
            name: "",
            status: "active",
            totalUses: 0,
            uniqueNullifiers: 0,
          },
        ],
        latestMetadataUpdate: "2026-01-04",
        metadataHistory: [expect.objectContaining({ name: "Earlier app" })],
        team: expect.objectContaining({
          id: "team_current",
          name: "Current team",
        }),
        verifiedMetadata: expect.objectContaining({
          name: "Verified app",
          supported_countries: ["US"],
        }),
        worldId40Actions: [
          {
            action: "staging-action",
            createdAt: "2026-01-06",
            environment: "staging",
            id: "action_v4_staging",
            recordedUniqueUses: 0,
            rpId: "rp_2222222222222222",
          },
          {
            action: "production-action",
            createdAt: "2026-01-05",
            environment: "production",
            id: "action_v4_production",
            recordedUniqueUses: 11,
            rpId: "rp_1111111111111111",
          },
        ],
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
