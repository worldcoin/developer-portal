/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown, _v2: () => unknown) => v3(),
}));
jest.mock("@/scenes/Portal/Teams/TeamId/Team/layout", () => ({
  TeamLayout: () => <div data-testid="v2-team-layout" />,
}));
jest.mock("@/scenes/PortalV3/Teams/TeamId/Team/layout", () => ({
  TeamLayout: () => <div data-testid="v3-team-layout" />,
}));

import TeamLayoutRoute from "../../app/(portal)/teams/[teamId]/(team)/layout";

it("renders the v3 team layout for v3, not v2", async () => {
  render(
    await TeamLayoutRoute({
      params: Promise.resolve({ teamId: "team_1" }),
      children: <div />,
    }),
  );
  expect(screen.getByTestId("v3-team-layout")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-team-layout")).not.toBeInTheDocument();
});
