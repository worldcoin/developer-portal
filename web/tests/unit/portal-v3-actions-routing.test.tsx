/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown, _v2: () => unknown) => v3(),
}));
jest.mock("@/scenes/Portal/Teams/TeamId/Apps/AppId/Actions/page", () => ({
  ActionsPage: () => <div data-testid="v2-actions" />,
}));
jest.mock("@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Actions/page", () => ({
  ActionsPage: () => <div data-testid="v3-actions" />,
}));

import ActionsRoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/actions/page";

it("renders the v3 Actions page for v3, not v2", async () => {
  render(
    await ActionsRoutePage({
      params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
      searchParams: Promise.resolve({}),
    }),
  );
  expect(screen.getByTestId("v3-actions")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-actions")).not.toBeInTheDocument();
});
