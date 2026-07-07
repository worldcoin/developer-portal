/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown) => v3(),
}));
jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/Actions/ActionId/Kiosk",
  () => ({ ActionIdKioskPage: () => <div data-testid="v2-actions-kiosk" /> }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Actions/ActionId/Kiosk",
  () => ({ ActionIdKioskPage: () => <div data-testid="v3-actions-kiosk" /> }),
);
import RoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/actions/[actionId]/kiosk/page";
it("renders v3 actions-kiosk", async () => {
  render(
    await RoutePage({
      params: Promise.resolve({
        teamId: "team_1",
        appId: "app_1",
        actionId: "a_1",
      }),
    }),
  );
  expect(screen.getByTestId("v3-actions-kiosk")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-actions-kiosk")).not.toBeInTheDocument();
});
