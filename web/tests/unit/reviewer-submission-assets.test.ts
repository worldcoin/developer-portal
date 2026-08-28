jest.mock("server-only", () => ({}));

import { snapshotReviewerSubmissionAssets } from "@/api/helpers/reviewer-submission-assets";
import {
  CopyObjectCommand,
  DeleteObjectsCommand,
  type S3Client,
} from "@aws-sdk/client-s3";

describe("reviewer submission asset snapshots", () => {
  it("uses the injected store to compensate a partial copy failure", async () => {
    const send = jest.fn(async (command: unknown) => {
      if (command instanceof CopyObjectCommand) throw new Error("copy failed");
      return {};
    });
    const s3Client = { send } as unknown as S3Client;

    await expect(
      snapshotReviewerSubmissionAssets({
        appId: "app_123",
        appMetadataId: "meta_123",
        snapshotId: "a".repeat(32),
        metadataSnapshot: { logo_img_url: "logo_img.png" },
        localizationsSnapshot: [],
        s3Client,
        bucketName: "assets",
      }),
    ).rejects.toThrow("copy failed");

    const cleanup = send.mock.calls
      .map(([command]) => command)
      .find((command) => command instanceof DeleteObjectsCommand);
    expect(cleanup?.input).toEqual({
      Bucket: "assets",
      Delete: {
        Objects: [
          {
            Key: `review-submissions/app_123/meta_123/${"a".repeat(32)}/logo_img.png`,
          },
        ],
        Quiet: true,
      },
    });
  });
});
