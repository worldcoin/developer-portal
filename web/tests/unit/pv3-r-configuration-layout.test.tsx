/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown) => v3(),
}));
jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/Configuration/layout",
  () => ({
    AppProfileLayout: () => <div data-testid="v2-configuration-layout" />,
  }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/layout",
  () => ({
    AppProfileLayout: () => <div data-testid="v3-configuration-layout" />,
  }),
);
import Layout from "../../app/(portal)/teams/[teamId]/apps/[appId]/configuration/layout";
it("renders v3 configuration layout", async () => {
  render(
    await Layout({
      params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
      children: null,
    }),
  );
  expect(screen.getByTestId("v3-configuration-layout")).toBeInTheDocument();
  expect(
    screen.queryByTestId("v2-configuration-layout"),
  ).not.toBeInTheDocument();
});
