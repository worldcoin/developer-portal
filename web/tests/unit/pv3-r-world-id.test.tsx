/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown) => v3(),
}));
jest.mock("@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/page", () => ({
  WorldIdPage: () => <div data-testid="v3-world-id" />,
}));
import Page from "../../app/(portal)/teams/[teamId]/apps/[appId]/world-id/page";

it("renders the v3 World ID page", async () => {
  render(
    await Page({
      params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
      searchParams: Promise.resolve({}),
    }),
  );
  expect(screen.getByTestId("v3-world-id")).toBeInTheDocument();
});
