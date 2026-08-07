/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
jest.mock("@/scenes/PortalV3/Teams/TeamId/Team/Settings/page", () => ({
  TeamSettingsPage: (props: { requestedTab?: string | string[] }) => (
    <div data-testid="v3-team-settings" data-tab={props.requestedTab} />
  ),
}));
import RoutePage from "../../app/(portal)/teams/[teamId]/(team)/settings/page";

it("renders team settings with the requested tab", async () => {
  render(
    await RoutePage({
      searchParams: Promise.resolve({ tab: "members" }),
    }),
  );
  expect(screen.getByTestId("v3-team-settings")).toHaveAttribute(
    "data-tab",
    "members",
  );
});
