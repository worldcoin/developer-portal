import {
  AnalyticsS3ConfigurationError,
  AnalyticsS3ObjectTooLargeError,
  downloadTotalsCsv,
  findLatestTotalsObject,
  type TableObjectDescriptor,
} from "@/api/helpers/selfie-check-analytics/s3";

// #region Mocks
const s3SendMock = jest.fn();

jest.mock("@aws-sdk/client-s3", () => ({
  GetObjectCommand: jest.fn().mockImplementation((input) => ({
    command: "GetObject",
    input,
  })),
  ListObjectsV2Command: jest.fn().mockImplementation((input) => ({
    command: "ListObjectsV2",
    input,
  })),
  S3Client: jest.fn().mockImplementation(() => ({ send: s3SendMock })),
}));
// #endregion

// #region Test Data
const ENV_KEYS = [
  "SELFIE_CHECK_ANALYTICS_S3_BUCKET_NAME",
  "SELFIE_CHECK_ANALYTICS_S3_REGION",
  "SELFIE_CHECK_ANALYTICS_TOTALS_PREFIX",
] as const;
const originalEnv = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]]),
);

const bucket = "analytics-bucket";
const region = "eu-west-1";

const streamBody = (chunks: Array<string | Uint8Array>) => ({
  destroy: jest.fn(),
  async *[Symbol.asyncIterator]() {
    for (const chunk of chunks) yield chunk;
  },
});

const descriptor = (
  overrides: Partial<TableObjectDescriptor> = {},
): TableObjectDescriptor => ({
  bucket,
  region,
  key: "totals/data_20260826_210000.csv",
  etag: '"etag-list"',
  identity: 'totals/data_20260826_210000.csv:"etag-list"',
  dataAsOf: new Date("2026-08-26T21:00:00.000Z"),
  lastModified: new Date("2026-08-26T21:01:00.000Z"),
  sizeBytes: 100,
  ...overrides,
});
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  process.env.SELFIE_CHECK_ANALYTICS_S3_BUCKET_NAME = bucket;
  process.env.SELFIE_CHECK_ANALYTICS_S3_REGION = region;
  process.env.SELFIE_CHECK_ANALYTICS_TOTALS_PREFIX = "totals/";
});

afterAll(() => {
  for (const key of ENV_KEYS) {
    const value = originalEnv[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

// #region Latest object discovery
describe("findLatestTotalsObject", () => {
  it("selects the newest non-empty CSV across every listing page", async () => {
    s3SendMock
      .mockResolvedValueOnce({
        Contents: [
          {
            Key: "totals/readme.txt",
            LastModified: new Date("2026-08-26T23:00:00.000Z"),
            Size: 10,
          },
          {
            Key: "totals/data_20260826_225211.csv",
            LastModified: new Date("2026-08-26T22:00:00.000Z"),
            Size: 0,
          },
          {
            Key: "totals/data_20260826_235231.csv",
            ETag: '"older"',
            // This was uploaded later than the newest dataset. Selection must
            // use the filename's dataset time, not S3 LastModified.
            LastModified: new Date("2026-08-27T03:00:00.000Z"),
            Size: 50,
          },
        ],
        IsTruncated: true,
        NextContinuationToken: "page-2",
      })
      .mockResolvedValueOnce({
        Contents: [
          {
            Key: "totals/data_20260827_015233.csv",
            ETag: '"latest"',
            LastModified: new Date("2026-08-27T02:00:00.000Z"),
            Size: 75,
          },
        ],
        IsTruncated: false,
      });

    await expect(findLatestTotalsObject()).resolves.toEqual({
      bucket,
      region,
      key: "totals/data_20260827_015233.csv",
      etag: '"latest"',
      identity: 'totals/data_20260827_015233.csv:"latest"',
      dataAsOf: new Date("2026-08-27T01:52:33.000Z"),
      lastModified: new Date("2026-08-27T02:00:00.000Z"),
      sizeBytes: 75,
    });

    expect(s3SendMock).toHaveBeenCalledTimes(2);
    expect(s3SendMock.mock.calls[1][0]).toEqual({
      command: "ListObjectsV2",
      input: {
        Bucket: bucket,
        Prefix: "totals/",
        ContinuationToken: "page-2",
      },
    });
  });

  it("ignores filenames with invalid timestamps", async () => {
    s3SendMock.mockResolvedValueOnce({
      Contents: [
        {
          Key: "totals/data_20261399_256199.csv",
          LastModified: new Date("2026-08-27T03:00:00.000Z"),
          Size: 10,
        },
      ],
    });

    await expect(findLatestTotalsObject()).rejects.toThrow(
      "No non-empty timestamped totals CSV found",
    );
  });

  it("fails explicitly when no usable totals CSV exists", async () => {
    s3SendMock.mockResolvedValueOnce({
      Contents: [
        {
          Key: "totals/data_20260827_015233.csv",
          LastModified: new Date("2026-08-27T02:00:00.000Z"),
          Size: 0,
        },
      ],
    });

    await expect(findLatestTotalsObject()).rejects.toThrow(
      "No non-empty timestamped totals CSV found",
    );
  });

  it("uses the totals directory as the default prefix", async () => {
    delete process.env.SELFIE_CHECK_ANALYTICS_TOTALS_PREFIX;
    s3SendMock.mockResolvedValueOnce({
      Contents: [
        {
          Key: "totals/data_20260827_015233.csv",
          LastModified: new Date("2026-08-27T02:00:00.000Z"),
          Size: 10,
        },
      ],
    });

    await findLatestTotalsObject();

    expect(s3SendMock.mock.calls[0][0]).toEqual({
      command: "ListObjectsV2",
      input: {
        Bucket: bucket,
        Prefix: "totals/",
        ContinuationToken: undefined,
      },
    });
  });

  it("fails when a truncated response omits its continuation token", async () => {
    s3SendMock.mockResolvedValueOnce({
      Contents: [],
      IsTruncated: true,
    });

    await expect(findLatestTotalsObject()).rejects.toThrow(
      "without a continuation token",
    );
  });

  it("fails before calling S3 when configuration is missing", async () => {
    delete process.env.SELFIE_CHECK_ANALYTICS_S3_BUCKET_NAME;

    await expect(findLatestTotalsObject()).rejects.toBeInstanceOf(
      AnalyticsS3ConfigurationError,
    );
    expect(s3SendMock).not.toHaveBeenCalled();
  });

  it("adds bucket and prefix context to listing failures", async () => {
    s3SendMock.mockRejectedValueOnce(new Error("AccessDenied"));

    await expect(findLatestTotalsObject()).rejects.toThrow(
      `Failed to list S3 totals objects: bucket=${bucket}, prefix=totals/`,
    );
  });
});
// #endregion

// #region Object download
describe("downloadTotalsCsv", () => {
  it("downloads the exact listed ETag and returns actual object metadata", async () => {
    const body =
      "PARTNER_APP_ID,N_PROOFS\napp_0123456789abcdef0123456789abcdef,3\n";
    s3SendMock.mockResolvedValueOnce({
      Body: streamBody([body]),
      ContentLength: Buffer.byteLength(body),
      ETag: '"etag-get"',
    });

    const result = await downloadTotalsCsv(descriptor());

    expect(s3SendMock.mock.calls[0][0]).toEqual({
      command: "GetObject",
      input: {
        Bucket: bucket,
        Key: "totals/data_20260826_210000.csv",
        IfMatch: '"etag-list"',
      },
    });
    expect(result.csv).toBe(body);
    expect(result.object).toEqual(
      expect.objectContaining({
        etag: '"etag-get"',
        identity: 'totals/data_20260826_210000.csv:"etag-get"',
        sizeBytes: Buffer.byteLength(body),
      }),
    );
  });

  it("rejects an oversized listed object without downloading it", async () => {
    await expect(
      downloadTotalsCsv(descriptor({ sizeBytes: 25 * 1024 * 1024 + 1 })),
    ).rejects.toBeInstanceOf(AnalyticsS3ObjectTooLargeError);

    expect(s3SendMock).not.toHaveBeenCalled();
  });

  it("rejects a response without a body", async () => {
    s3SendMock.mockResolvedValueOnce({ ContentLength: 10 });

    await expect(downloadTotalsCsv(descriptor())).rejects.toThrow(
      "has no body",
    );
  });

  it("rejects an empty body", async () => {
    s3SendMock.mockResolvedValueOnce({
      Body: streamBody([]),
      ContentLength: 0,
    });

    await expect(downloadTotalsCsv(descriptor())).rejects.toThrow("is empty");
  });

  it("rejects invalid UTF-8", async () => {
    s3SendMock.mockResolvedValueOnce({
      Body: streamBody([Uint8Array.from([0xc3, 0x28])]),
      ContentLength: 2,
    });

    await expect(downloadTotalsCsv(descriptor())).rejects.toThrow(
      "is not valid UTF-8",
    );
  });

  it("adds bucket and key context to download failures", async () => {
    s3SendMock.mockRejectedValueOnce(new Error("NoSuchKey"));

    await expect(downloadTotalsCsv(descriptor())).rejects.toThrow(
      `Failed to download S3 totals object: bucket=${bucket}, key=totals/data_20260826_210000.csv`,
    );
  });
});
// #endregion
