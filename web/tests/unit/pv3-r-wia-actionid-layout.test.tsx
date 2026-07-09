/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown) => v3(),
}));
jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/layout",
  () => ({
    WorldIdActionIdLayout: () => <div data-testid="v2-wia-actionid-layout" />,
  }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/layout",
  () => ({
    WorldIdActionIdLayout: () => <div data-testid="v3-wia-actionid-layout" />,
  }),
);
import Layout from "../../app/(portal)/teams/[teamId]/apps/[appId]/world-id-actions/[actionId]/layout";
it("renders v3 wia-actionid-layout", async () => {
  render(
    await Layout({
      params: Promise.resolve({ teamId: "t", appId: "a", actionId: "x" }),
      children: null,
    }),
  );
  expect(screen.getByTestId("v3-wia-actionid-layout")).toBeInTheDocument();
  expect(
    screen.queryByTestId("v2-wia-actionid-layout"),
  ).not.toBeInTheDocument();
});
