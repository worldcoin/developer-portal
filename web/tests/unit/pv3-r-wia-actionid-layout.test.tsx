/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

// #region Mocks
jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown) => v3(),
}));

jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/layout",
  () => ({
    WorldIdActionIdLayout: () => <div data-testid="v2-wia-actionid-layout" />,
  }),
);
import Layout from "../../app/(portal)/teams/[teamId]/apps/[appId]/world-id-actions/[actionId]/layout";
it("leaves the self-contained v3 detail unwrapped", async () => {
  render(
    await Layout({
      params: Promise.resolve({ teamId: "t", appId: "a", actionId: "x" }),
      children: <div data-testid="action-detail" />,
    }),
  );
  expect(screen.getByTestId("action-detail")).toBeInTheDocument();
  expect(
    screen.queryByTestId("v2-wia-actionid-layout"),
  ).not.toBeInTheDocument();
});
