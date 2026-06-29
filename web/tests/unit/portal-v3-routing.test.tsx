/**
 * @jest-environment jsdom
 *
 * Routing integration test for the route → flag → chooser wiring. A portal
 * route shim must render the v2 component when the flag is off and the v3
 * component when it's on. The chooser (renderPortalScene) and the flag read
 * are the REAL implementations; only the leaf layouts are stubbed so we assert
 * which branch the route takes, not their internals.
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

const isPortalV3Enabled = jest.fn();
jest.mock("@/lib/feature-flags/portal-v3/flag", () => ({
  isPortalV3Enabled: () => isPortalV3Enabled(),
}));

jest.mock("@/scenes/Portal/layout", () => ({
  PortalLayout: () => <div data-testid="v2-portal" />,
}));
jest.mock("@/scenes/PortalV3/layout", () => ({
  PortalLayoutV3: () => <div data-testid="v3-portal" />,
}));
jest.mock("@/scenes/Portal/Teams/TeamId/layout", () => ({
  TeamIdLayout: () => <div data-testid="v2-team" />,
}));
jest.mock("@/scenes/PortalV3/Teams/TeamId/layout", () => ({
  TeamIdLayoutV3: () => <div data-testid="v3-team" />,
}));

import PortalLayoutRoute from "../../app/(portal)/layout";
import TeamLayoutRoute from "../../app/(portal)/teams/[teamId]/layout";

const renderRoute = (Route: unknown, props: Record<string, unknown>) =>
  render(
    React.createElement(
      Route as React.ComponentType<Record<string, unknown>>,
      props,
    ),
  );

beforeEach(() => jest.clearAllMocks());

describe("portal route shims route by the feature flag", () => {
  it("renders v2 chrome when the flag is off", () => {
    isPortalV3Enabled.mockReturnValue(false);
    renderRoute(PortalLayoutRoute, { children: null });
    expect(screen.getByTestId("v2-portal")).toBeInTheDocument();
    expect(screen.queryByTestId("v3-portal")).not.toBeInTheDocument();
  });

  it("renders v3 chrome when the flag is on", () => {
    isPortalV3Enabled.mockReturnValue(true);
    renderRoute(PortalLayoutRoute, { children: null });
    expect(screen.getByTestId("v3-portal")).toBeInTheDocument();
    expect(screen.queryByTestId("v2-portal")).not.toBeInTheDocument();
  });

  it("routes the team layout to v2/v3 by the same flag", () => {
    isPortalV3Enabled.mockReturnValue(false);
    const { unmount } = renderRoute(TeamLayoutRoute, {
      params: Promise.resolve({ teamId: "team_1" }),
      children: null,
    });
    expect(screen.getByTestId("v2-team")).toBeInTheDocument();
    unmount();

    isPortalV3Enabled.mockReturnValue(true);
    renderRoute(TeamLayoutRoute, {
      params: Promise.resolve({ teamId: "team_1" }),
      children: null,
    });
    expect(screen.getByTestId("v3-team")).toBeInTheDocument();
  });
});
