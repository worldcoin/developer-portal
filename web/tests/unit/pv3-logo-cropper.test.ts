/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

const getImageMock = jest.fn();
const uploadViaPresignedPostMock = jest.fn();
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
      useImage: () => ({
        getImage: getImageMock,
        uploadViaPresignedPost: uploadViaPresignedPostMock,
      }),
    };
  },
);

jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppTopBar/LogoImageUpload/graphql/client/update-logo.generated",
  () => ({
    UpdateLogoDocument: { __mockDoc: "updateLogo" },
  }),
);

// Apollo Client 4: the react hooks live in "@apollo/client/react". The rendered
// tree only calls useMutation (LogoImageUpload's update-logo mutation); the
// other hooks are stubbed defensively so any nested Apollo call is inert.
jest.mock("@apollo/client/react", () => ({
  useQuery: () => ({
    data: undefined,
    loading: false,
    error: undefined,
    refetch: jest.fn(),
  }),
  useLazyQuery: () => [
    jest.fn(),
    { data: undefined, loading: false, called: false },
  ],
  useMutation: () => [
    jest.fn().mockResolvedValue({ data: {} }),
    { loading: false },
  ],
  useApolloClient: () => ({
    cache: { modify: jest.fn(), identify: jest.fn() },
    readQuery: () => null,
    writeQuery: jest.fn(),
  }),
  skipToken: Symbol.for("apollo.skipToken"),
}));

import { LogoImageUpload } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/AppTopBar/LogoImageUpload";

const renderUploader = () =>
  render(
    React.createElement(LogoImageUpload, {
      appId: "app_9cdd0a714aec9ed17dca660bc9ffe72a",
      appMetadataId: "metadata_1",
      teamId: "team_1",
      open: true,
      onClose: jest.fn(),
    }),
  );

const selectFile = (file: File) =>
  fireEvent.change(document.querySelector('input[type="file"]')!, {
    target: { files: [file] },
  });

// Selection-time validation runs for real; the image decode (the I/O) is
// faked by stubbing window.Image with controllable dimensions.
let decodedDimensions = { width: 800, height: 400 };

describe("logo upload crop flow", () => {
  beforeAll(() => {
    Object.defineProperty(Element.prototype, "getAnimations", {
      configurable: true,
      value: () => [],
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    decodedDimensions = { width: 800, height: 400 };
    getImageMock.mockResolvedValue("https://cdn/logo_img.png");
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: jest.fn(() => "blob:logo-preview"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: jest.fn(),
    });
    Object.defineProperty(window, "Image", {
      configurable: true,
      value: class {
        onload?: () => void;

        get naturalWidth() {
          return decodedDimensions.width;
        }

        get naturalHeight() {
          return decodedDimensions.height;
        }

        set src(_value: string) {
          queueMicrotask(() => this.onload?.());
        }
      },
    });
  });

  it("goes straight from file selection to the crop step for a non-square logo", async () => {
    renderUploader();

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
    expect(screen.queryByRole("slider", { name: "Crop zoom" })).toBeNull();
    expect(screen.getByRole("button", { name: "Crop & upload" })).toBeEnabled();

    fireEvent.click(
      screen.getByRole("button", { name: "Close image cropper" }),
    );
    await waitFor(() =>
      expect(
        screen.queryByAltText("Logo crop preview"),
      ).not.toBeInTheDocument(),
    );
    expect(uploadViaPresignedPostMock).not.toHaveBeenCalled();
  });

  it("uploads a square logo under 500 kB without opening the cropper", async () => {
    decodedDimensions = { width: 512, height: 512 };
    renderUploader();

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
    renderUploader();

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
