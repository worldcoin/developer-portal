/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("@/scenes/PortalV3/Teams/TeamId/Team/page", () => ({
  TeamIdPage: () => <div data-testid="v3-team-root" />,
}));
import RoutePage from "../../app/(portal)/teams/[teamId]/(team)/page";

const props = () => ({
  params: Promise.resolve({ teamId: "team_1" }),
  searchParams: Promise.resolve({}),
});

beforeEach(() => jest.clearAllMocks());

it("renders the team overview instead of redirecting", async () => {
  render(await RoutePage(props()));

  expect(screen.getByTestId("v3-team-root")).toBeInTheDocument();
});
