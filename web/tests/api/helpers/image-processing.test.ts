import {
  processContentCardImage,
  processLogoImage,
} from "@/api/helpers/image-processing";
import { S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { Readable } from "node:stream";

// #region Mocks
jest.mock("../../../lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock("sharp", () => ({ __esModule: true, default: jest.fn() }));
// #endregion

// #region Test Data
const makeS3Client = (image: Buffer) =>
  ({
    send: jest.fn().mockResolvedValue({ Body: Readable.from([image]) }),
  }) as unknown as S3Client;
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
});

// #region Validate source bytes before decoding
describe("image processing [source format]", () => {
  it("rejects a JPEG uploaded as a PNG logo", async () => {
    const s3Client = makeS3Client(Buffer.from([0xff, 0xd8, 0xff, 0x00]));

    await expect(
      processLogoImage(
        s3Client,
        "bucket",
        "source",
        "verified/",
        "logo",
        400,
        400,
        30,
        100,
        "png",
      ),
    ).rejects.toThrow("Image bytes do not match a supported PNG or JPEG file.");

    expect(sharp).not.toHaveBeenCalled();
    expect(s3Client.send).toHaveBeenCalledTimes(1);
  });

  it("rejects non-image bytes for a content card", async () => {
    const s3Client = makeS3Client(Buffer.from("not an image"));

    await expect(
      processContentCardImage(
        s3Client,
        "bucket",
        "source",
        "verified/card.jpg",
        "jpg",
      ),
    ).rejects.toThrow("Image bytes do not match a supported PNG or JPEG file.");

    expect(sharp).not.toHaveBeenCalled();
    expect(s3Client.send).toHaveBeenCalledTimes(1);
  });

  it("processes a PNG logo when its bytes match the file type", async () => {
    const s3Client = makeS3Client(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
    (sharp as jest.MockedFunction<typeof sharp>).mockImplementation(
      () =>
        ({
          metadata: jest.fn().mockResolvedValue({ width: 1, height: 1 }),
          resize: jest.fn().mockReturnThis(),
          png: jest.fn().mockReturnThis(),
          composite: jest.fn().mockReturnThis(),
          toBuffer: jest.fn().mockResolvedValue(Buffer.from("processed")),
        }) as unknown as ReturnType<typeof sharp>,
    );

    await processLogoImage(
      s3Client,
      "bucket",
      "source",
      "verified/",
      "logo",
      400,
      400,
      30,
      100,
      "png",
    );

    expect(sharp).toHaveBeenCalled();
    expect(s3Client.send).toHaveBeenCalledTimes(4);
  });
});
// #endregion
