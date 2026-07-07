/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown) => v3(),
}));
jest.mock("@/scenes/Portal/Teams/TeamId/Apps/page", () => ({
  AppsPage: () => <div data-testid="v2-apps" />,
}));
jest.mock("@/scenes/PortalV3/Teams/TeamId/Apps/page", () => ({
  AppsPage: () => <div data-testid="v3-apps" />,
}));
import RoutePage from "../../app/(portal)/teams/[teamId]/apps/page";
it("renders v3 apps", async () => {
  render(await RoutePage({ params: Promise.resolve({ teamId: "team_1" }) }));
  expect(screen.getByTestId("v3-apps")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-apps")).not.toBeInTheDocument();
});
