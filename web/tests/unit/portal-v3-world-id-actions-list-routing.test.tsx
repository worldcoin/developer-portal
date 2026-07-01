/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown, _v2: () => unknown) => v3(),
}));
jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldIdActions/page",
  () => ({
    WorldIdActionsPage: () => <div data-testid="v2-wia-list" />,
  }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/page",
  () => ({
    WorldIdActionsPage: () => <div data-testid="v3-wia-list" />,
  }),
);

import WorldIdActionsRoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/world-id-actions/page";

it("renders the v3 World ID Actions list for v3, not v2", async () => {
  render(
    await WorldIdActionsRoutePage({
      params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
      searchParams: Promise.resolve({}),
    }),
  );
  expect(screen.getByTestId("v3-wia-list")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-wia-list")).not.toBeInTheDocument();
});
