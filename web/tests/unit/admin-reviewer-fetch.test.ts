const mockFetchQueue = jest.fn();
const mockFetchSubmission = jest.fn();
const mockFetchLiveMetadata = jest.fn();

jest.mock("server-only", () => ({}));
jest.mock("@/api/helpers/graphql", () => ({
  getInternalDashboardGraphqlClient: jest.fn().mockResolvedValue({}),
}));
jest.mock("@/api/helpers/reviewer-live-metadata", () => ({
  fetchReviewerLiveMetadata: (...args: unknown[]) =>
    mockFetchLiveMetadata(...args),
}));
jest.mock(
  "@/scenes/Admin/reviewer/graphql/server/fetch-reviewer-queue.generated",
  () => ({ getSdk: () => ({ FetchReviewerQueue: mockFetchQueue }) }),
);
jest.mock(
  "@/scenes/Admin/reviewer/graphql/server/fetch-reviewer-submission.generated",
  () => ({ getSdk: () => ({ FetchReviewerSubmission: mockFetchSubmission }) }),
);

import {
  fetchReviewerQueue,
  fetchReviewerSubmission,
} from "@/scenes/Admin/reviewer/server/fetch-reviewer-data";

describe("reviewer dashboard reads", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchLiveMetadata.mockResolvedValue(null);
  });

  it("maps the FIFO queue without any claim token", async () => {
    mockFetchQueue.mockResolvedValue({
      app_review_submission: [
        {
          id: "00000000-0000-4000-8000-000000000001",
          app_id: "app_1",
          app_metadata_id: "metadata_1",
          app_mode: "mini-app",
          attempt: 1,
          changelog: "First release",
          claimed_by_email: null,
          claim_expires_at: null,
          listing_target: "mini_app_store",
          review_version: 1,
          status: "pending",
          submitted_at: "2026-08-20T12:00:00.000Z",
          app: { name: "Mini one" },
          team: { id: "team_1", name: "Alpha" },
        },
      ],
    });

    await expect(
      fetchReviewerQueue({
        filters: {
          age: "all",
          assignee: "",
          mode: "all",
          page: 1,
          status: "pending",
          team: "",
        },
        reviewerEmail: "reviewer@example.com",
        now: new Date("2026-08-27T12:00:00.000Z"),
      }),
    ).resolves.toEqual({
      hasNextPage: false,
      submissions: [
        expect.objectContaining({
          appId: "app_1",
          appName: "Mini one",
          status: "pending",
          teamName: "Alpha",
        }),
      ],
    });
    expect(mockFetchQueue).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 51,
        offset: 0,
        where: {
          _and: [
            {
              _or: [
                { status: { _eq: "pending" } },
                {
                  _and: [
                    { status: { _eq: "in_review" } },
                    {
                      claim_expires_at: {
                        _lte: "2026-08-27T12:00:00.000Z",
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      }),
    );
  });

  it("maps canonical snapshots, live metadata, World ID config, events, and notifications", async () => {
    mockFetchLiveMetadata.mockResolvedValue({
      id: "live_metadata_1",
      is_reviewer_world_app_approved: true,
      name: "Live app",
      localisations: [{ locale: "es", name: "Aplicacion publicada" }],
    });
    mockFetchSubmission.mockResolvedValue({
      app_review_submission_by_pk: {
        id: "00000000-0000-4000-8000-000000000001",
        app_id: "app_1",
        app_metadata_id: "metadata_1",
        app_mode: "external",
        attempt: 2,
        changelog: "Updated copy",
        checklist: {
          items: [],
          internalNotes: "",
          definitionSnapshot: {
            mode: "external",
            items: [
              {
                id: "external.integration-url",
                label: "Integration URL",
                description: "The submitted integration URL is safe.",
                sourceUrl: "https://docs.world.org/world-id",
                conditional: false,
              },
            ],
          },
        },
        checklist_version: "2026-08-27.1",
        claimed_at: null,
        claimed_by_email: null,
        claim_expires_at: null,
        completed_at: null,
        decided_at: null,
        decided_by_email: null,
        decision_summary: null,
        listing_consent: true,
        listing_target: "world_ecosystem",
        asset_snapshot: {
          version: 1,
          prefix:
            "review-submissions/app_1/metadata_1/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/",
          objects: {
            "unverified/app_1/logo.png":
              "review-submissions/app_1/metadata_1/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/logo.png",
          },
        },
        localizations_snapshot: [{ locale: "es", name: "Aplicacion" }],
        metadata_snapshot: {
          name: "Draft app",
          integration_url: "https://example.com",
        },
        metadata_updated_at: "2026-08-20T12:00:00.000Z",
        review_version: 3,
        status: "in_review",
        submitted_at: "2026-08-20T12:00:00.000Z",
        world_id_configuration_snapshot: {
          version: 1,
          config: {
            legacy_actions: [
              {
                id: "action_1",
                action: "verify",
                name: "Verify",
                status: "active",
                redirects: [
                  {
                    id: "redirect_1",
                    redirect_uri: "https://example.com/callback",
                  },
                ],
              },
            ],
            registrations: [
              {
                rp_id: "rp_1",
                mode: "managed",
                signer_address: "0x1234",
                actions: [
                  {
                    id: "v4_1",
                    action: "signin",
                    description: "Sign in",
                    environment: "production",
                  },
                ],
              },
            ],
          },
          lifecycle: {
            registrations: [
              {
                rp_id: "rp_1",
                status: "pending",
                staging_status: "registered",
              },
            ],
          },
        },
        app: {
          name: "Source app",
          verified_metadata: [
            {
              is_reviewer_world_app_approved: true,
              name: "Live app",
              localisations: [{ locale: "es", name: "Aplicacion publicada" }],
            },
          ],
        },
        team: { id: "team_1", name: "Alpha" },
        events: [
          {
            id: "event_1",
            event_type: "submitted",
            event_sequence: 1,
            actor_email: "dev@example.com",
            actor_subject: "developer-subject",
            created_at: "2026-08-20T12:00:00.000Z",
            payload: {},
            review_version: 1,
          },
        ],
        notifications: [
          {
            id: "notification_1",
            attempt_count: 0,
            channel: "slack",
            created_at: "2026-08-20T12:00:00.000Z",
            last_error: null,
            notification_type: "submission_received",
            recipient: null,
            status: "pending",
          },
        ],
      },
    });

    const submission = await fetchReviewerSubmission(
      "00000000-0000-4000-8000-000000000001",
    );
    expect(submission).toEqual(
      expect.objectContaining({
        checklist: expect.objectContaining({
          definitionSnapshot: {
            mode: "external",
            items: [
              expect.objectContaining({
                id: "external.integration-url",
                label: "Integration URL",
                conditional: false,
              }),
            ],
          },
        }),
        liveMetadata: expect.objectContaining({ name: "Live app" }),
        liveLocalizations: [expect.objectContaining({ locale: "es" })],
        events: [
          expect.objectContaining({
            actorEmail: "dev@example.com",
            actorSubject: "developer-subject",
          }),
        ],
        worldIdConfiguration: {
          legacyActions: [
            expect.objectContaining({
              id: "action_1",
              redirects: [
                {
                  id: "redirect_1",
                  redirectUri: "https://example.com/callback",
                },
              ],
            }),
          ],
          registrations: [
            expect.objectContaining({
              rpId: "rp_1",
              actions: [expect.objectContaining({ id: "v4_1" })],
            }),
          ],
        },
      }),
    );
    expect(submission).not.toHaveProperty("assetSnapshot");
    expect(mockFetchLiveMetadata).toHaveBeenCalledWith("app_1");
  });

  it("does not present a verification-only metadata row as a live listing", async () => {
    mockFetchSubmission.mockResolvedValue({
      app_review_submission_by_pk: {
        id: "00000000-0000-4000-8000-000000000001",
        app_id: "app_1",
        app_metadata_id: "metadata_1",
        app_mode: "external",
        attempt: 1,
        changelog: "First listing",
        checklist: {},
        checklist_version: null,
        claimed_at: null,
        claimed_by_email: null,
        claim_expires_at: null,
        completed_at: null,
        decided_at: null,
        decided_by_email: null,
        decision_summary: null,
        listing_consent: true,
        listing_target: "world_ecosystem",
        localizations_snapshot: [],
        metadata_snapshot: { name: "Listing candidate" },
        metadata_updated_at: "2026-08-20T12:00:00.000Z",
        review_version: 1,
        status: "pending",
        submitted_at: "2026-08-20T12:00:00.000Z",
        world_id_configuration_snapshot: {
          version: 1,
          config: { legacy_actions: [], registrations: [] },
          lifecycle: { registrations: [] },
        },
        app: {
          name: "Source app",
          verified_metadata: [
            {
              is_reviewer_world_app_approved: false,
              name: "Verification only",
              localisations: [],
            },
          ],
        },
        team: { id: "team_1", name: "Alpha" },
        events: [],
        notifications: [],
      },
    });

    const submission = await fetchReviewerSubmission(
      "00000000-0000-4000-8000-000000000001",
    );
    expect(submission?.liveMetadata).toBeNull();
    expect(submission?.liveLocalizations).toEqual([]);
  });
});
