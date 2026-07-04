/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

// #region Mocks
const getIsUserAllowedToReadApp = jest.fn();
jest.mock("@/lib/permissions", () => ({
  getIsUserAllowedToReadApp: (...args: unknown[]) =>
    getIsUserAllowedToReadApp(...args),
}));

jest.mock("@/components/ErrorPage", () => ({
  ErrorPage: ({ statusCode }: { statusCode: number }) => (
    <div data-testid="error" data-status={statusCode} />
  ),
}));

// The World ID sub-tabs are a server component fetched behind <Suspense>; stub
// it so the layout test stays focused on the auth/existence guard and the slot
// wiring. Its own behavior lives in pv3-appid-worldid-subtabs.test.tsx.
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/layout/AppWorldIdSubTabs",
  () => ({
    AppWorldIdSubTabs: () => <div data-testid="world-id-tabs" />,
  }),
);

// Assert what the layout hands the chrome: the page children and a worldIdTabs
// slot (never the removed hasRpRegistration/hasLegacyActions flags).
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/layout/AppIdChrome",
  () => ({
    AppIdChrome: ({
      worldIdTabs,
      children,
    }: {
      worldIdTabs: React.ReactNode;
      children: React.ReactNode;
    }) => (
      <div
        data-testid="chrome"
        data-has-worldid-tabs={worldIdTabs ? "true" : "false"}
      >
        {children}
      </div>
    ),
  }),
);

import { AppIdLayout } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/layout";
// #endregion

// #region Test Data
const teamId = "team_1";
const appId = "app_9cdd0a714aec9ed17dca660bc9ffe72a";

const renderLayout = async (params: { teamId?: string; appId?: string }) =>
  render(await AppIdLayout({ params, children: <div data-testid="page" /> }));

const status = () => screen.getByTestId("error").getAttribute("data-status");
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  getIsUserAllowedToReadApp.mockResolvedValue(true);
});

// #region auth / existence guard
describe("v3 AppIdLayout [guard]", () => {
  it("returns 404 when the user is not allowed to read the app", async () => {
    getIsUserAllowedToReadApp.mockResolvedValue(false);
    await renderLayout({ teamId, appId });
    expect(status()).toBe("404");
    expect(screen.queryByTestId("chrome")).not.toBeInTheDocument();
  });

  it("returns 404 when appId is missing, short-circuiting the DB check", async () => {
    await renderLayout({ teamId });
    expect(status()).toBe("404");
    expect(getIsUserAllowedToReadApp).not.toHaveBeenCalled();
  });
});
// #endregion

// #region success → chrome + world-id tabs slot
describe("v3 AppIdLayout [renders chrome]", () => {
  it("renders the chrome with the page children when authorized", async () => {
    await renderLayout({ teamId, appId });
    expect(screen.getByTestId("chrome")).toBeInTheDocument();
    expect(screen.getByTestId("page")).toBeInTheDocument();
  });

  it("passes a World ID sub-tabs slot to the chrome (does not fetch app-env itself)", async () => {
    await renderLayout({ teamId, appId });
    expect(
      screen.getByTestId("chrome").getAttribute("data-has-worldid-tabs"),
    ).toBe("true");
  });
});
// #endregion
