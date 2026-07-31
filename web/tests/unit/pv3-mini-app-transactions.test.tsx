/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

// #region Mocks
const getIsUserAllowedToReadApp = jest.fn();
const GetAppMode = jest.fn();
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

jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/MiniApp/Transactions/page/graphql/server/get-app-mode.generated",
  () => ({
    getSdk: () => ({ GetAppMode }),
  }),
);

jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({}),
}));

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

// #region Test Data
const appId = "app_1234567890abcdef1234567890abcdef";

const appModeResponse = ({
  draft,
  verified,
}: {
  draft?: "mini-app" | "external";
  verified?: "mini-app" | "external";
}) => ({
  app: [
    {
      id: appId,
      app_metadata: draft ? [{ id: "meta_draft", app_mode: draft }] : [],
      verified_app_metadata: verified
        ? [{ id: "meta_verified", app_mode: verified }]
        : [],
    },
  ],
});

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
  GetAppMode.mockResolvedValue(appModeResponse({ draft: "mini-app" }));
  signedFetch.mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue({ result: { transactions: [] } }),
  });
});

// #region External app gate
describe("PortalV3 mini app transactions [external apps]", () => {
  it("does not read app mode before authorization", async () => {
    getIsUserAllowedToReadApp.mockResolvedValue(false);

    await renderPage();

    expect(getIsUserAllowedToReadApp).toHaveBeenCalledWith(appId);
    expect(GetAppMode).not.toHaveBeenCalled();
    expect(signedFetch).not.toHaveBeenCalled();
    expect(screen.getByText("Failed to load transactions")).toBeInTheDocument();
  });

  it("shows the unavailable notice and skips the payments fetch", async () => {
    GetAppMode.mockResolvedValue(appModeResponse({ draft: "external" }));

    await renderPage();

    expect(getIsUserAllowedToReadApp).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Transactions unavailable")).toBeInTheDocument();
    expect(signedFetch).not.toHaveBeenCalled();
  });

  it("prefers verified metadata over the autosaved draft", async () => {
    GetAppMode.mockResolvedValue(
      appModeResponse({ draft: "mini-app", verified: "external" }),
    );

    await renderPage();

    expect(screen.getByText("Transactions unavailable")).toBeInTheDocument();
    expect(signedFetch).not.toHaveBeenCalled();
  });

  it("loads transactions for mini apps after one authorization lookup", async () => {
    await renderPage();

    expect(getIsUserAllowedToReadApp).toHaveBeenCalledTimes(1);
    expect(screen.getByText("No transactions yet")).toBeInTheDocument();
    expect(signedFetch).toHaveBeenCalledTimes(1);
  });

  it("loads transactions when the app mode lookup fails", async () => {
    GetAppMode.mockRejectedValue(new Error("hasura down"));

    await renderPage();

    expect(signedFetch).toHaveBeenCalledTimes(1);
    expect(screen.getByText("No transactions yet")).toBeInTheDocument();
  });
});
// #endregion
