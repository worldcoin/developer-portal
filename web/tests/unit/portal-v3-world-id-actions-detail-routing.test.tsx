/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown, _v2: () => unknown) => v3(),
}));
jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/page",
  () => ({
    WorldIdActionIdPage: () => <div data-testid="v2-wia-detail" />,
  }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/page",
  () => ({
    WorldIdActionIdPage: () => <div data-testid="v3-wia-detail" />,
  }),
);

import WorldIdActionIdPage from "../../app/(portal)/teams/[teamId]/apps/[appId]/world-id-actions/[actionId]/page";

it("renders the v3 ActionId detail page for v3, not v2", async () => {
  render(
    await WorldIdActionIdPage({
      params: Promise.resolve({
        teamId: "team_1",
        appId: "app_1",
        actionId: "action_1",
      }),
    }),
  );
  expect(screen.getByTestId("v3-wia-detail")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-wia-detail")).not.toBeInTheDocument();
});
