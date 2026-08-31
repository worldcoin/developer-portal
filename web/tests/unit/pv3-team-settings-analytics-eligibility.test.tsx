/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

// #region Mocks
const getIsUserAllowedToReadApp = jest.fn();
const getAnalyticsSidebarEligibility = jest.fn();
const loggerWarn = jest.fn();

jest.mock("@/lib/permissions", () => ({
  getIsUserAllowedToReadApp: (...args: unknown[]) =>
    getIsUserAllowedToReadApp(...args),
}));

jest.mock("@/lib/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: (...args: unknown[]) => loggerWarn(...args),
  },
}));

jest.mock(
  "@/scenes/PortalV3/layout/server/get-analytics-sidebar-eligibility",
  () => ({
    getAnalyticsSidebarEligibility: (...args: unknown[]) =>
      getAnalyticsSidebarEligibility(...args),
  }),
);

jest.mock("@/scenes/PortalV3/layout/Shell/SidebarNav", () => ({
  AnalyticsAppEligibility: (props: { appId: string; enabled: boolean }) => (
    <div
      data-testid="analytics-eligibility"
      data-app-id={props.appId}
      data-enabled={props.enabled}
    />
  ),
}));

jest.mock("@/scenes/PortalV3/Teams/TeamId/Team/Settings/page", () => ({
  TeamSettingsPage: ({ requestedTab }: { requestedTab?: string }) => (
    <div data-testid="team-settings" data-tab={requestedTab} />
  ),
}));
// #endregion

import RoutePage from "../../app/(portal)/teams/[teamId]/(team)/settings/page";

// #region Test Data
const teamId = "team_1";
const appId = "app_9cdd0a714aec9ed17dca660bc9ffe72a";
const renderPage = async (returnTo?: string) =>
  render(
    await RoutePage({
      params: Promise.resolve({ teamId }),
      searchParams: Promise.resolve({
        tab: "members",
        return_to: returnTo,
      }),
    }),
  );
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  getIsUserAllowedToReadApp.mockResolvedValue(true);
  getAnalyticsSidebarEligibility.mockResolvedValue(true);
});

// #region Analytics return_to eligibility
it("signals analytics on a direct team-settings load for an eligible readable app", async () => {
  await renderPage(`/teams/${teamId}/apps/${appId}/configuration`);

  expect(getIsUserAllowedToReadApp).toHaveBeenCalledWith(appId);
  expect(getAnalyticsSidebarEligibility).toHaveBeenCalledWith(appId);
  expect(screen.getByTestId("analytics-eligibility")).toHaveAttribute(
    "data-enabled",
    "true",
  );
  expect(screen.getByTestId("team-settings")).toHaveAttribute(
    "data-tab",
    "members",
  );
});

it("does not trust a return_to app from another team", async () => {
  await renderPage(`/teams/team_2/apps/${appId}/configuration`);

  expect(getIsUserAllowedToReadApp).not.toHaveBeenCalled();
  expect(getAnalyticsSidebarEligibility).not.toHaveBeenCalled();
  expect(screen.queryByTestId("analytics-eligibility")).not.toBeInTheDocument();
});

it("does not check eligibility when the user cannot read the return_to app", async () => {
  getIsUserAllowedToReadApp.mockResolvedValue(false);

  await renderPage(`/teams/${teamId}/apps/${appId}/configuration`);

  expect(getAnalyticsSidebarEligibility).not.toHaveBeenCalled();
  expect(screen.getByTestId("analytics-eligibility")).toHaveAttribute(
    "data-enabled",
    "false",
  );
});

it("keeps team settings available when return_to app validation fails", async () => {
  const error = new Error("Hasura unavailable");
  getIsUserAllowedToReadApp.mockRejectedValue(error);

  await renderPage(`/teams/${teamId}/apps/${appId}/configuration`);

  expect(screen.getByTestId("team-settings")).toBeInTheDocument();
  expect(screen.getByTestId("analytics-eligibility")).toHaveAttribute(
    "data-enabled",
    "false",
  );
  expect(loggerWarn).toHaveBeenCalledWith(
    "Failed to validate analytics sidebar app from team settings",
    expect.objectContaining({
      appId,
      dependency: "hasura",
      failureClass: "Error",
      error,
    }),
  );
});
// #endregion
