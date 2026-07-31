/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

// #region Mocks
const getTransactionData = jest.fn();
const GetAppMode = jest.fn();

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MiniApp/Transactions/page/server",
  () => ({
    getTransactionData: (...args: unknown[]) => getTransactionData(...args),
  }),
);

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
  getTransactionData.mockResolvedValue({ success: true, data: [] });
});

// #region External app gate
describe("PortalV3 mini app transactions [external apps]", () => {
  it("shows the unavailable notice and skips the payments fetch", async () => {
    GetAppMode.mockResolvedValue(appModeResponse({ draft: "external" }));

    await renderPage();

    expect(screen.getByText("Transactions unavailable")).toBeInTheDocument();
    expect(getTransactionData).not.toHaveBeenCalled();
  });

  it("prefers verified metadata over the autosaved draft", async () => {
    GetAppMode.mockResolvedValue(
      appModeResponse({ draft: "mini-app", verified: "external" }),
    );

    await renderPage();

    expect(screen.getByText("Transactions unavailable")).toBeInTheDocument();
    expect(getTransactionData).not.toHaveBeenCalled();
  });

  it("loads transactions for mini apps", async () => {
    GetAppMode.mockResolvedValue(appModeResponse({ draft: "mini-app" }));

    await renderPage();

    expect(screen.getByText("No transactions yet")).toBeInTheDocument();
    expect(getTransactionData).toHaveBeenCalledWith(appId);
  });

  it("loads transactions when the app mode lookup fails", async () => {
    GetAppMode.mockRejectedValue(new Error("hasura down"));

    await renderPage();

    expect(getTransactionData).toHaveBeenCalledWith(appId);
  });
});
// #endregion
