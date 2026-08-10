/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Actions/ActionId/Settings/page",
  () => ({
    ActionIdSettingsPage: () => <div data-testid="v3-actions-settings" />,
  }),
);
import RoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/actions/[actionId]/settings/page";

it("renders action settings", async () => {
  render(
    await RoutePage({
      params: Promise.resolve({
        teamId: "team_1",
        appId: "app_1",
        actionId: "a_1",
      }),
    }),
  );
  expect(screen.getByTestId("v3-actions-settings")).toBeInTheDocument();
});
