import {
  APP_IMAGE_CACHE_CONTROL,
  createAppImageGetObjectCommand,
} from "@/api/helpers/app-image-storage";

describe("app image browser-cache policy", () => {
  it("overrides cache headers on signed draft (unverified) responses", () => {
    const command = createAppImageGetObjectCommand({
      bucket: "assets-bucket",
      key: "unverified/app_123/showcase_img_1.png",
    });

    expect(command.input).toEqual({
      Bucket: "assets-bucket",
      Key: "unverified/app_123/showcase_img_1.png",
      ResponseCacheControl: APP_IMAGE_CACHE_CONTROL,
    });
  });

  it("does not apply the draft no-store override to verified responses", () => {
    const command = createAppImageGetObjectCommand({
      bucket: "assets-bucket",
      key: "verified/app_123/logo_img_abc123.png",
    });

    expect(command.input).toEqual({
      Bucket: "assets-bucket",
      Key: "verified/app_123/logo_img_abc123.png",
    });
  });
});
