/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown) => v3(),
}));
jest.mock("@/scenes/Portal/Teams/TeamId/Apps/AppId/page", () => ({
  AppIdPage: () => <div data-testid="v2-dashboard" />,
}));
jest.mock("@/scenes/PortalV3/Teams/TeamId/Apps/AppId/page", () => ({
  AppIdPage: () => <div data-testid="v3-dashboard" />,
}));
import RoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/page";
it("renders v3 dashboard", async () => {
  render(
    await RoutePage({
      params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
    }),
  );
  expect(screen.getByTestId("v3-dashboard")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-dashboard")).not.toBeInTheDocument();
});
