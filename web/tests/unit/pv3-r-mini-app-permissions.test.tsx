/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown) => v3(),
}));
jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/MiniApp/Permissions/page",
  () => ({
    AppPermissionsPage: () => <div data-testid="v2-mini-app-permissions" />,
  }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MiniApp/Permissions/page",
  () => ({
    AppPermissionsPage: () => <div data-testid="v3-mini-app-permissions" />,
  }),
);
import RoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/mini-app/permissions/page";
it("renders v3 mini-app-permissions", async () => {
  render(
    await RoutePage({ params: Promise.resolve({ teamId: "t", appId: "a" }) }),
  );
  expect(screen.getByTestId("v3-mini-app-permissions")).toBeInTheDocument();
  expect(
    screen.queryByTestId("v2-mini-app-permissions"),
  ).not.toBeInTheDocument();
});
