const mockGetSignedUrl = jest.fn(async (_client, command) => {
  const input = command.input as { Key: string };
  return `https://signed.example/${input.Key}`;
});

jest.mock("server-only", () => ({}));
jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: (client: unknown, command: unknown) =>
    mockGetSignedUrl(client, command),
}));
jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn(() => ({})),
  GetObjectCommand: class GetObjectCommand {
    constructor(public input: unknown) {}
  },
}));

import { signReviewerSubmissionAssets } from "@/scenes/Admin/reviewer/server/sign-reviewer-assets";

describe("reviewer asset signing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ASSETS_S3_BUCKET_NAME = "assets";
    process.env.ASSETS_S3_REGION = "us-east-1";
  });

  it("signs only immutable submission filenames under the submitted app prefix", async () => {
    const assets = await signReviewerSubmissionAssets({
      appId: "app_123",
      metadataSnapshot: {
        logo_img_url: "logo_img.png",
        content_card_image_url: "content_card_image.jpg",
        showcase_img_urls: ["showcase_img_1.png"],
      },
      localizationsSnapshot: [
        {
          locale: "es_419",
          hero_image_url: "hero_image.png",
          showcase_img_urls: ["showcase_img_2.jpg"],
        },
      ],
    });

    expect(
      mockGetSignedUrl.mock.calls.map((call) => call[1].input.Key),
    ).toEqual(
      expect.arrayContaining([
        "unverified/app_123/logo_img.png",
        "unverified/app_123/content_card_image.jpg",
        "unverified/app_123/showcase_img_1.png",
        "unverified/app_123/es_419/hero_image.png",
        "unverified/app_123/es_419/showcase_img_2.jpg",
      ]),
    );
    expect(assets).toHaveLength(5);
  });

  it("refuses path traversal and remote URL values", async () => {
    const assets = await signReviewerSubmissionAssets({
      appId: "app_123",
      metadataSnapshot: {
        logo_img_url: "../other-app/logo.png",
        showcase_img_urls: ["https://attacker.example/image.png"],
      },
      localizationsSnapshot: [{ locale: "../fr", hero_image_url: "hero.png" }],
    });

    expect(assets).toEqual([]);
    expect(mockGetSignedUrl).not.toHaveBeenCalled();
  });
});
