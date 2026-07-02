/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown) => v3(),
}));
jest.mock("@/scenes/Portal/Teams/TeamId/Team/ApiKeys/page", () => ({
  TeamApiKeysPage: () => <div data-testid="v2-api-keys" />,
}));
jest.mock("@/scenes/PortalV3/Teams/TeamId/Team/ApiKeys/page", () => ({
  TeamApiKeysPage: () => <div data-testid="v3-api-keys" />,
}));
import RoutePage from "../../app/(portal)/teams/[teamId]/(team)/api-keys/page";
it("renders v3 api-keys", async () => {
  render(
    await RoutePage({
      params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
    }),
  );
  expect(screen.getByTestId("v3-api-keys")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-api-keys")).not.toBeInTheDocument();
});
