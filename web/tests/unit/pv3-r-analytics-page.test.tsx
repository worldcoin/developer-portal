/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

// #region Mocks
const isEnabledForApp = jest.fn();

jest.mock("@/api/helpers/selfie-check-analytics/eligibility", () => ({
  isSelfieCheckAnalyticsEnabledForApp: (...args: unknown[]) =>
    isEnabledForApp(...args),
}));

jest.mock("@/components/ErrorPage", () => ({
  ErrorPage: ({ statusCode }: { statusCode: number }) => (
    <div data-testid="error" data-status={statusCode} />
  ),
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

describe("/analytics [rollout gate]", () => {
  it("renders the metrics frame for an allowlisted app", async () => {
    isEnabledForApp.mockResolvedValue(true);

    render(await RoutePage(props));

    expect(screen.getByTestId("metrics-frame")).toHaveTextContent(appId);
    expect(isEnabledForApp).toHaveBeenCalledWith(appId);
  });

  it("renders a Forbidden screen for a member outside the rollout", async () => {
    isEnabledForApp.mockResolvedValue(false);

    render(await RoutePage(props));

    expect(screen.getByTestId("error")).toHaveAttribute("data-status", "403");
    expect(screen.queryByTestId("metrics-frame")).not.toBeInTheDocument();
  });
});
