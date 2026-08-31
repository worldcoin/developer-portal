/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

// #region Mocks
const isEnabledForApp = jest.fn();

jest.mock("@/api/helpers/selfie-check-analytics/eligibility", () => ({
  checkEligibility: (...args: unknown[]) => isEnabledForApp(...args),
}));

jest.mock("@/components/ErrorPage", () => ({
  ErrorPage: ({ statusCode }: { statusCode: number }) => (
    <div data-testid="error" data-status={statusCode} />
  ),
}));

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock("@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MetricsFrame", () => ({
  MetricsFrame: (props: { appId: string }) => (
    <div data-testid="metrics-frame">{props.appId}</div>
  ),
}));
// #endregion

import RoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/analytics/page";

// #region Test Data
const teamId = "team_0123456789abcdef0123456789abcdef";
const appId = "app_0123456789abcdef0123456789abcdef";
const props = {
  params: Promise.resolve({ teamId, appId }),
};
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
});

describe("/analytics [Redis eligibility gate]", () => {
  it("renders the metrics frame for an app present in Redis", async () => {
    isEnabledForApp.mockResolvedValue(true);

    render(await RoutePage(props));

    expect(screen.getByTestId("metrics-frame")).toHaveTextContent(appId);
    expect(isEnabledForApp).toHaveBeenCalledWith(appId);
  });

  it("renders a Forbidden screen for an app absent from Redis", async () => {
    isEnabledForApp.mockResolvedValue(false);

    render(await RoutePage(props));

    expect(screen.getByTestId("error")).toHaveAttribute("data-status", "404");
    expect(screen.queryByTestId("metrics-frame")).not.toBeInTheDocument();
  });

  it("renders an unavailable screen when Redis eligibility fails", async () => {
    isEnabledForApp.mockRejectedValue(new Error("Redis timeout"));

    render(await RoutePage(props));

    expect(screen.getByTestId("error")).toHaveAttribute("data-status", "503");
    expect(screen.queryByTestId("metrics-frame")).not.toBeInTheDocument();
  });
});
