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
  MetricsFrame: (props: { appId: string; mock?: boolean }) => (
    <div data-testid="metrics-frame" data-mock={props.mock}>
      {props.appId}
    </div>
  ),
}));
// #endregion

import RoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/analytics/page";

// #region Test Data
const teamId = "team_0123456789abcdef0123456789abcdef";
const appId = "app_0123456789abcdef0123456789abcdef";
const props = (mock?: string) => ({
  params: Promise.resolve({ teamId, appId }),
  searchParams: Promise.resolve({ mock }),
});
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
});

describe("/analytics [rollout gate]", () => {
  it("renders the metrics frame for an allowlisted app", async () => {
    isEnabledForApp.mockResolvedValue(true);

    render(await RoutePage(props()));

    expect(screen.getByTestId("metrics-frame")).toHaveTextContent(appId);
    expect(isEnabledForApp).toHaveBeenCalledWith(appId);
  });

  it("renders a Forbidden screen for a member outside the rollout", async () => {
    isEnabledForApp.mockResolvedValue(false);

    render(await RoutePage(props()));

    expect(screen.getByTestId("error")).toHaveAttribute("data-status", "403");
    expect(screen.queryByTestId("metrics-frame")).not.toBeInTheDocument();
  });

  it("uses mock data locally without consulting the rollout dependency", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, "NODE_ENV", {
      configurable: true,
      value: "development",
    });

    try {
      render(await RoutePage(props("1")));

      expect(screen.getByTestId("metrics-frame")).toHaveAttribute(
        "data-mock",
        "true",
      );
      expect(isEnabledForApp).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(process.env, "NODE_ENV", {
        configurable: true,
        value: originalNodeEnv,
      });
    }
  });

  it("does not honor the mock parameter outside development", async () => {
    isEnabledForApp.mockResolvedValue(false);

    render(await RoutePage(props("1")));

    expect(isEnabledForApp).toHaveBeenCalledWith(appId);
    expect(screen.getByTestId("error")).toHaveAttribute("data-status", "403");
    expect(screen.queryByTestId("metrics-frame")).not.toBeInTheDocument();
  });
});
