/**
 * @jest-environment jsdom
 *
 * Routing integration test: the team layout is the single per-team v3 decision
 * point. It renders the v2 team layout when the team's flag is off and the v3
 * shell when it's on. The flag read is the REAL implementation; only the leaf
 * layouts are stubbed so we assert which branch the route takes.
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

import TeamLayoutRoute from "../../app/(portal)/teams/[teamId]/layout";

// Server components are async — await the element they resolve to, then render.
const renderAsync = async (Route: unknown, props: Record<string, unknown>) => {
  const element = await (
    Route as (p: Record<string, unknown>) => Promise<React.ReactElement>
  )(props);
  return render(element);
};

const props = () => ({
  params: Promise.resolve({ teamId: "team_1" }),
  children: null,
});

beforeEach(() => jest.clearAllMocks());

describe("team layout picks v2/v3 by the per-team flag", () => {
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
