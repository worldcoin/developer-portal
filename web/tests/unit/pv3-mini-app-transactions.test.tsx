/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

// #region Mocks
const getIsUserAllowedToReadApp = jest.fn();
const signedFetch = jest.fn();

jest.mock("@/lib/permissions", () => ({
  getIsUserAllowedToReadApp: (...args: unknown[]) =>
    getIsUserAllowedToReadApp(...args),
}));

jest.mock("@/api/helpers/signed-fetch", () => ({
  getTransactionSignedFetch: () => signedFetch,
}));

jest.mock("@/lib/server-utils", () => ({
  ...jest.requireActual("@/lib/server-utils"),
  getPathFromHeaders: jest
    .fn()
    .mockResolvedValue("/teams/team_1234567890abcdef/apps/test"),
}));

// The table pulls in `ox` through lib/utils, which needs browser globals jsdom
// doesn't provide. None of these branches render rows.
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MiniApp/Transactions/page/TransactionsTable",
  () => ({
    TransactionsTable: () => <div />,
  }),
);

// #endregion

// #region Test Data
const appId = "app_1234567890abcdef1234567890abcdef";

const renderPage = async () => {
  const { TransactionsPage } = await import(
    "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MiniApp/Transactions/page"
  );
  render(await TransactionsPage({ params: { appId } }));
};
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  process.env.NEXT_SERVER_INTERNAL_PAYMENTS_ENDPOINT =
    "https://payments.example.com";
  getIsUserAllowedToReadApp.mockResolvedValue(true);
  signedFetch.mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue({ result: { transactions: [] } }),
  });
});

// #region Access and mode-independent history
describe("PortalV3 mini app transactions", () => {
  it("authorizes before fetching transaction history", async () => {
    getIsUserAllowedToReadApp.mockResolvedValue(false);

    await renderPage();

    expect(getIsUserAllowedToReadApp).toHaveBeenCalledWith(appId);
    expect(signedFetch).not.toHaveBeenCalled();
    expect(screen.getByText("Failed to load transactions")).toBeInTheDocument();
  });

  it("loads transaction history without an app-mode lookup", async () => {
    await renderPage();

    expect(getIsUserAllowedToReadApp).toHaveBeenCalledTimes(1);
    expect(screen.getByText("No transactions yet")).toBeInTheDocument();
    expect(signedFetch).toHaveBeenCalledTimes(1);
  });
});
// #endregion
