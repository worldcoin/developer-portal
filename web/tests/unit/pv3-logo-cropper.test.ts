/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { ImageValidationError } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/hook/use-image";

const getImageUploadActionMock = jest.fn();
const getImageMock = jest.fn();
const uploadViaPresignedPostMock = jest.fn();
const validateImageAspectRatioMock = jest.fn();
const toastErrorMock = jest.fn();

jest.mock("react-toastify", () => ({
  toast: { error: (...args: unknown[]) => toastErrorMock(...args) },
}));

jest.mock("@/lib/utils", () => ({
  getCDNImageUrl: (_appId: string, path: string) => `https://cdn/${path}`,
}));

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/hook/use-image",
  () => {
    const actual = jest.requireActual(
      "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/hook/use-image",
    );
    return {
      ...actual,
      getImageUploadAction: (...args: unknown[]) =>
        getImageUploadActionMock(...args),
      useImage: () => ({
        getImage: getImageMock,
        uploadViaPresignedPost: uploadViaPresignedPostMock,
        validateImageAspectRatio: validateImageAspectRatioMock,
      }),
    };
  },
);

jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppTopBar/LogoImageUpload/graphql/client/update-logo.generated",
  () => ({
    useUpdateLogoMutation: () => [jest.fn(), { loading: false }],
  }),
);

import { LogoImageUpload } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/AppTopBar/LogoImageUpload";

const renderUploader = () =>
  render(
    React.createElement(LogoImageUpload, {
      appId: "app_9cdd0a714aec9ed17dca660bc9ffe72a",
      appMetadataId: "metadata_1",
      teamId: "team_1",
      editable: true,
      isError: false,
      open: true,
      dialogOnly: true,
    }),
  );

const selectFile = (file: File) =>
  fireEvent.change(document.querySelector('input[type="file"]')!, {
    target: { files: [file] },
  });

describe("logo upload crop flow", () => {
  beforeAll(() => {
    Object.defineProperty(Element.prototype, "getAnimations", {
      configurable: true,
      value: () => [],
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    getImageUploadActionMock.mockResolvedValue("crop");
    getImageMock.mockResolvedValue("https://cdn/logo_img.png");
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: jest.fn(() => "blob:logo-preview"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: jest.fn(),
    });
  });

  it("opens the square crop step for a non-square logo", async () => {
    renderUploader();

    const uploadButton = await screen.findByRole("button", { name: "Upload" });
    selectFile(new File(["not-square"], "logo.png", { type: "image/png" }));

    const preview = await screen.findByAltText("Logo crop preview");
    for (const [property, value] of [
      ["width", 520],
      ["height", 260],
      ["naturalWidth", 800],
      ["naturalHeight", 400],
    ] as const) {
      Object.defineProperty(preview, property, { configurable: true, value });
    }
    fireEvent.load(preview);

    expect(
      await screen.findByRole("group", {
        name: "Use the arrow keys to move the crop selection area",
      }),
    ).toBeInTheDocument();
    expect(uploadButton).not.toBeInTheDocument();
    expect(screen.queryByRole("slider", { name: "Crop zoom" })).toBeNull();
    expect(screen.getByRole("button", { name: "Crop & upload" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Close image editor" }));
    expect(screen.queryByRole("button", { name: "Upload" })).toBeNull();
    await waitFor(() =>
      expect(
        screen.queryByAltText("Logo crop preview"),
      ).not.toBeInTheDocument(),
    );
  });

  it("uploads a square logo under 500 kB without opening the cropper", async () => {
    getImageUploadActionMock.mockResolvedValue("upload");
    renderUploader();
    await screen.findByRole("button", { name: "Upload" });

    const file = new File(["square"], "logo.png", { type: "image/png" });
    selectFile(file);

    await waitFor(() =>
      expect(uploadViaPresignedPostMock).toHaveBeenCalledWith(
        file,
        "app_9cdd0a714aec9ed17dca660bc9ffe72a",
        "team_1",
        "logo_img",
      ),
    );
    expect(screen.queryByAltText("Logo crop preview")).not.toBeInTheDocument();
  });

  it("rejects a square logo at the 500 kB upload limit", async () => {
    getImageUploadActionMock.mockRejectedValue(
      new ImageValidationError("Image size must be under 500kB"),
    );
    renderUploader();
    await screen.findByRole("button", { name: "Upload" });

    selectFile(
      new File([new Uint8Array(500 * 1024)], "logo.png", {
        type: "image/png",
      }),
    );

    await waitFor(() =>
      expect(toastErrorMock).toHaveBeenCalledWith(
        "Image size must be under 500kB",
      ),
    );
    expect(uploadViaPresignedPostMock).not.toHaveBeenCalled();
    expect(screen.queryByAltText("Logo crop preview")).not.toBeInTheDocument();
  });
});
