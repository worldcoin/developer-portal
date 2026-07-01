/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown, _v2: () => unknown) => v3(),
}));
jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/layout",
  () => ({
    WorldIdActionIdLayout: () => <div data-testid="v2-wia-layout" />,
  }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/layout",
  () => ({
    WorldIdActionIdLayout: () => <div data-testid="v3-wia-layout" />,
  }),
);

import WorldIdActionIdLayout from "../../app/(portal)/teams/[teamId]/apps/[appId]/world-id-actions/[actionId]/layout";

it("renders the v3 ActionId layout for v3, not v2", async () => {
  render(
    await WorldIdActionIdLayout({
      params: Promise.resolve({
        teamId: "team_1",
        appId: "app_1",
        actionId: "action_1",
      }),
      children: null,
    }),
  );
  expect(screen.getByTestId("v3-wia-layout")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-wia-layout")).not.toBeInTheDocument();
});
