/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

const readImageDimensionsMock = jest.fn();

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
      readImageDimensions: (...args: unknown[]) =>
        readImageDimensionsMock(...args),
      useImage: () => ({
        getImage: jest.fn(),
        uploadViaPresignedPost: jest.fn(),
        validateImageAspectRatio: jest.fn(),
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

describe("logo upload crop flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    readImageDimensionsMock.mockResolvedValue({ width: 800, height: 400 });
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

    const uploadButton = await screen.findByRole("button", { name: "Upload" });
    fireEvent.change(document.querySelector('input[type="file"]')!, {
      target: {
        files: [new File(["not-square"], "logo.png", { type: "image/png" })],
      },
    });

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

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByAltText("Logo crop preview")).not.toBeInTheDocument();
  });
});
