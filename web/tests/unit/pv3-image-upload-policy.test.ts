/** @jest-environment jsdom */

jest.mock("@/lib/utils", () => ({ tryParseJSON: jest.fn() }));

import {
  getImageUploadAction,
  ImageValidationError,
  MAX_IMAGE_BYTES,
} from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/hook/use-image";

describe("configuration image upload policy", () => {
  let dimensions = { width: 1080, height: 1080 };
  let imageConstructions = 0;

  beforeEach(() => {
    dimensions = { width: 1080, height: 1080 };
    imageConstructions = 0;
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: jest.fn(() => "blob:image-preview"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: jest.fn(),
    });
    Object.defineProperty(window, "Image", {
      configurable: true,
      value: class {
        naturalWidth = dimensions.width;
        naturalHeight = dimensions.height;
        onload?: () => void;

        constructor() {
          imageConstructions += 1;
        }

        set src(_value: string) {
          queueMicrotask(() => this.onload?.());
        }
      },
    });
  });

  it("uses the direct-upload path when the aspect ratio already matches", async () => {
    dimensions = { width: 800, height: 800 };

    await expect(
      getImageUploadAction(
        new File(["square"], "showcase.png", { type: "image/png" }),
        1080,
        1080,
      ),
    ).resolves.toBe("upload");
  });

  it("uses the crop path when the aspect ratio does not match", async () => {
    dimensions = { width: 1200, height: 800 };

    await expect(
      getImageUploadAction(
        new File(["landscape"], "showcase.png", { type: "image/png" }),
        1080,
        1080,
      ),
    ).resolves.toBe("crop");
  });

  it("rejects the file-size limit before decoding the image", async () => {
    await expect(
      getImageUploadAction(
        new File([new Uint8Array(MAX_IMAGE_BYTES)], "large.png", {
          type: "image/png",
        }),
        345,
        240,
      ),
    ).rejects.toEqual(
      new ImageValidationError("Image size must be under 500kB"),
    );
    expect(imageConstructions).toBe(0);
  });
});
