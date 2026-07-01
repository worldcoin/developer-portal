/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown, _v2: () => unknown) => v3(),
}));
jest.mock("@/scenes/Portal/Teams/TeamId/Team/Apps/page", () => ({
  AppsPage: () => <div data-testid="v2-team-apps" />,
}));
jest.mock("@/scenes/PortalV3/Teams/TeamId/Team/Apps/page", () => ({
  AppsPage: () => <div data-testid="v3-team-apps" />,
}));

import TeamRoutePage from "../../app/(portal)/teams/[teamId]/(team)/app/page";

it("renders the v3 team apps page for v3, not v2", async () => {
  render(await TeamRoutePage());
  expect(screen.getByTestId("v3-team-apps")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-team-apps")).not.toBeInTheDocument();
});
