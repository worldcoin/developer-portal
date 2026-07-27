import {
  APP_IMAGE_CACHE_CONTROL,
  createAppImageGetObjectCommand,
} from "@/api/helpers/app-image-storage";

describe("app image browser-cache policy", () => {
  it("overrides cache headers on every signed preview response", () => {
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
});
