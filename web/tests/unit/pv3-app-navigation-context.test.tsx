/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

// #region Mocks
const useParams = jest.fn();
jest.mock("next/navigation", () => ({
  useParams: () => useParams(),
}));
// #endregion

import {
  AppNavigationProvider,
  useNavigationAppContext,
} from "@/scenes/PortalV3/layout/Shell/NavigationContext";

// #region Test Data
const teamId = "team_1";
const appId = "app_1";

const NavigationState = () => {
  const navigation = useNavigationAppContext();

  return (
    <output>{`${navigation.teamId ?? "none"}/${navigation.appId ?? "none"}`}</output>
  );
};

const renderNavigation = () =>
  render(
    <AppNavigationProvider>
      <NavigationState />
    </AppNavigationProvider>,
  );
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
});

// #region remembered app navigation
describe("v3 AppNavigationProvider [remembered app navigation]", () => {
  it("keeps an app selected when navigating to team settings", () => {
    useParams.mockReturnValue({ teamId, appId });
    const view = renderNavigation();

    expect(screen.getByText(`${teamId}/${appId}`)).toBeInTheDocument();

    useParams.mockReturnValue({ teamId });
    view.rerender(
      <AppNavigationProvider>
        <NavigationState />
      </AppNavigationProvider>,
    );

    expect(screen.getByText(`${teamId}/${appId}`)).toBeInTheDocument();
  });

  it("keeps a direct team visit app-less", () => {
    useParams.mockReturnValue({ teamId });
    renderNavigation();

    expect(screen.getByText(`${teamId}/none`)).toBeInTheDocument();
  });

  it("does not reuse an app after switching teams", () => {
    useParams.mockReturnValue({ teamId, appId });
    const view = renderNavigation();

    useParams.mockReturnValue({ teamId: "team_2" });
    view.rerender(
      <AppNavigationProvider>
        <NavigationState />
      </AppNavigationProvider>,
    );

    expect(screen.getByText("team_2/none")).toBeInTheDocument();
  });
});
// #endregion
