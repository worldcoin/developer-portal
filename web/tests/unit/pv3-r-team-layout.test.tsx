/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
jest.mock("@/scenes/PortalV3/Teams/TeamId/Team/layout", () => ({
  TeamLayout: () => <div data-testid="v3-team-layout" />,
}));
import Layout from "../../app/(portal)/teams/[teamId]/(team)/layout";

it("renders the team layout", async () => {
  render(
    await Layout({
      params: Promise.resolve({ teamId: "team_1" }),
      children: null,
    }),
  );
  expect(screen.getByTestId("v3-team-layout")).toBeInTheDocument();
});
