/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown) => v3(),
}));
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/Actions/ActionId/page",
  () => ({
    WorldIdActionDetailPage: () => <div data-testid="v3-world-id-action" />,
  }),
);
import Page from "../../app/(portal)/teams/[teamId]/apps/[appId]/world-id/actions/[actionId]/page";

it("renders the v3 action detail page", async () => {
  render(
    await Page({
      params: Promise.resolve({
        teamId: "team_1",
        appId: "app_1",
        actionId: "action_1",
      }),
    }),
  );
  expect(screen.getByTestId("v3-world-id-action")).toBeInTheDocument();
});
