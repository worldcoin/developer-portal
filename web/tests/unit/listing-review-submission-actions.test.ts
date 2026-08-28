import { submitAppForReviewFormServerSide } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/AppTopBar/server/submit";
import { removeAppFromReview } from "@/scenes/common/Teams/TeamId/Apps/common/hooks/server";

// #region Mocks
const requestMock = jest.fn();
const getIsUserAllowedToUpdateAppMetadataMock = jest.fn();
const getIsUserAllowedToUpdateVerificationStatusMock = jest.fn();
const getSessionMock = jest.fn();
const s3SendMock = jest.fn().mockResolvedValue({});

jest.mock("server-only", () => ({}));

jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn(() => ({ send: s3SendMock })),
  CopyObjectCommand: class CopyObjectCommand {
    constructor(public input: unknown) {}
  },
  DeleteObjectsCommand: class DeleteObjectsCommand {
    constructor(public input: unknown) {}
  },
}));

jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn(async () => ({ request: requestMock })),
}));

jest.mock("@/lib/permissions", () => ({
  getIsUserAllowedToUpdateAppMetadata: (...args: unknown[]) =>
    getIsUserAllowedToUpdateAppMetadataMock(...args),
  getIsUserAllowedToUpdateVerificationStatus: (...args: unknown[]) =>
    getIsUserAllowedToUpdateVerificationStatusMock(...args),
}));

jest.mock("@/lib/server-utils", () => ({
  getPathFromHeaders: jest.fn(async () =>
    Promise.resolve(`/teams/${teamId}/apps/${appId}`),
  ),
  extractIdsFromPath: jest.fn(() => ({ Apps: appId, Teams: teamId })),
}));

jest.mock("@/lib/auth0", () => ({
  auth0: { getSession: (...args: unknown[]) => getSessionMock(...args) },
}));

jest.mock("@/lib/logger", () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock("@/api/helpers/portal-events", () => ({
  logPortalEvent: jest.fn(),
}));
// #endregion

// #region Test Data
const appId = "app_11111111111111111111111111111111";
const teamId = "team_22222222222222222222222222222222";
const metadataId = "meta_33333333333333333333333333333333";
const activeSubmissionId = "00000000-0000-4000-8000-000000000001";
const awaitingReviewUpdatedAt = "2026-08-27T20:01:00.000Z";

const reviewMetadata = {
  id: metadataId,
  app_id: appId,
  name: "Review App",
  short_name: "Review",
  logo_img_url: "logo_img.png",
  showcase_img_urls: ["showcase_img_1.png"],
  meta_tag_image_url: "meta_tag_image.png",
  world_app_description: "A useful app",
  description: JSON.stringify({
    description_overview: "A complete description for review.",
    description_how_it_works: "",
    description_connect: "",
  }),
  category: "Other",
  integration_url: "https://app.example.com",
  app_website_url: "https://example.com",
  support_link: "mailto:support@example.com",
  supported_countries: ["US"],
  supported_languages: ["en", "es"],
  is_android_only: false,
  is_for_humans_only: false,
  app_mode: "mini-app",
  verification_status: "unverified",
  content_card_image_url: "content_card_image.png",
  updated_at: "2026-08-27T20:00:00.000Z",
  app: {
    id: appId,
    team_id: teamId,
    is_staging: false,
    is_banned: false,
    status: "active",
    is_archived: false,
  },
};

const localisations = [
  {
    id: "loc_44444444444444444444444444444444",
    app_metadata_id: metadataId,
    locale: "es",
    name: "Aplicacion",
    short_name: "App",
    world_app_description: "Una app util",
    description: JSON.stringify({
      description_overview: "Una descripcion completa para revision.",
      description_how_it_works: "",
      description_connect: "",
    }),
    meta_tag_image_url: "meta_tag_image.png",
    showcase_img_urls: ["showcase_img_1.png"],
  },
];

const operationName = (query: unknown) =>
  typeof query === "string"
    ? query
    : (query as { definitions?: { name?: { value?: string } }[] })
        .definitions?.[0]?.name?.value ?? "";

const submit = (isDeveloperAllowListing = true) =>
  submitAppForReviewFormServerSide({
    input: {
      app_metadata_id: metadataId,
      team_id: teamId,
      changelog: "Ready for listing review.",
      is_developer_allow_listing: isDeveloperAllowListing,
    },
  });
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  process.env.ADMIN_REVIEWER_PORTAL_ENABLED = "true";
  process.env.ASSETS_S3_BUCKET_NAME = "review-assets";
  process.env.ASSETS_S3_REGION = "us-east-1";
  getIsUserAllowedToUpdateAppMetadataMock.mockResolvedValue(true);
  getIsUserAllowedToUpdateVerificationStatusMock.mockResolvedValue(true);
  getSessionMock.mockResolvedValue({
    user: { sub: "auth0|submitter", email: "submitter@example.com" },
  });
  requestMock.mockImplementation(async (query: unknown, variables: any) => {
    switch (operationName(query)) {
      case "FetchAppMetadataById":
        return { app_metadata: [reviewMetadata], localisations };
      case "CaptureListingReviewSubmission":
        return {
          capture_listing_review_submission: [
            {
              id: "00000000-0000-0000-0000-000000000001",
              app_metadata_id: metadataId,
              attempt: 1,
              status: "pending",
              review_version: 1,
              metadata_updated_at: awaitingReviewUpdatedAt,
            },
          ],
        };
      case "SubmitApp":
        return {
          update_app_metadata_by_pk: {
            id: variables.app_metadata_id,
            updated_at: awaitingReviewUpdatedAt,
            verification_status: variables.verification_status,
            is_developer_allow_listing: variables.is_developer_allow_listing,
          },
        };
      case "FetchDeveloperReviewWithdrawalContext":
        return {
          app_metadata_by_pk: {
            id: metadataId,
            app_mode: "mini-app",
            is_developer_allow_listing: true,
            verification_status: "awaiting_review",
            updated_at: awaitingReviewUpdatedAt,
            review_submissions: [
              {
                id: activeSubmissionId,
                review_version: 3,
                status: "pending",
              },
            ],
          },
        };
      case "WithdrawActiveReviewDraft":
        return {
          developer_withdraw_active_review_draft: [
            { id: metadataId, verification_status: "unverified" },
          ],
        };
      case "RemoveAppFromReview":
        return { update_app_metadata_by_pk: { id: metadataId } };
      default:
        throw new Error(`Unexpected operation: ${operationName(query)}`);
    }
  });
});

afterEach(() => {
  delete process.env.ADMIN_REVIEWER_PORTAL_ENABLED;
  delete process.env.ASSETS_S3_BUCKET_NAME;
  delete process.env.ASSETS_S3_REGION;
});

// #region Human submission
describe("human listing review submission", () => {
  it("uses the atomic listing operation with the exact row and human actor", async () => {
    const result = await submit(true);

    expect(result.success).toBe(true);
    expect(result.reviewContext).toEqual({
      expectedVerificationStatus: "awaiting_review",
      expectedMetadataUpdatedAt: awaitingReviewUpdatedAt,
    });
    const captureCall = requestMock.mock.calls.find(
      ([query]) => operationName(query) === "CaptureListingReviewSubmission",
    );
    expect(captureCall?.[1]).toEqual(
      expect.objectContaining({
        app_metadata_id: metadataId,
        changelog: "Ready for listing review.",
        submitted_by_subject: "auth0|submitter",
        submitted_by_email: "submitter@example.com",
        listing_consent: true,
        expected_metadata_updated_at: reviewMetadata.updated_at,
        expected_localizations_snapshot: localisations,
        asset_snapshot: expect.objectContaining({
          version: 1,
          prefix: expect.stringMatching(
            /^review-submissions\/app_11111111111111111111111111111111\/meta_33333333333333333333333333333333\/[a-f0-9]{32}\/$/,
          ),
          objects: expect.objectContaining({
            [`unverified/${appId}/logo_img.png`]:
              expect.stringMatching(/\/logo_img\.png$/),
            [`unverified/${appId}/es/meta_tag_image.png`]:
              expect.stringMatching(/\/es\/meta_tag_image\.png$/),
          }),
        }),
      }),
    );
    expect(s3SendMock).toHaveBeenCalledTimes(6);
    expect(
      requestMock.mock.calls.some(
        ([query]) => operationName(query) === "SubmitApp",
      ),
    ).toBe(false);
  });

  it("does not delete a manifest when a committed capture response is lost", async () => {
    requestMock.mockImplementation(async (query: unknown) => {
      switch (operationName(query)) {
        case "FetchAppMetadataById":
          return { app_metadata: [reviewMetadata], localisations };
        case "CaptureListingReviewSubmission":
          throw new Error("connection reset after commit");
        case "ReconcileListingReviewSubmissionCapture":
          return {
            reconcile_listing_review_submission_capture: [
              {
                id: "00000000-0000-0000-0000-000000000001",
                app_metadata_id: metadataId,
                attempt: 1,
                status: "approved",
                review_version: 4,
                metadata_updated_at: awaitingReviewUpdatedAt,
              },
            ],
          };
        default:
          throw new Error(`Unexpected operation: ${operationName(query)}`);
      }
    });

    const result = await submit(true);

    expect(result.success).toBe(true);
    expect(
      requestMock.mock.calls.some(
        ([query]) =>
          operationName(query) === "ReconcileListingReviewSubmissionCapture",
      ),
    ).toBe(true);
    const reconciliationCall = requestMock.mock.calls.find(
      ([query]) =>
        operationName(query) === "ReconcileListingReviewSubmissionCapture",
    );
    expect(reconciliationCall?.[1]).toEqual(
      expect.objectContaining({
        app_metadata_id: metadataId,
        asset_snapshot: expect.objectContaining({ version: 1 }),
      }),
    );
    expect(
      s3SendMock.mock.calls.some(
        ([command]) => command.constructor.name === "DeleteObjectsCommand",
      ),
    ).toBe(false);
  });

  it("deletes a manifest only after ordered reconciliation proves capture aborted", async () => {
    requestMock.mockImplementation(async (query: unknown) => {
      switch (operationName(query)) {
        case "FetchAppMetadataById":
          return { app_metadata: [reviewMetadata], localisations };
        case "CaptureListingReviewSubmission":
          throw new Error("connection reset before commit");
        case "ReconcileListingReviewSubmissionCapture":
          return { reconcile_listing_review_submission_capture: [] };
        default:
          throw new Error(`Unexpected operation: ${operationName(query)}`);
      }
    });

    const result = await submit(true);

    expect(result.success).toBe(false);
    expect(
      s3SendMock.mock.calls.some(
        ([command]) => command.constructor.name === "DeleteObjectsCommand",
      ),
    ).toBe(true);
  });

  it("rejects a native app before any submission mutation", async () => {
    requestMock.mockImplementationOnce(async () => ({
      app_metadata: [{ ...reviewMetadata, app_mode: "native" }],
      localisations,
    }));

    const result = await submit(true);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/mini app or external integration/i);
    expect(requestMock).toHaveBeenCalledTimes(1);
  });

  it("rejects a banned app before copying assets or mutating review state", async () => {
    requestMock.mockImplementationOnce(async () => ({
      app_metadata: [
        { ...reviewMetadata, app: { ...reviewMetadata.app, is_banned: true } },
      ],
      localisations,
    }));

    const result = await submit(true);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/banned apps cannot be submitted/i);
    expect(requestMock).toHaveBeenCalledTimes(1);
    expect(s3SendMock).not.toHaveBeenCalled();
  });

  it.each([
    ["inactive", { status: "inactive" }],
    ["archived", { is_archived: true }],
  ])(
    "rejects an %s app before copying assets or mutating review state",
    async (_label, appOverride) => {
      requestMock.mockImplementationOnce(async () => ({
        app_metadata: [
          {
            ...reviewMetadata,
            app: { ...reviewMetadata.app, ...appOverride },
          },
        ],
        localisations,
      }));

      const result = await submit(true);

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/active, unarchived apps/i);
      expect(requestMock).toHaveBeenCalledTimes(1);
      expect(s3SendMock).not.toHaveBeenCalled();
    },
  );

  it("rejects an external integration without a valid HTTPS URL", async () => {
    requestMock.mockImplementationOnce(async () => ({
      app_metadata: [
        {
          ...reviewMetadata,
          app_mode: "external",
          integration_url: "http://insecure.example.com",
        },
      ],
      localisations,
    }));

    const result = await submit(true);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/integration url.*https/i);
    expect(requestMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    "https://reviewer@example.com/app",
    "https://reviewer:secret@example.com/app",
    "https://:secret@example.com/app",
  ])(
    "rejects an external integration URL with embedded credentials: %s",
    async (integrationUrl) => {
      requestMock.mockImplementationOnce(async () => ({
        app_metadata: [
          {
            ...reviewMetadata,
            app_mode: "external",
            integration_url: integrationUrl,
          },
        ],
        localisations,
      }));

      const result = await submit(true);

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/integration url.*credentials/i);
      expect(requestMock).toHaveBeenCalledTimes(1);
      expect(s3SendMock).not.toHaveBeenCalled();
    },
  );

  it("rejects a missing supported-language row before mutation", async () => {
    requestMock.mockImplementationOnce(async () => ({
      app_metadata: [reviewMetadata],
      localisations: [],
    }));

    const result = await submit(true);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/missing localisation/i);
    expect(requestMock).toHaveBeenCalledTimes(1);
  });

  it("keeps verification-only submission on the legacy mutation", async () => {
    const result = await submit(false);

    expect(result.success).toBe(true);
    const legacyCall = requestMock.mock.calls.find(
      ([query]) => operationName(query) === "SubmitApp",
    );
    expect(legacyCall?.[1]).toEqual(
      expect.objectContaining({
        app_metadata_id: metadataId,
        is_developer_allow_listing: false,
        verification_status: "awaiting_review",
      }),
    );
    expect(
      requestMock.mock.calls.some(
        ([query]) => operationName(query) === "CaptureListingReviewSubmission",
      ),
    ).toBe(false);
  });

  it("keeps consent-free native verification on the legacy path", async () => {
    requestMock.mockImplementationOnce(async () => ({
      app_metadata: [{ ...reviewMetadata, app_mode: "native" }],
      localisations,
    }));

    const result = await submit(false);

    expect(result.success).toBe(true);
    expect(
      requestMock.mock.calls.some(
        ([query]) => operationName(query) === "SubmitApp",
      ),
    ).toBe(true);
    expect(
      requestMock.mock.calls.some(
        ([query]) => operationName(query) === "CaptureListingReviewSubmission",
      ),
    ).toBe(false);
  });

  it("captures an eligible listing while the reviewer UI flag is disabled", async () => {
    process.env.ADMIN_REVIEWER_PORTAL_ENABLED = "false";

    const result = await submit(true);

    expect(result.success).toBe(true);
    expect(
      requestMock.mock.calls.some(
        ([query]) => operationName(query) === "CaptureListingReviewSubmission",
      ),
    ).toBe(true);
    expect(
      requestMock.mock.calls.some(
        ([query]) => operationName(query) === "SubmitApp",
      ),
    ).toBe(false);
  });
});
// #endregion

// #region Withdrawal
describe("listing review withdrawal", () => {
  it("withdraws the exact active attempt atomically", async () => {
    const result = await removeAppFromReview(metadataId, {
      expectedVerificationStatus: "awaiting_review",
      expectedMetadataUpdatedAt: awaitingReviewUpdatedAt,
    });

    expect(result.success).toBe(true);
    const withdrawCall = requestMock.mock.calls.find(
      ([query]) => operationName(query) === "WithdrawActiveReviewDraft",
    );
    expect(withdrawCall?.[1]).toEqual({
      app_metadata_id: metadataId,
      expected_metadata_updated_at: awaitingReviewUpdatedAt,
      expected_submission_id: activeSubmissionId,
      expected_review_version: 3,
      actor_subject: "auth0|submitter",
      actor_email: "submitter@example.com",
    });
    expect(
      requestMock.mock.calls.some(
        ([query]) => operationName(query) === "RemoveAppFromReview",
      ),
    ).toBe(false);
  });

  it("withdraws the captured attempt while the reviewer UI flag is disabled", async () => {
    process.env.ADMIN_REVIEWER_PORTAL_ENABLED = "false";

    const result = await removeAppFromReview(metadataId, {
      expectedVerificationStatus: "awaiting_review",
      expectedMetadataUpdatedAt: awaitingReviewUpdatedAt,
    });

    expect(result.success).toBe(true);
    expect(
      requestMock.mock.calls.some(
        ([query]) => operationName(query) === "WithdrawActiveReviewDraft",
      ),
    ).toBe(true);
    expect(
      requestMock.mock.calls.some(
        ([query]) => operationName(query) === "RemoveAppFromReview",
      ),
    ).toBe(false);
  });

  it("refuses a stale page after a newer review attempt is submitted", async () => {
    const staleUpdatedAt = "2026-08-27T20:00:00.000Z";

    const result = await removeAppFromReview(metadataId, {
      expectedVerificationStatus: "awaiting_review",
      expectedMetadataUpdatedAt: staleUpdatedAt,
    });

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        code: "VALIDATION_ERROR",
      }),
    );
    expect(
      requestMock.mock.calls.some(
        ([query]) => operationName(query) === "WithdrawActiveReviewDraft",
      ),
    ).toBe(false);
  });

  it("reopens an exact changes-requested draft without touching an active attempt", async () => {
    requestMock.mockImplementation(async (query: unknown, variables: any) => {
      switch (operationName(query)) {
        case "FetchDeveloperReviewWithdrawalContext":
          return {
            app_metadata_by_pk: {
              id: metadataId,
              app_mode: "mini-app",
              is_developer_allow_listing: true,
              verification_status: "changes_requested",
              updated_at: awaitingReviewUpdatedAt,
              review_submissions: [],
            },
          };
        case "ReopenChangesRequestedReviewDraft":
          return {
            reopen_changes_requested_review_draft: [
              { id: metadataId, verification_status: "unverified" },
            ],
          };
        default:
          throw new Error(`Unexpected operation: ${operationName(query)}`);
      }
    });

    const result = await removeAppFromReview(metadataId, {
      expectedVerificationStatus: "changes_requested",
      expectedMetadataUpdatedAt: awaitingReviewUpdatedAt,
    });

    expect(result.success).toBe(true);
    const reopenCall = requestMock.mock.calls.find(
      ([query]) => operationName(query) === "ReopenChangesRequestedReviewDraft",
    );
    expect(reopenCall?.[1]).toEqual({
      app_metadata_id: metadataId,
      expected_verification_status: "changes_requested",
      expected_metadata_updated_at: awaitingReviewUpdatedAt,
      actor_subject: "auth0|submitter",
      actor_email: "submitter@example.com",
    });
    expect(
      requestMock.mock.calls.some(
        ([query]) => operationName(query) === "WithdrawActiveReviewDraft",
      ),
    ).toBe(false);
  });
});
// #endregion
