/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown) => v3(),
}));
jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/Actions/ActionId/layout",
  () => ({
    ActionIdLayout: () => <div data-testid="v2-actions-actionid-layout" />,
  }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Actions/ActionId/layout",
  () => ({
    ActionIdLayout: () => <div data-testid="v3-actions-actionid-layout" />,
  }),
);
import Layout from "../../app/(portal)/teams/[teamId]/apps/[appId]/actions/[actionId]/layout";
it("renders v3 actions actionId layout", async () => {
  render(
    await Layout({
      params: Promise.resolve({
        teamId: "team_1",
        appId: "app_1",
        actionId: "a_1",
      }),
      children: null,
    }),
  );
  expect(screen.getByTestId("v3-actions-actionid-layout")).toBeInTheDocument();
  expect(
    screen.queryByTestId("v2-actions-actionid-layout"),
  ).not.toBeInTheDocument();
});
