/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown, _v2: () => unknown) => v3(),
}));
jest.mock("@/scenes/Portal/Profile/Teams/page", () => ({
  TeamsPage: () => <div data-testid="v2-teams" />,
}));
jest.mock("@/scenes/PortalV3/Profile/Teams/page", () => ({
  TeamsPage: () => <div data-testid="v3-teams" />,
}));

import RoutePage from "../../app/(portal)/profile/teams/page";

it("renders the v3 profile-teams page for v3, not v2", async () => {
  render(await RoutePage());
  expect(screen.getByTestId("v3-teams")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-teams")).not.toBeInTheDocument();
});
