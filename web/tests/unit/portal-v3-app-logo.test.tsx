/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

// #region Mocks
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} />
  ),
}));

jest.mock("@/lib/utils", () => ({
  getCDNImageUrl: (appId: string, src: string) =>
    `https://cdn.example.com/${appId}/${src}`,
}));
// #endregion

import { AppLogo } from "@/scenes/PortalV3/Teams/TeamId/Team/page/Apps/App/AppLogo";

// #region Verified logo loading
describe("AppLogo [verified logo loading]", () => {
  it("overlays the skeleton only until the logo loads", () => {
    const { container } = render(
      <AppLogo
        appId="app_1234567890abcdef1234567890abcdef"
        name="Example app"
        src="logo.png"
        verification_status="verified"
      />,
    );

    const image = screen.getByRole("img", { name: "app logo" });
    const skeleton = container.querySelector(".react-loading-skeleton");

    expect(image).toHaveClass("opacity-0");
    expect(skeleton?.parentElement).toHaveClass("absolute", "inset-0");

    fireEvent.load(image);

    expect(image).not.toHaveClass("opacity-0");
    expect(
      container.querySelector(".react-loading-skeleton"),
    ).not.toBeInTheDocument();
  });
});
// #endregion
