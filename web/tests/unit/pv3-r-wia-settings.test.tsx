/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown) => v3(),
}));
jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/Settings/page",
  () => ({
    WorldIdActionIdSettingsPage: () => <div data-testid="v2-wia-settings" />,
  }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/Settings/page",
  () => ({
    WorldIdActionIdSettingsPage: () => <div data-testid="v3-wia-settings" />,
  }),
);
import RoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/world-id-actions/[actionId]/settings/page";
it("renders v3 wia-settings", async () => {
  render(
    await RoutePage({
      params: Promise.resolve({ teamId: "t", appId: "a", actionId: "x" }),
    }),
  );
  expect(screen.getByTestId("v3-wia-settings")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-wia-settings")).not.toBeInTheDocument();
});
