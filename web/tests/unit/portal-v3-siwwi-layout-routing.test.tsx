/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown, _v2: () => unknown) => v3(),
}));
jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/SignInWithWorldId/layout",
  () => ({
    SignInWithWorldIdLayout: () => <div data-testid="v2-siwwi-layout" />,
  }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/SignInWithWorldId/layout",
  () => ({
    SignInWithWorldIdLayout: () => <div data-testid="v3-siwwi-layout" />,
  }),
);

import SiwwiRouteLayout from "../../app/(portal)/teams/[teamId]/apps/[appId]/sign-in-with-world-id/layout";

it("renders the v3 Sign-in-with-World-ID layout for v3, not v2", async () => {
  render(
    await SiwwiRouteLayout({
      children: <div data-testid="children" />,
      params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
    }),
  );
  expect(screen.getByTestId("v3-siwwi-layout")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-siwwi-layout")).not.toBeInTheDocument();
});
