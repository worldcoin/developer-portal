/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

// #region Mocks
const isEnabledForApp = jest.fn();
const notFoundMock = jest.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

jest.mock("@/api/helpers/selfie-check-analytics/eligibility", () => ({
  isSelfieCheckAnalyticsEnabledForApp: (...args: unknown[]) =>
    isEnabledForApp(...args),
}));

jest.mock("next/navigation", () => ({
  notFound: () => notFoundMock(),
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

  it("returns the Next.js not-found boundary for a disabled app", async () => {
    isEnabledForApp.mockResolvedValue(false);

    await expect(RoutePage(props)).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
