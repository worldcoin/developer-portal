import { NextRequest } from "next/server";

const authenticateAdminRequest = jest.fn();
const FetchReviewDecisionContext = jest.fn();
const FetchReviewDecisionOutcome = jest.fn();
const DecideReviewSubmission = jest.fn();
const EnqueueReviewAssetCleanup = jest.fn();
const SettleReviewAssetCleanup = jest.fn();
const prepareReviewerDecisionAssets = jest.fn();
const deletePreparedReviewerAssets = jest.fn();
const collectVerifiedReviewerAssetKeys = jest.fn();
const expireVerifiedReviewerAssets = jest.fn();
const loggerError = jest.fn();

jest.mock("@/lib/admin-auth", () => ({
  authenticateAdminRequest: (...args: unknown[]) =>
    authenticateAdminRequest(...args),
  canReviewApps: (user: { accessLevel: string }) =>
    user.accessLevel === "review",
  isAdminReviewerPortalEnabled: () =>
    process.env.ADMIN_REVIEWER_PORTAL_ENABLED === "true",
}));

jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({}),
}));

jest.mock(
  "../../../api/admin/reviewer/graphql/reviewer-workflow.generated",
  () => ({
    getSdk: () => ({
      FetchReviewDecisionContext,
      FetchReviewDecisionOutcome,
      DecideReviewSubmission,
      EnqueueReviewAssetCleanup,
      SettleReviewAssetCleanup,
    }),
  }),
);

jest.mock("@/api/helpers/reviewer-decision-assets", () => ({
  prepareReviewerDecisionAssets: (...args: unknown[]) =>
    prepareReviewerDecisionAssets(...args),
  deletePreparedReviewerAssets: (...args: unknown[]) =>
    deletePreparedReviewerAssets(...args),
  collectVerifiedReviewerAssetKeys: (...args: unknown[]) =>
    collectVerifiedReviewerAssetKeys(...args),
  expireVerifiedReviewerAssets: (...args: unknown[]) =>
    expireVerifiedReviewerAssets(...args),
}));

jest.mock("@/lib/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: (...args: unknown[]) => loggerError(...args),
  },
}));

import { POST } from "@/api/admin/reviewer/submissions/[id]/decision";
import { createReviewDecisionFingerprint } from "@/api/helpers/reviewer-decision";
import type { StoredReviewChecklist } from "@/api/admin/reviewer/request-schema";
import {
  createChecklistDefinitionSnapshot,
  getChecklistDefinitions,
  REVIEW_CHECKLIST_VERSION,
} from "@/scenes/Admin/reviewer/checklist";

const REVIEW_ID = "11111111-1111-4111-8111-111111111111";
const CLAIM_TOKEN = "22222222-2222-4222-8222-222222222222";
const APP_ID = "app_123";
const METADATA_ID = "meta_123";
const UPDATED_AT = "2026-08-27T12:00:00.123Z";
const ADMIN = {
  accessLevel: "review",
  email: "reviewer@example.com",
  role: "internal_dashboard_readonly",
  subject: "reviewer-subject",
};

const allPassChecklist = (
  mode: "mini-app" | "external" = "mini-app",
): StoredReviewChecklist => ({
  items: getChecklistDefinitions(mode).map(({ id }) => ({
    id,
    status: "pass" as const,
    evidence: "Checked.",
  })),
  internalNotes: "Never send this internal note.",
  definitionSnapshot: createChecklistDefinitionSnapshot(mode)!,
});

const submittedLocalization = {
  id: "localisation_es",
  app_metadata_id: METADATA_ID,
  locale: "es",
  name: "Aplicación",
  description: "Descripción",
  world_app_button_text: "Abrir",
  world_app_description: "Una aplicación",
  short_name: "App",
  created_at: "2026-08-20T00:00:00.000Z",
  updated_at: "2026-08-27T11:00:00.000Z",
  hero_image_url: "",
  meta_tag_image_url: "meta_tag_image.jpg",
  showcase_img_urls: ["showcase_img_1.png"],
};

const contextRow = (overrides: Record<string, unknown> = {}) => ({
  id: REVIEW_ID,
  status: "in_review",
  review_version: 7,
  claim_token: CLAIM_TOKEN,
  claim_expires_at: "2099-08-27T12:30:00.000Z",
  claimed_by_subject: ADMIN.subject,
  checklist_version: REVIEW_CHECKLIST_VERSION,
  checklist: allPassChecklist(),
  app_metadata_id: METADATA_ID,
  app_id: APP_ID,
  team_id: "team_123",
  app_mode: "mini-app",
  listing_target: "mini_app_store",
  listing_consent: true,
  metadata_updated_at: UPDATED_AT,
  metadata_snapshot: {
    id: METADATA_ID,
    app_id: APP_ID,
    app_mode: "mini-app",
    is_developer_allow_listing: true,
    logo_img_url: "logo_img.png",
    meta_tag_image_url: "meta_tag_image.jpg",
    content_card_image_url: "content_card_image.png",
    showcase_img_urls: ["showcase_img_1.png"],
  },
  localizations_snapshot: [submittedLocalization],
  decision_fingerprint: null,
  decision_result: null,
  decided_by_subject: null,
  app_metadata: {
    id: METADATA_ID,
    app_id: APP_ID,
    updated_at: UPDATED_AT,
    verification_status: "awaiting_review",
    app_mode: "mini-app",
    is_developer_allow_listing: true,
  },
  app: {
    id: APP_ID,
    is_staging: false,
    deleted_at: null,
    first_verified_at: "2026-01-01T00:00:00.000Z",
    app_metadata: [
      {
        id: "meta_live",
        app_id: APP_ID,
        updated_at: "2026-07-01T00:00:00.000Z",
        verification_status: "verified",
        logo_img_url: "old-logo.png",
        meta_tag_image_url: "old-meta.jpg",
        content_card_image_url: "old-content.png",
        showcase_img_urls: ["old-showcase.png"],
        localisations: [],
      },
    ],
  },
  ...overrides,
});

const workflowRow = (overrides: Record<string, unknown> = {}) => ({
  id: REVIEW_ID,
  status: "approved",
  review_version: 8,
  claim_token: null,
  claim_expires_at: null,
  checklist_version: REVIEW_CHECKLIST_VERSION,
  checklist: allPassChecklist(),
  decision_result: {
    decision: "approved",
    prepared_asset_keys: ["verified/app_123/prepared-logo.png"],
  },
  ...overrides,
});

const body = (overrides: Record<string, unknown> = {}) => ({
  claimToken: CLAIM_TOKEN,
  expectedReviewVersion: 7,
  appMetadataId: METADATA_ID,
  expectedMetadataUpdatedAt: UPDATED_AT,
  decision: "approved",
  developerMessage: "",
  ...overrides,
});

const request = (payload: unknown) =>
  new NextRequest(
    `https://review.example.com/api/admin/reviewer/submissions/${REVIEW_ID}/decision`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        host: "review.example.com",
        origin: "https://review.example.com",
      },
      body: JSON.stringify(payload),
    },
  );

const invoke = (payload: unknown = body()) =>
  POST(request(payload), { params: Promise.resolve({ id: REVIEW_ID }) });

beforeEach(() => {
  jest.clearAllMocks();
  process.env.ADMIN_REVIEWER_PORTAL_ENABLED = "true";
  authenticateAdminRequest.mockResolvedValue(ADMIN);
  FetchReviewDecisionContext.mockResolvedValue({
    app_review_submission_by_pk: contextRow(),
  });
  FetchReviewDecisionOutcome.mockResolvedValue({
    app_review_submission_by_pk: null,
  });
  prepareReviewerDecisionAssets.mockImplementation(async (input: any) => {
    const preparedKeys = ["verified/app_123/prepared-logo.png"];
    await input.registerPreparedPlan(preparedKeys);
    return {
      metadataAssets: {
        logoImgUrl: "prepared-logo.png",
        metaTagImageUrl: "prepared-meta.jpg",
        contentCardImageUrl: "prepared-content.png",
        showcaseImgUrls: ["prepared-showcase.png"],
      },
      localizationAssets: {},
      preparedKeys,
    };
  });
  collectVerifiedReviewerAssetKeys.mockReturnValue([
    "verified/app_123/old-logo.png",
  ]);
  deletePreparedReviewerAssets.mockResolvedValue(undefined);
  expireVerifiedReviewerAssets.mockResolvedValue([]);
  DecideReviewSubmission.mockResolvedValue({
    reviewer_decide_app_review_submission: [workflowRow()],
  });
  EnqueueReviewAssetCleanup.mockResolvedValue({
    reviewer_enqueue_app_review_asset_cleanup: [
      { id: "notification_123", status: "pending" },
    ],
  });
  SettleReviewAssetCleanup.mockResolvedValue({
    reviewer_settle_app_review_asset_cleanup: [
      { id: "notification_123", status: "pending" },
    ],
  });
});

describe("POST /api/admin/reviewer/submissions/[id]/decision", () => {
  it("uses server identity, exact draft/live versions, and prepared assets", async () => {
    const response = await invoke();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(prepareReviewerDecisionAssets).toHaveBeenCalledWith(
      expect.objectContaining({
        appId: APP_ID,
        appMetadataId: METADATA_ID,
        operationId: expect.stringMatching(/^[a-f0-9]{32}$/),
        registerPreparedPlan: expect.any(Function),
      }),
    );
    expect(EnqueueReviewAssetCleanup).toHaveBeenCalledWith(
      expect.objectContaining({
        submission_id: REVIEW_ID,
        decision_fingerprint: expect.stringMatching(/^[a-f0-9]{64}$/),
        operation_id: expect.stringMatching(/^[a-f0-9]{32}$/),
        expected_review_version: 7,
        app_metadata_id: METADATA_ID,
        asset_keys: ["verified/app_123/prepared-logo.png"],
        actor_subject: ADMIN.subject,
        actor_email: ADMIN.email,
      }),
    );
    expect(EnqueueReviewAssetCleanup.mock.invocationCallOrder[0]).toBeLessThan(
      DecideReviewSubmission.mock.invocationCallOrder[0],
    );
    expect(SettleReviewAssetCleanup).toHaveBeenCalledWith(
      expect.objectContaining({
        submission_id: REVIEW_ID,
        decision_fingerprint: expect.stringMatching(/^[a-f0-9]{64}$/),
        operation_id: expect.stringMatching(/^[a-f0-9]{32}$/),
        settlement_state: "committed",
        actor_subject: ADMIN.subject,
        actor_email: ADMIN.email,
      }),
    );
    expect(DecideReviewSubmission).toHaveBeenCalledWith(
      expect.objectContaining({
        submission_id: REVIEW_ID,
        claim_token: CLAIM_TOKEN,
        expected_review_version: 7,
        app_metadata_id: METADATA_ID,
        expected_metadata_updated_at: UPDATED_AT,
        decision: "approved",
        expected_prior_verified_id: "meta_live",
        expected_prior_verified_updated_at: "2026-07-01T00:00:00.000Z",
        actor_subject: ADMIN.subject,
        actor_email: ADMIN.email,
        metadata_assets: expect.objectContaining({
          logoImgUrl: "prepared-logo.png",
        }),
        old_asset_keys: ["verified/app_123/old-logo.png"],
      }),
    );
    expect(JSON.stringify(DecideReviewSubmission.mock.calls)).not.toContain(
      "Never send this internal note.",
    );
    expect(DecideReviewSubmission.mock.invocationCallOrder[0]).toBeLessThan(
      expireVerifiedReviewerAssets.mock.invocationCallOrder[0],
    );
  });

  it("supports a first publication with an explicit prior-live absence", async () => {
    const context = contextRow() as any;
    context.app.app_metadata = [];
    FetchReviewDecisionContext.mockResolvedValueOnce({
      app_review_submission_by_pk: context,
    });

    const response = await invoke();

    expect(response.status).toBe(200);
    expect(DecideReviewSubmission).toHaveBeenCalledWith(
      expect.objectContaining({
        expected_prior_verified_id: null,
        expected_prior_verified_updated_at: null,
        expected_prior_localizations_snapshot: [],
        old_asset_keys: [],
      }),
    );
    expect(collectVerifiedReviewerAssetKeys).not.toHaveBeenCalled();
    expect(expireVerifiedReviewerAssets).not.toHaveBeenCalled();
  });

  it("CASes the raw prior live row and its exact localization snapshot even when legacy flags are false", async () => {
    const context = contextRow() as any;
    context.app.app_metadata[0] = {
      ...context.app.app_metadata[0],
      is_reviewer_world_app_approved: false,
      is_reviewer_app_store_approved: false,
      localisations: [
        {
          ...submittedLocalization,
          id: "live_localisation_es",
          app_metadata_id: "meta_live",
          updated_at: "2026-07-01T00:00:00.000Z",
        },
      ],
    };
    FetchReviewDecisionContext.mockResolvedValueOnce({
      app_review_submission_by_pk: context,
    });

    const response = await invoke();

    expect(response.status).toBe(200);
    expect(DecideReviewSubmission).toHaveBeenCalledWith(
      expect.objectContaining({
        expected_prior_verified_id: "meta_live",
        expected_prior_verified_updated_at: "2026-07-01T00:00:00.000Z",
        expected_prior_localizations_snapshot:
          context.app.app_metadata[0].localisations,
      }),
    );
  });

  it("automatically includes failed check labels in changes requested", async () => {
    const failedChecklist = allPassChecklist();
    failedChecklist.items[0] = {
      ...failedChecklist.items[0],
      status: "fail",
    };
    FetchReviewDecisionContext.mockResolvedValueOnce({
      app_review_submission_by_pk: contextRow({ checklist: failedChecklist }),
    });
    DecideReviewSubmission.mockResolvedValueOnce({
      reviewer_decide_app_review_submission: [
        workflowRow({
          status: "changes_requested",
          decision_result: {
            decision: "changes_requested",
            prepared_asset_keys: [],
          },
        }),
      ],
    });

    const response = await invoke(
      body({
        decision: "changes_requested",
        developerMessage: "Please resolve the issues below.",
      }),
    );

    expect(response.status).toBe(200);
    expect(prepareReviewerDecisionAssets).not.toHaveBeenCalled();
    expect(DecideReviewSubmission).toHaveBeenCalledWith(
      expect.objectContaining({
        decision: "changes_requested",
        developer_message: expect.stringContaining("Accurate metadata"),
        failed_checks: [
          expect.objectContaining({
            id: "shared.metadata-accurate",
            label: "Accurate metadata",
          }),
        ],
        metadata_assets: {},
        prepared_asset_keys: [],
        old_asset_keys: [],
      }),
    );
  });

  it.each([
    ["lost claim", { claim_token: "33333333-3333-4333-8333-333333333333" }],
    ["stale review version", { review_version: 8 }],
    ["expired lease", { claim_expires_at: "2020-01-01T00:00:00.000Z" }],
    [
      "changed draft",
      {
        app_metadata: {
          ...contextRow().app_metadata,
          updated_at: "2026-08-27T12:00:01.000Z",
        },
      },
    ],
    ["withdrawn draft", { status: "withdrawn" }],
    ["missing consent", { listing_consent: false }],
  ])("returns 409 for %s", async (_label, overrides) => {
    FetchReviewDecisionContext.mockResolvedValueOnce({
      app_review_submission_by_pk: contextRow(overrides),
    });

    const response = await invoke();

    expect(response.status).toBe(409);
    expect(prepareReviewerDecisionAssets).not.toHaveBeenCalled();
    expect(DecideReviewSubmission).not.toHaveBeenCalled();
  });

  it("fails closed for an unknown checklist version or altered definition snapshot", async () => {
    FetchReviewDecisionContext.mockResolvedValueOnce({
      app_review_submission_by_pk: contextRow({
        checklist_version: "retired",
      }),
    });
    const unknown = await invoke();

    const altered = allPassChecklist();
    altered.definitionSnapshot = {
      ...altered.definitionSnapshot!,
      items: altered.definitionSnapshot!.items.slice(1),
    };
    FetchReviewDecisionContext.mockResolvedValueOnce({
      app_review_submission_by_pk: contextRow({ checklist: altered }),
    });
    const tampered = await invoke();

    expect(unknown.status).toBe(409);
    expect(tampered.status).toBe(409);
    expect(DecideReviewSubmission).not.toHaveBeenCalled();
  });

  it("requires an override when approval has a failed or incomplete check", async () => {
    const failed = allPassChecklist();
    failed.items[0] = { ...failed.items[0], status: "fail" };
    FetchReviewDecisionContext.mockResolvedValueOnce({
      app_review_submission_by_pk: contextRow({ checklist: failed }),
    });

    const response = await invoke();

    expect(response.status).toBe(409);
    expect(prepareReviewerDecisionAssets).not.toHaveBeenCalled();
  });

  it.each(["failed", "incomplete"])(
    "allows an explicit approval override for %s checks",
    async (caseName) => {
      const checklist = allPassChecklist();
      if (caseName === "failed") {
        checklist.items[0] = { ...checklist.items[0], status: "fail" };
      } else {
        checklist.items.pop();
      }
      FetchReviewDecisionContext.mockResolvedValueOnce({
        app_review_submission_by_pk: contextRow({ checklist }),
      });

      const response = await invoke(
        body({
          overrideReason: "Reviewed manually with compensating evidence.",
        }),
      );

      expect(response.status).toBe(200);
      expect(DecideReviewSubmission).toHaveBeenCalledWith(
        expect.objectContaining({
          decision: "approved",
          override_reason: "Reviewed manually with compensating evidence.",
        }),
      );
    },
  );

  it("validates an external submission while keeping publication flags out of the API mutation", async () => {
    const context = contextRow({
      app_mode: "external",
      listing_target: "world_ecosystem",
      checklist: allPassChecklist("external"),
      metadata_snapshot: {
        ...contextRow().metadata_snapshot,
        app_mode: "external",
      },
      app_metadata: {
        ...contextRow().app_metadata,
        app_mode: "external",
      },
    });
    FetchReviewDecisionContext.mockResolvedValueOnce({
      app_review_submission_by_pk: context,
    });

    const response = await invoke();

    expect(response.status).toBe(200);
    const variables = DecideReviewSubmission.mock.calls[0][0];
    expect(variables.decision).toBe("approved");
    expect(variables).not.toHaveProperty("is_reviewer_world_app_approved");
    expect(variables).not.toHaveProperty("is_reviewer_app_store_approved");
  });

  it("does not finalize after asset preparation fails", async () => {
    prepareReviewerDecisionAssets.mockImplementationOnce(async (input: any) => {
      await input.registerPreparedPlan([
        "verified/app_123/review_meta_123_failed_logo.png",
      ]);
      throw new Error("asset preparation failed");
    });

    const response = await invoke();

    expect(response.status).toBe(500);
    expect(EnqueueReviewAssetCleanup).toHaveBeenCalledTimes(1);
    expect(SettleReviewAssetCleanup).toHaveBeenCalledWith(
      expect.objectContaining({ settlement_state: "aborted" }),
    );
    expect(DecideReviewSubmission).not.toHaveBeenCalled();
    expect(expireVerifiedReviewerAssets).not.toHaveBeenCalled();
  });

  it("does not start preparation when the durable operation plan cannot be registered", async () => {
    EnqueueReviewAssetCleanup.mockResolvedValueOnce({
      reviewer_enqueue_app_review_asset_cleanup: [],
    });

    const response = await invoke();

    expect(response.status).toBe(500);
    expect(DecideReviewSubmission).not.toHaveBeenCalled();
    expect(deletePreparedReviewerAssets).not.toHaveBeenCalled();
  });

  it("compensates prepared assets when the final CAS loses", async () => {
    DecideReviewSubmission.mockResolvedValueOnce({
      reviewer_decide_app_review_submission: [],
    });

    const response = await invoke();

    expect(response.status).toBe(409);
    expect(SettleReviewAssetCleanup).toHaveBeenCalledWith(
      expect.objectContaining({ settlement_state: "aborted" }),
    );
    expect(SettleReviewAssetCleanup.mock.invocationCallOrder[0]).toBeLessThan(
      deletePreparedReviewerAssets.mock.invocationCallOrder[0],
    );
    expect(deletePreparedReviewerAssets).toHaveBeenCalledWith({
      keys: ["verified/app_123/prepared-logo.png"],
    });
    expect(expireVerifiedReviewerAssets).not.toHaveBeenCalled();
  });

  it("retains the durable settlement job when definite CAS cleanup throws", async () => {
    DecideReviewSubmission.mockResolvedValueOnce({
      reviewer_decide_app_review_submission: [],
    });
    deletePreparedReviewerAssets.mockRejectedValueOnce(
      Object.assign(new Error("partial delete"), {
        failedKeys: ["verified/app_123/prepared-logo.png"],
      }),
    );

    const response = await invoke();

    expect(response.status).toBe(409);
    expect(EnqueueReviewAssetCleanup).toHaveBeenCalledTimes(1);
    expect(loggerError).toHaveBeenCalledWith(
      "Failed to compensate reviewer decision assets",
      expect.objectContaining({ reviewId: REVIEW_ID }),
    );
  });

  it("re-reads an ambiguous mutation and retains committed winner assets", async () => {
    const payload = body();
    const fingerprint = createReviewDecisionFingerprint({
      actorSubject: ADMIN.subject,
      submissionId: REVIEW_ID,
      body: payload as any,
    });
    DecideReviewSubmission.mockRejectedValueOnce(new TypeError("fetch failed"));
    FetchReviewDecisionOutcome.mockResolvedValueOnce({
      app_review_submission_by_pk: {
        ...workflowRow(),
        decision_fingerprint: fingerprint,
        decision_result: { decision: "approved" },
        decided_by_subject: ADMIN.subject,
      },
    });

    const response = await invoke(payload);

    expect(response.status).toBe(200);
    expect(FetchReviewDecisionOutcome).toHaveBeenCalledWith({
      submission_id: REVIEW_ID,
    });
    expect(deletePreparedReviewerAssets).not.toHaveBeenCalled();
  });

  it("cleans only its operation-unique plan when a matching retry already committed another plan", async () => {
    DecideReviewSubmission.mockResolvedValueOnce({
      reviewer_decide_app_review_submission: [
        workflowRow({
          decision_result: {
            decision: "approved",
            prepared_asset_keys: [
              "verified/app_123/review_meta_123_winner_logo.png",
            ],
          },
        }),
      ],
    });

    const response = await invoke();

    expect(response.status).toBe(200);
    expect(SettleReviewAssetCleanup).toHaveBeenCalledWith(
      expect.objectContaining({ settlement_state: "aborted" }),
    );
    expect(deletePreparedReviewerAssets).toHaveBeenCalledWith({
      keys: ["verified/app_123/prepared-logo.png"],
    });
  });

  it("keeps an approved decision committed when synchronous old-asset expiry fails", async () => {
    expireVerifiedReviewerAssets.mockRejectedValueOnce(
      new Error("tagging unavailable"),
    );

    const response = await invoke();

    expect(response.status).toBe(200);
    expect(DecideReviewSubmission).toHaveBeenCalledTimes(1);
    expect(deletePreparedReviewerAssets).not.toHaveBeenCalled();
    expect(loggerError).toHaveBeenCalledWith(
      "Failed to expire superseded reviewer assets",
      expect.objectContaining({ reviewId: REVIEW_ID }),
    );
  });

  it("retains prepared assets when an ambiguous call still reads nonterminal", async () => {
    DecideReviewSubmission.mockRejectedValueOnce(new TypeError("fetch failed"));
    FetchReviewDecisionOutcome.mockResolvedValueOnce({
      app_review_submission_by_pk: {
        ...workflowRow({ status: "in_review", review_version: 7 }),
        decision_fingerprint: null,
        decision_result: null,
        decided_by_subject: null,
      },
    });

    const response = await invoke();

    expect(response.status).toBe(500);
    expect(EnqueueReviewAssetCleanup).toHaveBeenCalledTimes(1);
    expect(SettleReviewAssetCleanup).not.toHaveBeenCalled();
    expect(deletePreparedReviewerAssets).not.toHaveBeenCalled();
  });

  it("returns a matching terminal retry without preparing assets or duplicating writes", async () => {
    const payload = body();
    const fingerprint = createReviewDecisionFingerprint({
      actorSubject: ADMIN.subject,
      submissionId: REVIEW_ID,
      body: payload as any,
    });
    FetchReviewDecisionContext.mockResolvedValueOnce({
      app_review_submission_by_pk: contextRow({
        status: "approved",
        decision_fingerprint: fingerprint,
        decision_result: { decision: "approved" },
        decided_by_subject: ADMIN.subject,
      }),
    });

    const response = await invoke(payload);

    expect(response.status).toBe(200);
    expect(prepareReviewerDecisionAssets).not.toHaveBeenCalled();
    expect(DecideReviewSubmission).not.toHaveBeenCalled();
  });

  it("returns 409 for a terminal fingerprint or actor mismatch", async () => {
    FetchReviewDecisionContext.mockResolvedValueOnce({
      app_review_submission_by_pk: contextRow({
        status: "approved",
        decision_fingerprint: "f".repeat(64),
        decision_result: { decision: "approved" },
        decided_by_subject: "another-reviewer",
      }),
    });

    const response = await invoke();

    expect(response.status).toBe(409);
    expect(DecideReviewSubmission).not.toHaveBeenCalled();
  });
});
