/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Actions/ActionId/page",
  () => ({ ActionIdPage: () => <div data-testid="v3-actions-actionid" /> }),
);
import RoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/actions/[actionId]/page";

it("renders the action details page", async () => {
  render(
    await RoutePage({
      params: Promise.resolve({
        teamId: "team_1",
        appId: "app_1",
        actionId: "a_1",
      }),
    }),
  );
  expect(screen.getByTestId("v3-actions-actionid")).toBeInTheDocument();
});
