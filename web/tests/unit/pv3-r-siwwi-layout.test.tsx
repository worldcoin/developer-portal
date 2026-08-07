/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/SignInWithWorldId/layout",
  () => ({
    SignInWithWorldIdLayout: () => <div data-testid="v3-siwwi-layout" />,
  }),
);
import Layout from "../../app/(portal)/teams/[teamId]/apps/[appId]/sign-in-with-world-id/layout";

it("renders the sign in with World ID layout", async () => {
  render(
    await Layout({
      params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
      children: null,
    }),
  );
  expect(screen.getByTestId("v3-siwwi-layout")).toBeInTheDocument();
});
