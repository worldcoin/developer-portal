/**
 * @jest-environment jsdom
 *
 * Routing integration test for the route → flag → chooser wiring:
 *  - the (portal) layout picks v2/v3 by the env flag (the chooser), and
 *  - the team layout picks v2/v3 by the per-team SSM flag.
 * The chooser and both flag reads are the REAL implementations; only the leaf
 * layouts are stubbed so we assert which branch each route takes.
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

const isPortalV3Enabled = jest.fn();
const isPortalV3EnabledForTeam = jest.fn();
jest.mock("@/lib/feature-flags/portal-v3/flag", () => ({
  isPortalV3Enabled: () => isPortalV3Enabled(),
  isPortalV3EnabledForTeam: (teamId: string) =>
    isPortalV3EnabledForTeam(teamId),
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

const renderSync = (Route: unknown, props: Record<string, unknown>) =>
  render(
    React.createElement(
      Route as React.ComponentType<Record<string, unknown>>,
      props,
    ),
  );

// Server components are async — await the element they resolve to, then render.
const renderAsync = async (Route: unknown, props: Record<string, unknown>) => {
  const element = await (
    Route as (p: Record<string, unknown>) => Promise<React.ReactElement>
  )(props);
  return render(element);
};

beforeEach(() => jest.clearAllMocks());

describe("(portal) layout picks v2/v3 by the env flag", () => {
  it("renders v2 chrome when the flag is off", () => {
    isPortalV3Enabled.mockReturnValue(false);
    renderSync(PortalLayoutRoute, { children: null });
    expect(screen.getByTestId("v2-portal")).toBeInTheDocument();
    expect(screen.queryByTestId("v3-portal")).not.toBeInTheDocument();
  });

  it("renders v3 chrome when the flag is on", () => {
    isPortalV3Enabled.mockReturnValue(true);
    renderSync(PortalLayoutRoute, { children: null });
    expect(screen.getByTestId("v3-portal")).toBeInTheDocument();
    expect(screen.queryByTestId("v2-portal")).not.toBeInTheDocument();
  });
});

describe("team layout picks v2/v3 by the per-team flag", () => {
  const props = () => ({
    params: Promise.resolve({ teamId: "team_1" }),
    children: null,
  });

  it("renders the v2 team layout when the team's flag is off", async () => {
    isPortalV3EnabledForTeam.mockResolvedValue(false);
    await renderAsync(TeamLayoutRoute, props());
    expect(screen.getByTestId("v2-team")).toBeInTheDocument();
    expect(screen.queryByTestId("v3-team")).not.toBeInTheDocument();
  });

  it("renders the v3 shell when the team's flag is on", async () => {
    isPortalV3EnabledForTeam.mockResolvedValue(true);
    await renderAsync(TeamLayoutRoute, props());
    expect(screen.getByTestId("v3-team")).toBeInTheDocument();
    expect(screen.queryByTestId("v2-team")).not.toBeInTheDocument();
  });
});
