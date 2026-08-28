import {
  buildReviewerDecisionEmail,
  buildReviewerSlackMessage,
  deliverReviewNotification,
  getPreparedAssetDisposition,
  isAppPublishedInCatalog,
} from "@/api/helpers/reviewer-notification-delivery";

const submission = {
  id: "11111111-1111-4111-8111-111111111111",
  appId: "app_123",
  appMetadataId: "meta_123",
  appMode: "mini-app" as const,
  listingTarget: "mini_app_store" as const,
  status: "approved",
  reviewVersion: 8,
  decisionFingerprint: "a".repeat(64),
  decisionResult: {
    prepared_asset_keys: [
      "verified/app_123/review_meta_123_aaaaaaaaaaaaaaaa_logo.png",
    ],
  },
  changelog: "Added checkout & fixed <navigation>.",
  submittedAt: "2026-08-27T11:45:00.000Z",
  decisionSummary: "Please address the checkout copy.",
  metadataSnapshot: { name: "Example <App>" },
  appName: "Fallback app",
  teamName: "Example Team",
  teamId: "team_123",
  claimExpiresAt: null,
};

describe("review notification delivery", () => {
  beforeEach(() => {
    process.env.SLACK_BOT_TOKEN = "slack-token";
    process.env.SLACK_REVIEW_CHANNEL_ID = "CREVIEW123";
    process.env.INTERNAL_DASHBOARD_HOST = "review.example.com";
    process.env.NEXT_PUBLIC_APP_URL = "https://developer.example.com";
    process.env.SENDGRID_API_KEY = "sendgrid-key";
    process.env.SENDGRID_EMAIL_FROM = "noreply@example.com";
    process.env.SENDGRID_REVIEW_APPROVED_TEMPLATE_ID = "d-approved";
    process.env.SENDGRID_REVIEW_CHANGES_REQUESTED_TEMPLATE_ID = "d-changes";
  });

  it("builds a Slack submission alert with escaped canonical review context", () => {
    const message = buildReviewerSlackMessage({
      channelId: "C_REVIEW",
      dashboardOrigin: "https://review.example.com",
      notificationId: "22222222-2222-4222-8222-222222222222",
      now: new Date("2026-08-27T12:00:00.000Z"),
      submission: { ...submission, status: "pending" },
    });

    expect(message.channel).toBe("C_REVIEW");
    expect(message.client_msg_id).toBe("22222222-2222-4222-8222-222222222222");
    expect(message.text).toContain("Example App");
    expect(JSON.stringify(message)).toContain("Example &lt;App&gt;");
    expect(JSON.stringify(message)).toContain("Example Team");
    expect(JSON.stringify(message)).toContain("mini_app_store");
    expect(JSON.stringify(message)).toContain("15 minutes");
    expect(JSON.stringify(message)).toContain(
      "https://review.example.com/admin/reviewer/11111111-1111-4111-8111-111111111111",
    );
    expect(JSON.stringify(message)).not.toContain("<navigation>");
  });

  it("bounds developer-controlled Slack text to the provider block limit", () => {
    const message = buildReviewerSlackMessage({
      channelId: "C_REVIEW",
      dashboardOrigin: "https://review.example.com",
      notificationId: "22222222-2222-4222-8222-222222222222",
      now: new Date("2026-08-27T12:00:00.000Z"),
      submission: {
        ...submission,
        changelog: "<&>".repeat(2_000),
        metadataSnapshot: { name: "A".repeat(5_000) },
        teamName: "T".repeat(5_000),
      },
    });
    const header = message.blocks.find((block) => block.type === "header");
    const fields = message.blocks.find(
      (block) => block.type === "section" && "fields" in block,
    );
    const changelog = message.blocks.find(
      (block) => block.type === "section" && "text" in block,
    );

    expect(header?.text?.text.length).toBeLessThanOrEqual(150);
    expect(fields?.fields?.every((field) => field.text.length <= 2_000)).toBe(
      true,
    );
    expect(changelog?.text?.text.length).toBeLessThanOrEqual(3_000);
  });

  it("builds an approval email without leaking outbox extras or internal notes", () => {
    const email = buildReviewerDecisionEmail({
      notificationType: "decision_approved",
      recipient: "Owner@Example.com",
      developerPortalOrigin: "https://developer.example.com",
      approvedTemplateId: "d-approved",
      changesRequestedTemplateId: "d-changes",
      submission,
      payload: {
        developer_message: "Approved for launch.",
        failed_checks: [],
        internalNotes: "never deliver this",
        arbitrary_secret: "also never deliver this",
      },
    });

    expect(email).toEqual({
      recipient: "owner@example.com",
      templateId: "d-approved",
      templateData: {
        app_id: "app_123",
        app_name: "Example <App>",
        developer_message: "Approved for launch.",
        failed_checks: [],
        listing_target: "Mini App Store",
        portal_url: "https://developer.example.com/teams/team_123/apps/app_123",
        resubmission_instructions: "",
        status: "approved",
      },
    });
    expect(JSON.stringify(email)).not.toContain("never deliver this");
    expect(JSON.stringify(email)).not.toContain("arbitrary_secret");
  });

  it("includes the rationale, failed checks, and resubmission guidance in changes-requested email data", () => {
    const email = buildReviewerDecisionEmail({
      notificationType: "decision_changes_requested",
      recipient: "admin@example.com",
      developerPortalOrigin: "https://developer.example.com",
      approvedTemplateId: "d-approved",
      changesRequestedTemplateId: "d-changes",
      submission: { ...submission, status: "changes_requested" },
      payload: {
        developer_message: "Fix the privacy disclosure.",
        failed_checks: [
          { id: "shared.privacy-legal", label: "Privacy and legal" },
        ],
      },
    });

    expect(email.templateId).toBe("d-changes");
    expect(email.templateData).toEqual(
      expect.objectContaining({
        status: "changes_requested",
        developer_message: "Fix the privacy disclosure.",
        failed_checks: [
          { id: "shared.privacy-legal", label: "Privacy and legal" },
        ],
        resubmission_instructions: expect.stringMatching(/resubmit/i),
      }),
    );
  });

  it.each([
    "missing-at.example.com",
    "owner @example.com",
    "x@x",
    `${"a".repeat(250)}@example.com`,
  ])("rejects an invalid review recipient: %s", (recipient) => {
    expect(() =>
      buildReviewerDecisionEmail({
        notificationType: "decision_approved",
        recipient,
        developerPortalOrigin: "https://developer.example.com",
        approvedTemplateId: "d-approved",
        changesRequestedTemplateId: "d-changes",
        submission,
        payload: {},
      }),
    ).toThrow("recipient");
  });

  it("rejects blank template configuration and bounds email dynamic fields", () => {
    expect(() =>
      buildReviewerDecisionEmail({
        notificationType: "decision_approved",
        recipient: "owner@example.com",
        developerPortalOrigin: "https://developer.example.com",
        approvedTemplateId: " ",
        changesRequestedTemplateId: "d-changes",
        submission,
        payload: {},
      }),
    ).toThrow("template");

    const email = buildReviewerDecisionEmail({
      notificationType: "decision_changes_requested",
      recipient: "owner@example.com",
      developerPortalOrigin: "https://developer.example.com",
      approvedTemplateId: "d-approved",
      changesRequestedTemplateId: "d-changes",
      submission: {
        ...submission,
        metadataSnapshot: { name: "A".repeat(20_000) },
      },
      payload: { developer_message: "M".repeat(40_000) },
    });

    expect(String(email.templateData.app_name).length).toBeLessThanOrEqual(500);
    expect(
      String(email.templateData.developer_message).length,
    ).toBeLessThanOrEqual(20_000);
  });

  it.each([
    [
      "terminal database truth retains the exact winner despite a stale aborted mark",
      "aborted",
      submission,
      "retain",
    ],
    [
      "aborted operations are deleted",
      "aborted",
      {
        ...submission,
        status: "in_review",
        decisionFingerprint: null,
        decisionResult: null,
      },
      "delete",
    ],
    ["the exact approved winner is retained", "pending", submission, "retain"],
    [
      "a terminal operation with different keys is deleted",
      "committed",
      {
        ...submission,
        decisionResult: {
          prepared_asset_keys: ["verified/app_123/winner.png"],
        },
      },
      "delete",
    ],
    [
      "an unchanged active operation with a live claim is deferred",
      "pending",
      {
        ...submission,
        status: "in_review",
        reviewVersion: 7,
        claimExpiresAt: "2026-08-27T12:30:00.000Z",
        decisionFingerprint: null,
        decisionResult: null,
      },
      "defer",
    ],
    [
      "an active operation from an obsolete review version is deleted",
      "pending",
      {
        ...submission,
        status: "in_review",
        reviewVersion: 8,
        claimExpiresAt: "2026-08-27T12:30:00.000Z",
        decisionFingerprint: null,
        decisionResult: null,
      },
      "delete",
    ],
    [
      "an unchanged active operation with an expired claim is deleted",
      "pending",
      {
        ...submission,
        status: "in_review",
        reviewVersion: 7,
        claimExpiresAt: "2026-08-27T11:59:59.000Z",
        decisionFingerprint: null,
        decisionResult: null,
      },
      "delete",
    ],
    [
      "a stale committed mark cannot retain an obsolete active operation",
      "committed",
      {
        ...submission,
        status: "in_review",
        reviewVersion: 8,
        claimExpiresAt: "2026-08-27T12:30:00.000Z",
        decisionFingerprint: null,
        decisionResult: null,
      },
      "delete",
    ],
  ] as const)("%s", (_name, settlementState, current, expected) => {
    expect(
      getPreparedAssetDisposition({
        assetKeys: [
          "verified/app_123/review_meta_123_aaaaaaaaaaaaaaaa_logo.png",
        ],
        decisionFingerprint: "a".repeat(64),
        expectedReviewVersion: 7,
        now: new Date("2026-08-27T12:00:00.000Z"),
        settlementState,
        submission: current,
      }),
    ).toBe(expected);
  });

  it("matches the approved app only in the expected catalog response", () => {
    const expectedLogo = "review_meta_123_aaaaaaaaaaaaaaaa_logo.png";
    expect(
      isAppPublishedInCatalog(
        {
          app_rankings: {
            top_apps: [
              { app_id: "app_other", app_mode: "mini-app" },
              {
                app_id: "app_123",
                app_mode: "mini-app",
                logo_img_url: `https://cdn.example.com/verified/app_123/${expectedLogo}`,
              },
            ],
            highlights: [],
          },
        },
        "app_123",
        "mini-app",
        expectedLogo,
      ),
    ).toBe(true);
    expect(
      isAppPublishedInCatalog(
        {
          app_rankings: {
            top_apps: [{ app_id: "app_123", app_mode: "mini-app" }],
            highlights: [],
          },
        },
        "app_123",
        "external",
        expectedLogo,
      ),
    ).toBe(false);
  });

  it("rejects a stale prior catalog version with the same app id and mode", () => {
    expect(
      isAppPublishedInCatalog(
        {
          app_rankings: {
            top_apps: [
              {
                app_id: "app_123",
                app_mode: "mini-app",
                logo_img_url:
                  "https://cdn.example.com/verified/app_123/review_meta_old_bbbbbbbbbbbbbbbb_logo.png",
              },
            ],
            highlights: [],
          },
        },
        "app_123",
        "mini-app",
        "review_meta_123_aaaaaaaaaaaaaaaa_logo.png",
      ),
    ).toBe(false);
  });

  it("fails closed for an unknown notification type/channel tuple", async () => {
    await expect(
      deliverReviewNotification({
        notification: {
          id: "22222222-2222-4222-8222-222222222222",
          submissionId: submission.id,
          notificationType: "decision_approved",
          channel: "slack",
          status: "processing",
          recipient: "owner@example.com",
          payload: {},
          attemptCount: 1,
          lockedAt: "2026-08-27T12:00:00.000Z",
          lockedBy: "worker-1",
        },
        submission,
      }),
    ).rejects.toThrow("Unsupported review notification");
  });

  it("treats Slack HTTP 200 ok:false as failure without exposing its response", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: false, error: "token_detail" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(
      deliverReviewNotification(
        {
          notification: {
            id: "22222222-2222-4222-8222-222222222222",
            submissionId: submission.id,
            notificationType: "submission_received",
            channel: "slack",
            status: "processing",
            recipient: null,
            payload: {},
            attemptCount: 1,
            lockedAt: "2026-08-27T12:00:00.000Z",
            lockedBy: "worker-1",
          },
          submission,
        },
        { fetchImpl },
      ),
    ).rejects.toThrow("Slack delivery failed");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("uses the outbox id for Slack idempotency and disables unfurls", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, ts: "1234.5678" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const result = await deliverReviewNotification(
      {
        notification: {
          id: "22222222-2222-4222-8222-222222222222",
          submissionId: submission.id,
          notificationType: "submission_received",
          channel: "slack",
          status: "processing",
          recipient: null,
          payload: {},
          attemptCount: 1,
          lockedAt: "2026-08-27T12:00:00.000Z",
          lockedBy: "worker-1",
        },
        submission,
      },
      { fetchImpl, now: new Date("2026-08-27T12:00:00.000Z") },
    );

    const request = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(request).toEqual(
      expect.objectContaining({
        client_msg_id: "22222222-2222-4222-8222-222222222222",
        unfurl_links: false,
        unfurl_media: false,
      }),
    );
    expect(result).toEqual({
      outcome: "delivered",
      providerMessageId: "1234.5678",
    });
  });

  it("attaches the outbox id to a decision email without recomputing recipients", async () => {
    const sendEmailDetailedImpl = jest
      .fn()
      .mockResolvedValue({ messageId: "sg-123" });
    const result = await deliverReviewNotification(
      {
        notification: {
          id: "22222222-2222-4222-8222-222222222222",
          submissionId: submission.id,
          notificationType: "decision_changes_requested",
          channel: "email",
          status: "processing",
          recipient: "OWNER@example.com",
          payload: { developer_message: "Fix privacy." },
          attemptCount: 1,
          lockedAt: "2026-08-27T12:00:00.000Z",
          lockedBy: "worker-1",
        },
        submission: { ...submission, status: "changes_requested" },
      },
      { sendEmailDetailedImpl },
    );

    expect(sendEmailDetailedImpl).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "owner@example.com",
        customArgs: {
          review_notification_id: "22222222-2222-4222-8222-222222222222",
        },
      }),
    );
    expect(result.providerMessageId).toBe("sg-123");
  });

  it.each([
    [
      "cross-app",
      "verified/app_other/review_meta_123_aaaaaaaaaaaaaaaa_logo.png",
    ],
    ["traversal", "verified/app_123/../secret.png"],
    ["malformed", "verified/app_123/not-an-image.svg"],
    [
      "other operation",
      "verified/app_123/review_meta_123_bbbbbbbbbbbbbbbb_logo.png",
    ],
  ])("rejects %s prepared asset keys before S3", async (_name, key) => {
    const deletePreparedAssetsImpl = jest.fn();
    const expireVerifiedAssetsImpl = jest.fn();
    await expect(
      deliverReviewNotification(
        {
          notification: {
            id: "22222222-2222-4222-8222-222222222222",
            submissionId: submission.id,
            notificationType: "asset_cleanup",
            channel: "asset",
            status: "processing",
            recipient: null,
            payload: {
              cleanup_kind: "prepared_operation_settlement",
              asset_keys: [key],
              decision_fingerprint: "b".repeat(64),
              expected_review_version: 7,
              operation_id: "a".repeat(16),
              app_metadata_id: "meta_123",
              settlement_state: "aborted",
            },
            attemptCount: 1,
            lockedAt: "2026-08-27T12:00:00.000Z",
            lockedBy: "worker-1",
          },
          submission: {
            ...submission,
            status: "in_review",
            reviewVersion: 7,
            decisionFingerprint: null,
            decisionResult: null,
          },
        },
        { deletePreparedAssetsImpl, expireVerifiedAssetsImpl },
      ),
    ).rejects.toThrow("asset cleanup payload");
    expect(deletePreparedAssetsImpl).not.toHaveBeenCalled();
    expect(expireVerifiedAssetsImpl).not.toHaveBeenCalled();
  });

  it("expires legacy jpeg superseded assets but keeps prepared keys normalized", async () => {
    const expireVerifiedAssetsImpl = jest.fn().mockResolvedValue([]);
    const result = await deliverReviewNotification(
      {
        notification: {
          id: "22222222-2222-4222-8222-222222222222",
          submissionId: submission.id,
          notificationType: "asset_cleanup",
          channel: "asset",
          status: "processing",
          recipient: null,
          payload: {
            cleanup_kind: "superseded_live_assets",
            asset_keys: ["verified/app_123/legacy-logo.jpeg"],
          },
          attemptCount: 1,
          lockedAt: "2026-08-27T12:00:00.000Z",
          lockedBy: "worker-1",
        },
        submission,
      },
      { expireVerifiedAssetsImpl },
    );

    expect(expireVerifiedAssetsImpl).toHaveBeenCalledWith({
      keys: ["verified/app_123/legacy-logo.jpeg"],
      abortSignal: expect.any(AbortSignal),
    });
    expect(result.outcome).toBe("delivered");
  });

  it("deletes an exact aborted prepared plan with a bounded S3 signal", async () => {
    const deletePreparedAssetsImpl = jest.fn().mockResolvedValue(undefined);
    const key = "verified/app_123/review_meta_123_aaaaaaaaaaaaaaaa_logo.png";

    await expect(
      deliverReviewNotification(
        {
          notification: {
            id: "22222222-2222-4222-8222-222222222222",
            submissionId: submission.id,
            notificationType: "asset_cleanup",
            channel: "asset",
            status: "processing",
            recipient: null,
            payload: {
              cleanup_kind: "prepared_operation_settlement",
              asset_keys: [key],
              decision_fingerprint: "b".repeat(64),
              expected_review_version: 7,
              operation_id: "a".repeat(16),
              app_metadata_id: "meta_123",
              settlement_state: "aborted",
            },
            attemptCount: 1,
            lockedAt: "2026-08-27T12:00:00.000Z",
            lockedBy: "worker-1",
          },
          submission: {
            ...submission,
            status: "in_review",
            reviewVersion: 7,
            decisionFingerprint: null,
            decisionResult: null,
          },
        },
        { deletePreparedAssetsImpl },
      ),
    ).resolves.toEqual({
      outcome: "delivered",
      providerMessageId: "asset-delete:22222222-2222-4222-8222-222222222222",
    });
    expect(deletePreparedAssetsImpl).toHaveBeenCalledWith({
      keys: [key],
      abortSignal: expect.any(AbortSignal),
    });
  });

  it("bounds publication feed pagination within the worker request budget", async () => {
    process.env.NEXT_PUBLIC_IMAGES_CDN_URL = "https://cdn.example.com";
    const page = {
      app_rankings: {
        top_apps: Array.from({ length: 1_500 }, (_, index) => ({
          app_id: `other_${index}`,
          app_mode: "mini-app",
        })),
        highlights: [],
      },
    };
    const fetchImpl = jest.fn().mockImplementation(
      async () =>
        new Response(JSON.stringify(page), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );

    const invalidateCatalogCacheImpl = jest.fn().mockResolvedValue({
      invalidationId: "INV-1",
      debounced: false,
    });
    await expect(
      deliverReviewNotification(
        {
          notification: {
            id: "22222222-2222-4222-8222-222222222222",
            submissionId: submission.id,
            notificationType: "publication_check",
            channel: "publication",
            status: "processing",
            recipient: null,
            payload: {},
            attemptCount: 1,
            lockedAt: "2026-08-27T12:00:00.000Z",
            lockedBy: "worker-1",
          },
          submission,
        },
        {
          fetchImpl,
          invalidateCatalogCacheImpl,
        },
      ),
    ).rejects.toThrow("Publication verification failed");
    expect(invalidateCatalogCacheImpl).toHaveBeenCalledWith({
      callerReference: "review:22222222-2222-4222-8222-222222222222",
      abortSignal: expect.any(AbortSignal),
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("uses the compatibility external feed while verifying the exact approved version", async () => {
    process.env.NEXT_PUBLIC_IMAGES_CDN_URL = "https://cdn.example.com";
    const expectedLogo =
      "review_meta_123_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa_logo.png";
    const fetchImpl = jest.fn().mockImplementation(async (input: URL) => {
      expect(input.searchParams.get("app_mode")).toBe("external");
      expect(input.searchParams.get("show_external")).toBe("true");
      return new Response(
        JSON.stringify({
          app_rankings: {
            top_apps: [
              {
                app_id: "app_123",
                app_mode: "external",
                logo_img_url: `https://cdn.example.com/verified/app_123/${expectedLogo}`,
              },
            ],
            highlights: [],
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });

    await expect(
      deliverReviewNotification(
        {
          notification: {
            id: "22222222-2222-4222-8222-222222222222",
            submissionId: submission.id,
            notificationType: "publication_check",
            channel: "publication",
            status: "processing",
            recipient: null,
            payload: {},
            attemptCount: 1,
            lockedAt: "2026-08-27T12:00:00.000Z",
            lockedBy: "worker-1",
          },
          submission: {
            ...submission,
            appMode: "external",
            listingTarget: "world_ecosystem",
            decisionResult: {
              prepared_asset_keys: [
                `verified/app_123/${expectedLogo}`,
                "verified/app_123/review_meta_123_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa_logo_original.png",
              ],
            },
          },
        },
        {
          fetchImpl,
          invalidateCatalogCacheImpl: jest.fn().mockResolvedValue({
            invalidationId: "INV-1",
            debounced: false,
          }),
        },
      ),
    ).resolves.toEqual({
      outcome: "delivered",
      providerMessageId: "INV-1",
    });
  });
});
