/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown) => v3(),
}));
jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/Configuration/Danger/page",
  () => ({
    AppProfileDangerPage: () => <div data-testid="v2-configuration-danger" />,
  }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/Danger/page",
  () => ({
    AppProfileDangerPage: () => <div data-testid="v3-configuration-danger" />,
  }),
);
import RoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/configuration/danger/page";
it("renders v3 configuration-danger", async () => {
  render(
    await RoutePage({
      params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
    }),
  );
  expect(screen.getByTestId("v3-configuration-danger")).toBeInTheDocument();
  expect(
    screen.queryByTestId("v2-configuration-danger"),
  ).not.toBeInTheDocument();
});
