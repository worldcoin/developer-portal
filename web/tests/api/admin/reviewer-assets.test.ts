import { NextRequest } from "next/server";

const authenticateAdminRequest = jest.fn();
const fetchReviewerSubmissionAssetContext = jest.fn();
const signReviewerSubmissionAssets = jest.fn();
const retryReviewerAssetSnapshotRepair = jest.fn();
const reconcileReviewerAssetSnapshotRepairRetry = jest.fn();

jest.mock("@/lib/admin-auth", () => ({
  authenticateAdminRequest: (...args: unknown[]) =>
    authenticateAdminRequest(...args),
  isAdminReviewerPortalEnabled: () =>
    process.env.ADMIN_REVIEWER_PORTAL_ENABLED === "true",
  canReviewApps: (user: { accessLevel: string }) =>
    user.accessLevel === "review",
}));
jest.mock("@/scenes/Admin/reviewer/server/fetch-reviewer-data", () => ({
  fetchReviewerSubmissionAssetContext: (...args: unknown[]) =>
    fetchReviewerSubmissionAssetContext(...args),
}));
jest.mock("@/scenes/Admin/reviewer/server/sign-reviewer-assets", () => ({
  signReviewerSubmissionAssets: (...args: unknown[]) =>
    signReviewerSubmissionAssets(...args),
}));
jest.mock("@/api/helpers/reviewer-asset-snapshot-repair", () => ({
  retryReviewerAssetSnapshotRepair: (...args: unknown[]) =>
    retryReviewerAssetSnapshotRepair(...args),
  reconcileReviewerAssetSnapshotRepairRetry: (...args: unknown[]) =>
    reconcileReviewerAssetSnapshotRepairRetry(...args),
}));
jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn() },
}));

import { GET } from "@/api/admin/reviewer/submissions/[id]/assets";
import { POST as retryAssets } from "@/api/admin/reviewer/submissions/[id]/assets/retry";

const REVIEW_ID = "11111111-1111-4111-8111-111111111111";
const RETRY_OPERATION_ID = "44444444-4444-4444-8444-444444444444";
const request = () =>
  new NextRequest(
    `https://review.example.com/api/admin/reviewer/submissions/${REVIEW_ID}/assets`,
  );
const context = (id = REVIEW_ID) => ({ params: Promise.resolve({ id }) });

describe("GET reviewer submission assets", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_REVIEWER_PORTAL_ENABLED = "true";
    authenticateAdminRequest.mockResolvedValue({
      accessLevel: "read",
      email: "reader@example.com",
      role: "internal_dashboard_readonly",
      subject: "reader-subject",
    });
    fetchReviewerSubmissionAssetContext.mockResolvedValue({
      appId: "app_1",
      appMetadataId: "meta_1",
      assetSnapshot: {
        version: 1,
        prefix:
          "review-submissions/app_1/meta_1/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/",
        objects: {
          "unverified/app_1/logo.png":
            "review-submissions/app_1/meta_1/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/logo.png",
        },
      },
      metadataSnapshot: { logo_img_url: "logo.png" },
      localizationsSnapshot: [{ locale: "es_MX", hero_image_url: "hero.png" }],
    });
    signReviewerSubmissionAssets.mockResolvedValue([
      {
        id: "en:logo:0",
        kind: "logo",
        label: "App logo",
        locale: "en",
        signedUrl: "https://signed.example/logo.png",
      },
    ]);
  });

  it("allows a read-only admin and signs only the server-derived submission", async () => {
    const response = await GET(request(), context());

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(signReviewerSubmissionAssets).toHaveBeenCalledWith({
      appId: "app_1",
      appMetadataId: "meta_1",
      assetSnapshot: expect.objectContaining({ version: 1 }),
      metadataSnapshot: { logo_img_url: "logo.png" },
      localizationsSnapshot: [{ locale: "es_MX", hero_image_url: "hero.png" }],
    });
    expect(await response.json()).toEqual({
      assets: [expect.objectContaining({ signedUrl: expect.any(String) })],
    });
  });

  it("does not load or sign assets for an unauthenticated request", async () => {
    authenticateAdminRequest.mockResolvedValue(null);

    const response = await GET(request(), context());

    expect(response.status).toBe(401);
    expect(fetchReviewerSubmissionAssetContext).not.toHaveBeenCalled();
    expect(signReviewerSubmissionAssets).not.toHaveBeenCalled();
  });

  it("rejects a malformed review id before data access", async () => {
    const response = await GET(request(), context("not-a-uuid"));

    expect(response.status).toBe(400);
    expect(fetchReviewerSubmissionAssetContext).not.toHaveBeenCalled();
  });
});

describe("POST reviewer submission asset retry", () => {
  const retryRequest = (body: unknown = { operationId: RETRY_OPERATION_ID }) =>
    new NextRequest(
      `https://review.example.com/api/admin/reviewer/submissions/${REVIEW_ID}/assets/retry`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          host: "review.example.com",
          origin: "https://review.example.com",
        },
        body: JSON.stringify(body),
      },
    );

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_REVIEWER_PORTAL_ENABLED = "true";
    authenticateAdminRequest.mockResolvedValue({
      accessLevel: "review",
      email: "reviewer@example.com",
      role: "internal_dashboard_readonly",
      subject: "reviewer-subject",
    });
    retryReviewerAssetSnapshotRepair.mockResolvedValue({
      id: REVIEW_ID,
      attemptCount: 0,
      deadLetteredAt: null,
    });
    reconcileReviewerAssetSnapshotRepairRetry.mockResolvedValue(null);
  });

  it("requeues a dead-lettered repair with server-derived reviewer identity", async () => {
    const response = await retryAssets(retryRequest(), context());

    expect(response.status).toBe(200);
    expect(retryReviewerAssetSnapshotRepair).toHaveBeenCalledWith(
      expect.objectContaining({
        submissionId: REVIEW_ID,
        operationId: RETRY_OPERATION_ID,
        actor: expect.objectContaining({ subject: "reviewer-subject" }),
      }),
    );
  });

  it("reconciles the exact retry operation after a lost response", async () => {
    retryReviewerAssetSnapshotRepair.mockRejectedValueOnce(
      new Error("connection reset"),
    );
    reconcileReviewerAssetSnapshotRepairRetry.mockResolvedValueOnce({
      id: REVIEW_ID,
      attemptCount: 0,
      deadLetteredAt: null,
    });

    const response = await retryAssets(retryRequest(), context());

    expect(response.status).toBe(200);
    expect(
      reconcileReviewerAssetSnapshotRepairRetry.mock.calls[0][0].operationId,
    ).toBe(retryReviewerAssetSnapshotRepair.mock.calls[0][0].operationId);
  });

  it("rejects a read-only admin", async () => {
    authenticateAdminRequest.mockResolvedValue({
      accessLevel: "read",
      email: "reader@example.com",
      role: "internal_dashboard_readonly",
      subject: "reader-subject",
    });

    const response = await retryAssets(retryRequest(), context());

    expect(response.status).toBe(403);
    expect(retryReviewerAssetSnapshotRepair).not.toHaveBeenCalled();
  });

  it("rejects missing, malformed, and unknown retry fields", async () => {
    for (const body of [
      {},
      { operationId: "not-a-uuid" },
      { operationId: RETRY_OPERATION_ID, actor: "spoofed" },
    ]) {
      const response = await retryAssets(retryRequest(body), context());
      expect(response.status).toBe(400);
    }

    expect(retryReviewerAssetSnapshotRepair).not.toHaveBeenCalled();
  });
});
