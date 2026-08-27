import { NextRequest } from "next/server";

const authenticateAdminRequest = jest.fn();
const fetchReviewerSubmission = jest.fn();
const signReviewerSubmissionAssets = jest.fn();

jest.mock("@/lib/admin-auth", () => ({
  authenticateAdminRequest: (...args: unknown[]) =>
    authenticateAdminRequest(...args),
  isAdminReviewerPortalEnabled: () =>
    process.env.ADMIN_REVIEWER_PORTAL_ENABLED === "true",
}));
jest.mock("@/scenes/Admin/reviewer/server/fetch-reviewer-data", () => ({
  fetchReviewerSubmission: (...args: unknown[]) =>
    fetchReviewerSubmission(...args),
}));
jest.mock("@/scenes/Admin/reviewer/server/sign-reviewer-assets", () => ({
  signReviewerSubmissionAssets: (...args: unknown[]) =>
    signReviewerSubmissionAssets(...args),
}));
jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn() },
}));

import { GET } from "@/api/admin/reviewer/submissions/[id]/assets";

const REVIEW_ID = "11111111-1111-4111-8111-111111111111";
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
    fetchReviewerSubmission.mockResolvedValue({
      appId: "app_1",
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
    expect(fetchReviewerSubmission).not.toHaveBeenCalled();
    expect(signReviewerSubmissionAssets).not.toHaveBeenCalled();
  });

  it("rejects a malformed review id before data access", async () => {
    const response = await GET(request(), context("not-a-uuid"));

    expect(response.status).toBe(400);
    expect(fetchReviewerSubmission).not.toHaveBeenCalled();
  });
});
