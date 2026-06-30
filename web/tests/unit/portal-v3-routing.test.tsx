/**
 * @jest-environment jsdom
 *
 * Routing integration test for the per-team v3 gate. Both the team layout and
 * the nested app layout must make the SAME v2/v3 decision from the per-team
 * flag, so an app page never mixes v2 chrome with the v3 shell. The flag read
 * is the REAL implementation; only the leaf layouts are stubbed so we assert
 * which branch each route takes.
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

const isPortalV3EnabledForTeam = jest.fn();
jest.mock("@/lib/feature-flags/portal-v3/flag", () => ({
  isPortalV3EnabledForTeam: (teamId: string) =>
    isPortalV3EnabledForTeam(teamId),
}));

jest.mock("@/scenes/Portal/Teams/TeamId/layout", () => ({
  TeamIdLayout: () => <div data-testid="v2-team" />,
}));
jest.mock("@/scenes/PortalV3/Teams/TeamId/layout", () => ({
  TeamIdLayoutV3: () => <div data-testid="v3-team" />,
}));
jest.mock("@/scenes/Portal/Teams/TeamId/Apps/AppId/layout", () => ({
  AppIdLayout: () => <div data-testid="v2-app" />,
}));
jest.mock("@/scenes/PortalV3/Teams/TeamId/Apps/AppId/layout", () => ({
  AppIdLayoutV3: () => <div data-testid="v3-app" />,
}));

import TeamLayoutRoute from "../../app/(portal)/teams/[teamId]/layout";
import AppIdLayoutRoute from "../../app/(portal)/teams/[teamId]/apps/[appId]/layout";

// Server components are async — await the element they resolve to, then render.
const renderAsync = async (Route: unknown, props: Record<string, unknown>) => {
  const element = await (
    Route as (p: Record<string, unknown>) => Promise<React.ReactElement>
  )(props);
  return render(element);
};

const teamProps = () => ({
  params: Promise.resolve({ teamId: "team_1" }),
  children: null,
});
const appProps = () => ({
  params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
  children: null,
});

beforeEach(() => jest.clearAllMocks());

describe("team layout picks v2/v3 by the per-team flag", () => {
  it("renders the v2 team layout when the team's flag is off", async () => {
    isPortalV3EnabledForTeam.mockResolvedValue(false);
    await renderAsync(TeamLayoutRoute, teamProps());
    expect(screen.getByTestId("v2-team")).toBeInTheDocument();
    expect(screen.queryByTestId("v3-team")).not.toBeInTheDocument();
  });

  it("renders the v3 shell when the team's flag is on", async () => {
    isPortalV3EnabledForTeam.mockResolvedValue(true);
    await renderAsync(TeamLayoutRoute, teamProps());
    expect(screen.getByTestId("v3-team")).toBeInTheDocument();
    expect(screen.queryByTestId("v2-team")).not.toBeInTheDocument();
  });
});

describe("app layout follows the same per-team flag (no mixed chrome)", () => {
  it("renders the v2 app layout when the team's flag is off", async () => {
    isPortalV3EnabledForTeam.mockResolvedValue(false);
    await renderAsync(AppIdLayoutRoute, appProps());
    expect(screen.getByTestId("v2-app")).toBeInTheDocument();
    expect(screen.queryByTestId("v3-app")).not.toBeInTheDocument();
  });

  // Regression guard for the prod blocker: team flag on while the env flag is
  // off must still render the v3 app layout — never v2 chrome inside the shell.
  it("renders the v3 app layout when the team's flag is on", async () => {
    isPortalV3EnabledForTeam.mockResolvedValue(true);
    await renderAsync(AppIdLayoutRoute, appProps());
    expect(screen.getByTestId("v3-app")).toBeInTheDocument();
    expect(screen.queryByTestId("v2-app")).not.toBeInTheDocument();
  });
});
