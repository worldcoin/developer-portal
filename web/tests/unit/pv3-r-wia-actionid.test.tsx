/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown) => v3(),
}));
jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/page",
  () => ({ WorldIdActionIdPage: () => <div data-testid="v2-wia-actionid" /> }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/page",
  () => ({ WorldIdActionIdPage: () => <div data-testid="v3-wia-actionid" /> }),
);
import RoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/world-id-actions/[actionId]/page";
it("renders v3 wia-actionid", async () => {
  render(
    await RoutePage({
      params: Promise.resolve({ teamId: "t", appId: "a", actionId: "x" }),
    }),
  );
  expect(screen.getByTestId("v3-wia-actionid")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-wia-actionid")).not.toBeInTheDocument();
});
