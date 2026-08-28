import { NextRequest, NextResponse } from "next/server";

const GetAppMetadata = jest.fn();
const VerifyApp = jest.fn();
const RegisterLegacyVerificationAssetSettlement = jest.fn();
const CompleteLegacyVerificationAssetSettlement = jest.fn();
const hasActiveListingReview = jest.fn();
const s3Send = jest.fn();
const S3Client = jest.fn().mockImplementation(() => ({ send: s3Send }));
const processLogoImage = jest.fn();
const processContentCardImage = jest.fn();
const collectVerifiedReviewerAssetKeys = jest.fn();
const deletePreparedReviewerAssets = jest.fn();
const expireVerifiedReviewerAssets = jest.fn();

jest.mock("@/api/hasura/verify-app/graphql/getAppMetadata.generated", () => ({
  getSdk: () => ({ GetAppMetadata }),
}));

jest.mock("@/api/hasura/verify-app/graphql/verifyApp.generated", () => ({
  getSdk: () => ({ verifyApp: VerifyApp }),
}));

jest.mock("@/api/hasura/verify-app/graphql/assetSettlement.generated", () => ({
  getSdk: () => ({
    RegisterLegacyVerificationAssetSettlement,
    CompleteLegacyVerificationAssetSettlement,
  }),
}));

jest.mock("@/api/helpers/reviewer-workflow", () => ({
  hasActiveListingReview: (...args: unknown[]) =>
    hasActiveListingReview(...args),
}));

jest.mock("@/api/helpers/reviewer-decision-assets", () => ({
  collectVerifiedReviewerAssetKeys: (...args: unknown[]) =>
    collectVerifiedReviewerAssetKeys(...args),
  deletePreparedReviewerAssets: (...args: unknown[]) =>
    deletePreparedReviewerAssets(...args),
  expireVerifiedReviewerAssets: (...args: unknown[]) =>
    expireVerifiedReviewerAssets(...args),
}));

jest.mock("@/api/helpers/graphql", () => ({
  getAPIReviewerGraphqlClient: jest.fn().mockResolvedValue({}),
}));

jest.mock("@/api/helpers/image-processing", () => ({
  processLogoImage: (...args: unknown[]) => processLogoImage(...args),
  processContentCardImage: (...args: unknown[]) =>
    processContentCardImage(...args),
  settleImageWrites: (writes: Promise<unknown>[]) => Promise.all(writes),
}));

jest.mock("@/api/helpers/utils", () => ({
  protectInternalEndpoint: () => ({ isAuthenticated: true }),
  getFileExtension: (filename: string) =>
    filename.slice(filename.lastIndexOf(".")),
}));

jest.mock("@/api/helpers/errors", () => ({
  errorHasuraQuery: ({ code, detail }: { code?: string; detail?: string }) =>
    NextResponse.json({ code, detail }, { status: 400 }),
}));

jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: function MockS3Client(...args: unknown[]) {
    return S3Client(...args);
  },
  CopyObjectCommand: jest.fn(),
  ListObjectsCommand: jest.fn(),
  PutObjectTaggingCommand: jest.fn(),
}));

jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

import { POST } from "@/api/hasura/verify-app";

const request = ({
  appStoreApproved = true,
  worldAppApproved = true,
}: {
  appStoreApproved?: boolean;
  worldAppApproved?: boolean;
} = {}) =>
  new NextRequest(
    `https://portal.example.com/hasura/verify-app?app_id=app_123&reviewer_name=Legacy&is_reviewer_app_store_approved=${appStoreApproved}&is_reviewer_world_app_approved=${worldAppApproved}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: { name: "verify_app" },
        session_variables: { "x-hasura-role": "reviewer" },
      }),
    },
  );

describe("legacy verify_app reviewer workflow fence", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_REVIEWER_PORTAL_ENABLED = "true";
    process.env.ASSETS_S3_BUCKET_NAME = "assets";
    process.env.ASSETS_S3_REGION = "us-east-1";
    GetAppMetadata.mockResolvedValue({
      app: [
        {
          first_verified_at: null,
          app_metadata: [
            {
              id: "meta_draft",
              updated_at: "2026-08-28T12:00:00.000Z",
              verification_status: "awaiting_review",
              app_mode: "mini-app",
              is_developer_allow_listing: true,
              logo_img_url: "logo_img.png",
              showcase_img_urls: ["showcase_img_1.png"],
              localisations: [],
            },
          ],
        },
      ],
    });
    hasActiveListingReview.mockResolvedValue(true);
    s3Send.mockResolvedValue({ Contents: [] });
    processLogoImage.mockResolvedValue(undefined);
    processContentCardImage.mockResolvedValue(undefined);
    collectVerifiedReviewerAssetKeys.mockReturnValue([]);
    deletePreparedReviewerAssets.mockResolvedValue(undefined);
    expireVerifiedReviewerAssets.mockResolvedValue([]);
    RegisterLegacyVerificationAssetSettlement.mockResolvedValue({
      register_legacy_app_verification_asset_settlement: [
        {
          operation_id: "registered",
          outcome: "pending",
          delivery_status: "pending",
        },
      ],
    });
    CompleteLegacyVerificationAssetSettlement.mockResolvedValue({
      complete_legacy_app_verification_asset_settlement: [
        { operation_id: "registered", delivery_status: "delivered" },
      ],
    });
    VerifyApp.mockResolvedValue({
      update_app_metadata_by_pk: { id: "meta_draft" },
      legacy_verify_app_metadata: [{ id: "meta_draft" }],
    });
  });

  it("rejects an active listing review before listing, expiring, or copying S3", async () => {
    const response = (await POST(request()))!;

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(
      expect.objectContaining({ code: "active_reviewer_workflow" }),
    );
    expect(hasActiveListingReview).toHaveBeenCalledWith("meta_draft");
    expect(S3Client).not.toHaveBeenCalled();
    expect(s3Send).not.toHaveBeenCalled();
    expect(VerifyApp).not.toHaveBeenCalled();
  });

  it("keeps an existing active review fenced when the UI flag is disabled", async () => {
    process.env.ADMIN_REVIEWER_PORTAL_ENABLED = "false";

    const response = (await POST(request()))!;

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(
      expect.objectContaining({ code: "active_reviewer_workflow" }),
    );
    expect(S3Client).not.toHaveBeenCalled();
  });

  it("keeps native submissions with an active review fenced", async () => {
    GetAppMetadata.mockResolvedValueOnce({
      app: [
        {
          first_verified_at: null,
          app_metadata: [
            {
              id: "meta_draft",
              verification_status: "awaiting_review",
              app_mode: "native",
              is_developer_allow_listing: true,
              logo_img_url: "logo_img.png",
              showcase_img_urls: ["showcase_img_1.png"],
              localisations: [],
            },
          ],
        },
      ],
    });

    const response = (await POST(request()))!;

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(
      expect.objectContaining({ code: "active_reviewer_workflow" }),
    );
    expect(hasActiveListingReview).toHaveBeenCalledWith("meta_draft");
    expect(S3Client).not.toHaveBeenCalled();
  });

  it.each(["mini-app", "external"])(
    "fences a consented %s draft before its review row is captured",
    async (appMode) => {
      GetAppMetadata.mockResolvedValueOnce({
        app: [
          {
            first_verified_at: null,
            app_metadata: [
              {
                id: "meta_draft",
                verification_status: "awaiting_review",
                app_mode: appMode,
                is_developer_allow_listing: true,
                logo_img_url: "logo_img.png",
                showcase_img_urls: ["showcase_img_1.png"],
                localisations: [],
              },
            ],
          },
        ],
      });
      hasActiveListingReview.mockResolvedValueOnce(false);

      const response = (await POST(request()))!;

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual(
        expect.objectContaining({ code: "active_reviewer_workflow" }),
      );
      expect(hasActiveListingReview).toHaveBeenCalledWith("meta_draft");
      expect(S3Client).not.toHaveBeenCalled();
    },
  );

  it("leaves the unrelated verification-only workflow available", async () => {
    GetAppMetadata.mockResolvedValueOnce({
      app: [
        {
          first_verified_at: null,
          app_metadata: [
            {
              id: "meta_draft",
              verification_status: "awaiting_review",
              app_mode: "mini-app",
              is_developer_allow_listing: false,
              logo_img_url: "logo_img.png",
              showcase_img_urls: ["showcase_img_1.png"],
              localisations: [],
            },
          ],
        },
      ],
    });
    hasActiveListingReview.mockResolvedValueOnce(false);

    const response = (await POST(request()))!;

    expect(response.status).toBe(200);
    expect(S3Client).toHaveBeenCalled();
    expect(VerifyApp).toHaveBeenCalledTimes(1);
  });

  it("cannot publish a verification-only submission from caller supplied flags", async () => {
    GetAppMetadata.mockResolvedValueOnce({
      app: [
        {
          first_verified_at: null,
          app_metadata: [
            {
              id: "meta_draft",
              verification_status: "awaiting_review",
              app_mode: "mini-app",
              is_developer_allow_listing: false,
              logo_img_url: "logo_img.png",
              showcase_img_urls: ["showcase_img_1.png"],
              localisations: [],
            },
          ],
        },
      ],
    });
    hasActiveListingReview.mockResolvedValueOnce(false);

    const response = (await POST(request()))!;

    expect(response.status).toBe(200);
    expect(VerifyApp).toHaveBeenCalledWith(
      expect.objectContaining({
        is_reviewer_app_store_approved: false,
        is_reviewer_world_app_approved: false,
      }),
    );
  });

  it("preserves native reviewer-selected publication flags", async () => {
    GetAppMetadata.mockResolvedValueOnce({
      app: [
        {
          first_verified_at: null,
          app_metadata: [
            {
              id: "meta_draft",
              verification_status: "awaiting_review",
              app_mode: "native",
              is_developer_allow_listing: true,
              logo_img_url: "logo_img.png",
              showcase_img_urls: ["showcase_img_1.png"],
              localisations: [],
            },
          ],
        },
      ],
    });
    hasActiveListingReview.mockResolvedValueOnce(false);

    const response = (await POST(
      request({ appStoreApproved: false, worldAppApproved: true }),
    ))!;

    expect(response.status).toBe(200);
    expect(VerifyApp).toHaveBeenCalledWith(
      expect.objectContaining({
        is_reviewer_app_store_approved: false,
        is_reviewer_world_app_approved: true,
      }),
    );
  });

  it("allows native verification without showcases when publication is not requested", async () => {
    GetAppMetadata.mockResolvedValueOnce({
      app: [
        {
          first_verified_at: null,
          app_metadata: [
            {
              id: "meta_draft",
              verification_status: "awaiting_review",
              app_mode: "native",
              is_developer_allow_listing: true,
              logo_img_url: "logo_img.png",
              showcase_img_urls: null,
              localisations: [],
            },
          ],
        },
      ],
    });
    hasActiveListingReview.mockResolvedValueOnce(false);

    const response = (await POST(
      request({ appStoreApproved: false, worldAppApproved: false }),
    ))!;

    expect(response.status).toBe(200);
    expect(VerifyApp).toHaveBeenCalledWith(
      expect.objectContaining({
        is_reviewer_app_store_approved: false,
        is_reviewer_world_app_approved: false,
      }),
    );
  });

  it("requires showcase images when native publication is requested", async () => {
    GetAppMetadata.mockResolvedValueOnce({
      app: [
        {
          first_verified_at: null,
          app_metadata: [
            {
              id: "meta_draft",
              verification_status: "awaiting_review",
              app_mode: "native",
              is_developer_allow_listing: true,
              logo_img_url: "logo_img.png",
              showcase_img_urls: null,
              localisations: [],
            },
          ],
        },
      ],
    });
    hasActiveListingReview.mockResolvedValueOnce(false);

    const response = (await POST(request()))!;

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(
      expect.objectContaining({ code: "invalid_approval_permissions" }),
    );
    expect(S3Client).not.toHaveBeenCalled();
    expect(VerifyApp).not.toHaveBeenCalled();
  });

  it("cleans prepared assets when the exact verification version is stale", async () => {
    GetAppMetadata.mockResolvedValueOnce({
      app: [
        {
          first_verified_at: null,
          app_metadata: [
            {
              id: "meta_draft",
              updated_at: "2026-08-28T12:00:00.000Z",
              verification_status: "awaiting_review",
              app_mode: "mini-app",
              is_developer_allow_listing: false,
              logo_img_url: "logo_img.png",
              showcase_img_urls: ["showcase_img_1.png"],
              localisations: [],
            },
          ],
        },
      ],
    });
    hasActiveListingReview.mockResolvedValueOnce(false);
    VerifyApp.mockResolvedValueOnce({ legacy_verify_app_metadata: [] });

    const response = (await POST(request()))!;

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(
      expect.objectContaining({ code: "verification_conflict" }),
    );
    expect(VerifyApp).toHaveBeenCalledWith(
      expect.objectContaining({
        app_id: "app_123",
        id_to_verify: "meta_draft",
        expected_metadata_updated_at: "2026-08-28T12:00:00.000Z",
      }),
    );
    expect(deletePreparedReviewerAssets).toHaveBeenCalledWith({
      keys: expect.arrayContaining([
        expect.stringMatching(/^verified\/app_123\/.+\.png$/),
      ]),
      s3Client: expect.anything(),
      bucketName: "assets",
    });
    expect(expireVerifiedReviewerAssets).not.toHaveBeenCalled();
  });

  it("durably registers the exact asset plan before starting any S3 write", async () => {
    GetAppMetadata.mockResolvedValueOnce({
      app: [
        {
          first_verified_at: null,
          app_metadata: [
            {
              id: "meta_draft",
              updated_at: "2026-08-28T12:00:00.000Z",
              verification_status: "awaiting_review",
              app_mode: "mini-app",
              is_developer_allow_listing: false,
              logo_img_url: "logo_img.png",
              showcase_img_urls: null,
              localisations: [],
            },
          ],
        },
      ],
    });
    hasActiveListingReview.mockResolvedValueOnce(false);

    const response = (await POST(request()))!;

    expect(response.status).toBe(200);
    expect(RegisterLegacyVerificationAssetSettlement).toHaveBeenCalledWith(
      expect.objectContaining({
        app_id: "app_123",
        app_metadata_id: "meta_draft",
        expected_metadata_updated_at: "2026-08-28T12:00:00.000Z",
        prepared_asset_keys: expect.arrayContaining([
          expect.stringMatching(/^verified\/app_123\/.+\.png$/),
        ]),
        prior_asset_keys: [],
      }),
    );
    expect(
      RegisterLegacyVerificationAssetSettlement.mock.invocationCallOrder[0],
    ).toBeLessThan(processLogoImage.mock.invocationCallOrder[0]);
  });

  it("does not start S3 writes when durable registration fails", async () => {
    GetAppMetadata.mockResolvedValueOnce({
      app: [
        {
          first_verified_at: null,
          app_metadata: [
            {
              id: "meta_draft",
              updated_at: "2026-08-28T12:00:00.000Z",
              verification_status: "awaiting_review",
              app_mode: "mini-app",
              is_developer_allow_listing: false,
              logo_img_url: "logo_img.png",
              showcase_img_urls: null,
              localisations: [],
            },
          ],
        },
      ],
    });
    hasActiveListingReview.mockResolvedValueOnce(false);
    RegisterLegacyVerificationAssetSettlement.mockResolvedValueOnce({
      register_legacy_app_verification_asset_settlement: [],
    });

    await expect(POST(request())).rejects.toThrow(
      "Unable to register legacy verification assets",
    );

    expect(processLogoImage).not.toHaveBeenCalled();
    expect(s3Send).not.toHaveBeenCalled();
    expect(VerifyApp).not.toHaveBeenCalled();
  });

  it("expires only the exact prior live assets after the CAS commits", async () => {
    const priorVerified = {
      id: "meta_live",
      updated_at: "2026-08-27T12:00:00.000Z",
      verification_status: "verified",
      app_mode: "mini-app",
      is_developer_allow_listing: true,
      logo_img_url: "live_logo.png",
      showcase_img_urls: ["live_showcase.png"],
      localisations: [],
    };
    GetAppMetadata.mockResolvedValueOnce({
      app: [
        {
          first_verified_at: "2026-08-27T12:00:00.000Z",
          app_metadata: [
            priorVerified,
            {
              id: "meta_draft",
              updated_at: "2026-08-28T12:00:00.000Z",
              verification_status: "awaiting_review",
              app_mode: "mini-app",
              is_developer_allow_listing: false,
              logo_img_url: "logo_img.png",
              showcase_img_urls: ["showcase_img_1.png"],
              localisations: [],
            },
          ],
        },
      ],
    });
    hasActiveListingReview.mockResolvedValueOnce(false);
    collectVerifiedReviewerAssetKeys.mockReturnValueOnce([
      "verified/app_123/live_logo.png",
      "verified/app_123/live_showcase.png",
    ]);

    const response = (await POST(request()))!;

    expect(response.status).toBe(200);
    expect(collectVerifiedReviewerAssetKeys).toHaveBeenCalledWith({
      appId: "app_123",
      metadata: priorVerified,
    });
    expect(VerifyApp).toHaveBeenCalledWith(
      expect.objectContaining({
        expected_prior_verified_id: "meta_live",
        expected_prior_verified_updated_at: "2026-08-27T12:00:00.000Z",
      }),
    );
    expect(expireVerifiedReviewerAssets).toHaveBeenCalledWith({
      keys: [
        "verified/app_123/live_logo.png",
        "verified/app_123/live_showcase.png",
      ],
      s3Client: expect.anything(),
      bucketName: "assets",
    });
    expect(VerifyApp.mock.invocationCallOrder[0]).toBeLessThan(
      expireVerifiedReviewerAssets.mock.invocationCallOrder[0],
    );
    expect(deletePreparedReviewerAssets).not.toHaveBeenCalled();
  });

  it("reconciles a lost response with the same operation before expiring prior assets", async () => {
    GetAppMetadata.mockResolvedValueOnce({
      app: [
        {
          first_verified_at: "2026-08-27T12:00:00.000Z",
          app_metadata: [
            {
              id: "meta_live",
              updated_at: "2026-08-27T12:00:00.000Z",
              verification_status: "verified",
              app_mode: "mini-app",
              is_developer_allow_listing: true,
              logo_img_url: "live_logo.png",
              showcase_img_urls: null,
              localisations: [],
            },
            {
              id: "meta_draft",
              updated_at: "2026-08-28T12:00:00.000Z",
              verification_status: "awaiting_review",
              app_mode: "mini-app",
              is_developer_allow_listing: false,
              logo_img_url: "logo_img.png",
              showcase_img_urls: ["showcase_img_1.png"],
              localisations: [],
            },
          ],
        },
      ],
    });
    hasActiveListingReview.mockResolvedValueOnce(false);
    collectVerifiedReviewerAssetKeys.mockReturnValueOnce([
      "verified/app_123/live_logo.png",
    ]);
    VerifyApp.mockRejectedValueOnce(new Error("socket closed"));
    VerifyApp.mockResolvedValueOnce({
      legacy_verify_app_metadata: [{ id: "meta_draft" }],
    });

    const response = (await POST(request()))!;

    expect(response.status).toBe(200);
    expect(VerifyApp).toHaveBeenCalledTimes(2);
    expect(VerifyApp.mock.calls[0][0]).toEqual(VerifyApp.mock.calls[1][0]);
    expect(VerifyApp.mock.calls[0][0]).toEqual(
      expect.objectContaining({ operation_id: expect.any(String) }),
    );
    expect(deletePreparedReviewerAssets).not.toHaveBeenCalled();
    expect(expireVerifiedReviewerAssets).toHaveBeenCalledWith({
      keys: ["verified/app_123/live_logo.png"],
      s3Client: expect.anything(),
      bucketName: "assets",
    });
    expect(VerifyApp.mock.invocationCallOrder[1]).toBeLessThan(
      expireVerifiedReviewerAssets.mock.invocationCallOrder[0],
    );
  });

  it("cleans the prepared operation when lost-response reconciliation returns no row", async () => {
    GetAppMetadata.mockResolvedValueOnce({
      app: [
        {
          first_verified_at: null,
          app_metadata: [
            {
              id: "meta_draft",
              updated_at: "2026-08-28T12:00:00.000Z",
              verification_status: "awaiting_review",
              app_mode: "mini-app",
              is_developer_allow_listing: false,
              logo_img_url: "logo_img.png",
              showcase_img_urls: null,
              localisations: [],
            },
          ],
        },
      ],
    });
    hasActiveListingReview.mockResolvedValueOnce(false);
    VerifyApp.mockRejectedValueOnce(new Error("socket closed"));
    VerifyApp.mockResolvedValueOnce({ legacy_verify_app_metadata: [] });

    const response = (await POST(request()))!;

    expect(response.status).toBe(400);
    expect(VerifyApp).toHaveBeenCalledTimes(2);
    expect(VerifyApp.mock.calls[0][0]).toEqual(VerifyApp.mock.calls[1][0]);
    expect(deletePreparedReviewerAssets).toHaveBeenCalledTimes(1);
    expect(expireVerifiedReviewerAssets).not.toHaveBeenCalled();
  });

  it("keeps prepared assets when both exact-operation responses are ambiguous", async () => {
    GetAppMetadata.mockResolvedValueOnce({
      app: [
        {
          first_verified_at: null,
          app_metadata: [
            {
              id: "meta_draft",
              updated_at: "2026-08-28T12:00:00.000Z",
              verification_status: "awaiting_review",
              app_mode: "mini-app",
              is_developer_allow_listing: false,
              logo_img_url: "logo_img.png",
              showcase_img_urls: null,
              localisations: [],
            },
          ],
        },
      ],
    });
    hasActiveListingReview.mockResolvedValueOnce(false);
    VerifyApp.mockRejectedValueOnce(new Error("first response lost"));
    VerifyApp.mockRejectedValueOnce(new Error("retry response lost"));

    await expect(POST(request())).rejects.toThrow("retry response lost");

    expect(VerifyApp).toHaveBeenCalledTimes(2);
    expect(VerifyApp.mock.calls[0][0]).toEqual(VerifyApp.mock.calls[1][0]);
    expect(deletePreparedReviewerAssets).not.toHaveBeenCalled();
    expect(expireVerifiedReviewerAssets).not.toHaveBeenCalled();
    expect(RegisterLegacyVerificationAssetSettlement).toHaveBeenCalledTimes(1);
    expect(CompleteLegacyVerificationAssetSettlement).not.toHaveBeenCalled();
  });

  it("uses an exact read-only operation lookup after both mutation responses are lost", async () => {
    const initialApp = {
      first_verified_at: null,
      app_metadata: [
        {
          id: "meta_live",
          updated_at: "2026-08-27T12:00:00.000Z",
          legacy_verification_operation_id: null,
          verification_status: "verified",
          app_mode: "mini-app",
          is_developer_allow_listing: true,
          logo_img_url: "live_logo.png",
          showcase_img_urls: null,
          localisations: [],
        },
        {
          id: "meta_draft",
          updated_at: "2026-08-28T12:00:00.000Z",
          legacy_verification_operation_id: null,
          verification_status: "awaiting_review",
          app_mode: "mini-app",
          is_developer_allow_listing: false,
          logo_img_url: "logo_img.png",
          showcase_img_urls: null,
          localisations: [],
        },
      ],
    };
    GetAppMetadata.mockResolvedValueOnce({ app: [initialApp] });
    GetAppMetadata.mockImplementationOnce(async () => ({
      app: [
        {
          ...initialApp,
          app_metadata: [
            {
              ...initialApp.app_metadata[1],
              verification_status: "verified",
              legacy_verification_operation_id:
                VerifyApp.mock.calls[0][0].operation_id,
            },
          ],
        },
      ],
    }));
    hasActiveListingReview.mockResolvedValueOnce(false);
    collectVerifiedReviewerAssetKeys.mockReturnValueOnce([
      "verified/app_123/live_logo.png",
    ]);
    VerifyApp.mockRejectedValueOnce(new Error("first response lost"));
    VerifyApp.mockRejectedValueOnce(new Error("retry response lost"));

    const response = (await POST(request()))!;

    expect(response.status).toBe(200);
    expect(GetAppMetadata).toHaveBeenCalledTimes(2);
    expect(deletePreparedReviewerAssets).not.toHaveBeenCalled();
    expect(expireVerifiedReviewerAssets).toHaveBeenCalledTimes(1);
    expect(CompleteLegacyVerificationAssetSettlement).toHaveBeenCalledWith(
      expect.objectContaining({
        expected_outcome: "committed",
        delivery_succeeded: true,
      }),
    );
  });

  it("records failed synchronous cleanup as retryable durable work", async () => {
    GetAppMetadata.mockResolvedValueOnce({
      app: [
        {
          first_verified_at: null,
          app_metadata: [
            {
              id: "meta_draft",
              updated_at: "2026-08-28T12:00:00.000Z",
              verification_status: "awaiting_review",
              app_mode: "mini-app",
              is_developer_allow_listing: false,
              logo_img_url: "logo_img.png",
              showcase_img_urls: null,
              localisations: [],
            },
          ],
        },
      ],
    });
    hasActiveListingReview.mockResolvedValueOnce(false);
    VerifyApp.mockResolvedValueOnce({ legacy_verify_app_metadata: [] });
    deletePreparedReviewerAssets.mockRejectedValueOnce(
      new Error("S3 unavailable"),
    );

    const response = (await POST(request()))!;

    expect(response.status).toBe(400);
    expect(CompleteLegacyVerificationAssetSettlement).toHaveBeenCalledWith(
      expect.objectContaining({
        expected_outcome: "aborted",
        delivery_succeeded: false,
        error: "Legacy verification asset cleanup failed.",
      }),
    );
  });

  it("records failed synchronous prior expiry as retryable durable work", async () => {
    GetAppMetadata.mockResolvedValueOnce({
      app: [
        {
          first_verified_at: "2026-08-27T12:00:00.000Z",
          app_metadata: [
            {
              id: "meta_live",
              updated_at: "2026-08-27T12:00:00.000Z",
              verification_status: "verified",
              app_mode: "mini-app",
              is_developer_allow_listing: true,
              logo_img_url: "live_logo.png",
              showcase_img_urls: null,
              localisations: [],
            },
            {
              id: "meta_draft",
              updated_at: "2026-08-28T12:00:00.000Z",
              verification_status: "awaiting_review",
              app_mode: "mini-app",
              is_developer_allow_listing: false,
              logo_img_url: "logo_img.png",
              showcase_img_urls: null,
              localisations: [],
            },
          ],
        },
      ],
    });
    hasActiveListingReview.mockResolvedValueOnce(false);
    collectVerifiedReviewerAssetKeys.mockReturnValueOnce([
      "verified/app_123/live_logo.png",
    ]);
    expireVerifiedReviewerAssets.mockResolvedValueOnce([
      "verified/app_123/live_logo.png",
    ]);

    const response = (await POST(request()))!;

    expect(response.status).toBe(200);
    expect(CompleteLegacyVerificationAssetSettlement).toHaveBeenCalledWith(
      expect.objectContaining({
        expected_outcome: "committed",
        delivery_succeeded: false,
        error: "Legacy verification prior asset expiry failed.",
      }),
    );
  });
});
