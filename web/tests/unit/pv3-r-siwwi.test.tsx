/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/SignInWithWorldId/page",
  () => ({ SignInWithWorldIdPage: () => <div data-testid="v3-siwwi" /> }),
);
import RoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/sign-in-with-world-id/page";

it("renders sign in with World ID", async () => {
  render(
    await RoutePage({
      params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
    }),
  );
  expect(screen.getByTestId("v3-siwwi")).toBeInTheDocument();
});
