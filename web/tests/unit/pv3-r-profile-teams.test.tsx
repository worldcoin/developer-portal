/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown) => v3(),
}));
jest.mock("@/scenes/Portal/Profile/Teams/page", () => ({
  TeamsPage: () => <div data-testid="v2-profile-teams" />,
}));
jest.mock("@/scenes/PortalV3/Profile/Teams/page", () => ({
  TeamsPage: () => <div data-testid="v3-profile-teams" />,
}));
import RoutePage from "../../app/(portal)/profile/teams/page";
it("renders v3 profile-teams", async () => {
  render(await RoutePage());
  expect(screen.getByTestId("v3-profile-teams")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-profile-teams")).not.toBeInTheDocument();
});
