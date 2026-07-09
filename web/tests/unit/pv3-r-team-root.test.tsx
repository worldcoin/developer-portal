/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown) => v3(),
}));
jest.mock("@/scenes/Portal/Teams/TeamId/Team/page", () => ({
  TeamIdPage: () => <div data-testid="v2-team-root" />,
}));
jest.mock("@/scenes/PortalV3/Teams/TeamId/Team/page", () => ({
  TeamIdPage: () => <div data-testid="v3-team-root" />,
}));
import RoutePage from "../../app/(portal)/teams/[teamId]/(team)/page";
it("renders v3 team root", async () => {
  render(
    await RoutePage({
      params: Promise.resolve({ teamId: "team_1" }),
      searchParams: Promise.resolve({}),
    }),
  );
  expect(screen.getByTestId("v3-team-root")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-team-root")).not.toBeInTheDocument();
});
