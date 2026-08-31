/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

// #region Mocks
const getIsUserAllowedToReadApp = jest.fn();
const isSelfieCheckAnalyticsEnabledForApp = jest.fn();
const loggerWarn = jest.fn();
jest.mock("@/lib/permissions", () => ({
  getIsUserAllowedToReadApp: (...args: unknown[]) =>
    getIsUserAllowedToReadApp(...args),
}));

jest.mock("@/api/helpers/selfie-check-analytics/eligibility", () => ({
  isSelfieCheckAnalyticsEnabledForApp: (...args: unknown[]) =>
    isSelfieCheckAnalyticsEnabledForApp(...args),
}));

jest.mock("@/lib/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: (...args: unknown[]) => loggerWarn(...args),
  },
}));

jest.mock("@/scenes/PortalV3/layout/Shell/SidebarNav", () => ({
  AnalyticsEligibleApp: ({ appId }: { appId: string }) => (
    <div data-testid="analytics-eligible">{appId}</div>
  ),
}));

jest.mock("@/components/ErrorPage", () => ({
  ErrorPage: ({ statusCode }: { statusCode: number }) => (
    <div data-testid="error" data-status={statusCode} />
  ),
}));
// #endregion

import { AppIdLayout } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/layout";

const appId = "app_9cdd0a714aec9ed17dca660bc9ffe72a";
const renderLayout = async (value?: string) =>
  render(
    await AppIdLayout({
      params: { teamId: "team_1", appId: value },
      children: <div data-testid="page" />,
    }),
  );

beforeEach(() => {
  jest.clearAllMocks();
  getIsUserAllowedToReadApp.mockResolvedValue(true);
  isSelfieCheckAnalyticsEnabledForApp.mockResolvedValue(false);
});

it("renders the app without a sidebar signal when analytics is disabled", async () => {
  await renderLayout(appId);

  expect(isSelfieCheckAnalyticsEnabledForApp).toHaveBeenCalledWith(appId);
  expect(screen.getByTestId("page")).toBeInTheDocument();
  expect(screen.queryByTestId("analytics-eligible")).not.toBeInTheDocument();
});

it("signals the sidebar when analytics is enabled for the app", async () => {
  isSelfieCheckAnalyticsEnabledForApp.mockResolvedValue(true);

  await renderLayout(appId);

  expect(screen.getByTestId("analytics-eligible")).toHaveTextContent(appId);
});

it("keeps the app available and hides analytics when eligibility fails", async () => {
  const error = new Error("SSM unavailable");
  isSelfieCheckAnalyticsEnabledForApp.mockRejectedValue(error);

  await renderLayout(appId);

  expect(screen.getByTestId("page")).toBeInTheDocument();
  expect(screen.queryByTestId("analytics-eligible")).not.toBeInTheDocument();
  expect(loggerWarn).toHaveBeenCalledWith(
    "Failed to resolve analytics eligibility for the sidebar",
    expect.objectContaining({
      appId,
      dependency: "selfie-check-analytics-eligibility",
      failureClass: "Error",
      error,
    }),
  );
});

it("returns 404 when the user cannot read the app", async () => {
  getIsUserAllowedToReadApp.mockResolvedValue(false);
  await renderLayout(appId);

  expect(isSelfieCheckAnalyticsEnabledForApp).not.toHaveBeenCalled();
  expect(screen.getByTestId("error")).toHaveAttribute("data-status", "404");
});

it("returns 404 without querying when appId is missing", async () => {
  await renderLayout();
  expect(getIsUserAllowedToReadApp).not.toHaveBeenCalled();
  expect(screen.getByTestId("error")).toHaveAttribute("data-status", "404");
});
