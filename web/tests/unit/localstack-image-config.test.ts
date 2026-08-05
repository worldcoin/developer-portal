type RemotePattern = {
  protocol: "http" | "https";
  hostname: string;
  port?: string;
  pathname: string;
};

type GetAssetsS3RemotePattern = (settings: {
  endpoint?: string;
  bucket?: string;
  region?: string;
}) => RemotePattern | undefined;

let getAssetsS3RemotePattern: GetAssetsS3RemotePattern;

beforeAll(async () => {
  const configModule = await import("../../next.config.mjs");
  getAssetsS3RemotePattern = configModule.getAssetsS3RemotePattern;
});

// #region S3 image host selection
describe("Next image configuration [S3 host]", () => {
  it("uses the LocalStack virtual-host URL when an S3 endpoint is configured", () => {
    expect(
      getAssetsS3RemotePattern({
        endpoint: "http://s3.localhost.localstack.cloud:4566",
        bucket: "developer-portal-assets",
        region: "us-east-1",
      }),
    ).toEqual({
      protocol: "http",
      hostname: "developer-portal-assets.s3.localhost.localstack.cloud",
      port: "4566",
      pathname: "/unverified/**",
    });
  });

  it("keeps the AWS S3 host when no custom endpoint is configured", () => {
    expect(
      getAssetsS3RemotePattern({
        bucket: "production-assets",
        region: "us-east-1",
      }),
    ).toEqual({
      protocol: "https",
      hostname: "production-assets.s3.us-east-1.amazonaws.com",
      pathname: "/unverified/**",
    });
  });

  it("omits the S3 pattern when the bucket is not configured", () => {
    expect(
      getAssetsS3RemotePattern({
        endpoint: "http://s3.localhost.localstack.cloud:4566",
        region: "us-east-1",
      }),
    ).toBeUndefined();
  });
});
// #endregion
