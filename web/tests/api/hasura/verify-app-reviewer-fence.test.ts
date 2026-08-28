import { NextRequest, NextResponse } from "next/server";

const GetAppMetadata = jest.fn();
const VerifyApp = jest.fn();
const hasActiveListingReview = jest.fn();
const s3Send = jest.fn();
const S3Client = jest.fn().mockImplementation(() => ({ send: s3Send }));

jest.mock("@/api/hasura/verify-app/graphql/getAppMetadata.generated", () => ({
  getSdk: () => ({ GetAppMetadata }),
}));

jest.mock("@/api/hasura/verify-app/graphql/verifyApp.generated", () => ({
  getSdk: () => ({ verifyApp: VerifyApp }),
}));

jest.mock("@/api/helpers/reviewer-workflow", () => ({
  hasActiveListingReview: (...args: unknown[]) =>
    hasActiveListingReview(...args),
}));

jest.mock("@/api/helpers/graphql", () => ({
  getAPIReviewerGraphqlClient: jest.fn().mockResolvedValue({}),
}));

jest.mock("@/api/helpers/image-processing", () => ({
  processLogoImage: jest.fn().mockResolvedValue(undefined),
  processContentCardImage: jest.fn().mockResolvedValue(undefined),
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

const request = () =>
  new NextRequest(
    "https://portal.example.com/hasura/verify-app?app_id=app_123&reviewer_name=Legacy&is_reviewer_app_store_approved=true&is_reviewer_world_app_approved=true",
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
              verification_status: "awaiting_review",
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
    VerifyApp.mockResolvedValue({
      update_app_metadata_by_pk: { id: "meta_draft" },
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

  it("fences a consented listing draft before its review row is captured", async () => {
    hasActiveListingReview.mockResolvedValueOnce(false);

    const response = (await POST(request()))!;

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(
      expect.objectContaining({ code: "active_reviewer_workflow" }),
    );
    expect(hasActiveListingReview).toHaveBeenCalledWith("meta_draft");
    expect(S3Client).not.toHaveBeenCalled();
  });

  it("leaves the unrelated verification-only workflow available", async () => {
    GetAppMetadata.mockResolvedValueOnce({
      app: [
        {
          first_verified_at: null,
          app_metadata: [
            {
              id: "meta_draft",
              verification_status: "awaiting_review",
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
        verified_data_changes: expect.objectContaining({
          is_reviewer_app_store_approved: false,
          is_reviewer_world_app_approved: false,
        }),
      }),
    );
  });
});
