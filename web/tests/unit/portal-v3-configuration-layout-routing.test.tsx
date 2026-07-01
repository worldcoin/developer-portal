/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown, _v2: () => unknown) => v3(),
}));
jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/Configuration/layout",
  () => ({
    AppProfileLayout: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="v2-config-layout">{children}</div>
    ),
  }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/layout",
  () => ({
    AppProfileLayout: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="v3-config-layout">{children}</div>
    ),
  }),
);

import ConfigLayout from "../../app/(portal)/teams/[teamId]/apps/[appId]/configuration/layout";

it("renders the v3 Configuration layout for v3, not v2", async () => {
  render(
    await ConfigLayout({
      params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
      children: <span data-testid="child" />,
    }),
  );
  expect(screen.getByTestId("v3-config-layout")).toBeInTheDocument();
  expect(screen.getByTestId("child")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-config-layout")).not.toBeInTheDocument();
});
