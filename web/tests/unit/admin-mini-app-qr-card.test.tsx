/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

// #region Mocks
jest.mock("react-qr-code", () => ({
  __esModule: true,
  default: ({ value }: { value: string }) => (
    <div data-testid="qr-code" data-value={value} />
  ),
}));
// #endregion

import { AdminMiniAppQrCard } from "@/scenes/Admin/apps/id/AdminMiniAppQrCard";

// #region Test Data
const productionAppId = "app_ade2890c297e34c54df1eb545e021ca8";
const stagingAppId = "app_staging_009b8ac653b16b13ff632e762c57b2b3";
const productionMiniAppUrl = `https://world.org/mini-app?app_id=${productionAppId}&path=`;
// #endregion

// #region Production Mini App QR
describe("AdminMiniAppQrCard [production app]", () => {
  it("renders a ready-to-scan QR and copy action", () => {
    render(<AdminMiniAppQrCard appId={productionAppId} />);

    expect(
      screen.getByRole("heading", { name: "Test in World App" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("qr-code")).toHaveAttribute(
      "data-value",
      productionMiniAppUrl,
    );
    expect(
      screen.getByRole("button", { name: "Copy Mini App link" }),
    ).toBeInTheDocument();
  });
});
// #endregion

// #region Hidden QR guards
describe("AdminMiniAppQrCard [hidden QR guards]", () => {
  it("does not render for a staging app", () => {
    render(<AdminMiniAppQrCard appId={stagingAppId} />);

    expect(screen.queryByText("Test in World App")).not.toBeInTheDocument();
    expect(screen.queryByTestId("qr-code")).not.toBeInTheDocument();
  });

  it("does not render without an app ID", () => {
    render(<AdminMiniAppQrCard appId="" />);

    expect(screen.queryByText("Test in World App")).not.toBeInTheDocument();
    expect(screen.queryByTestId("qr-code")).not.toBeInTheDocument();
  });
});
// #endregion
