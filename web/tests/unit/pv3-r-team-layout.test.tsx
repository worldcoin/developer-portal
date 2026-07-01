/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown) => v3(),
}));
jest.mock("@/scenes/Portal/Teams/TeamId/Team/layout", () => ({
  TeamLayout: () => <div data-testid="v2-team-layout" />,
}));
jest.mock("@/scenes/PortalV3/Teams/TeamId/Team/layout", () => ({
  TeamLayout: () => <div data-testid="v3-team-layout" />,
}));
import Layout from "../../app/(portal)/teams/[teamId]/(team)/layout";
it("renders v3 team layout (pass-through)", async () => {
  render(
    await Layout({
      params: Promise.resolve({ teamId: "team_1" }),
      children: null,
    }),
  );
  expect(screen.getByTestId("v3-team-layout")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-team-layout")).not.toBeInTheDocument();
});
