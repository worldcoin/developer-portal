/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown, _v2: () => unknown) => v3(),
}));
jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/SignInWithWorldId/page",
  () => ({
    SignInWithWorldIdPage: () => <div data-testid="v2-siwwi" />,
  }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/SignInWithWorldId/page",
  () => ({
    SignInWithWorldIdPage: () => <div data-testid="v3-siwwi" />,
  }),
);

import SiwwiRoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/sign-in-with-world-id/page";

it("renders the v3 Sign-in-with-World-ID page for v3, not v2", async () => {
  render(
    await SiwwiRoutePage({
      params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
    }),
  );
  expect(screen.getByTestId("v3-siwwi")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-siwwi")).not.toBeInTheDocument();
});
