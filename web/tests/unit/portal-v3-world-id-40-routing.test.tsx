/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown, _v2: () => unknown) => v3(),
}));
jest.mock("@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldId40/page", () => ({
  WorldId40Page: () => <div data-testid="v2-world-id-40" />,
}));
jest.mock("@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId40/page", () => ({
  WorldId40Page: () => <div data-testid="v3-world-id-40" />,
}));

import WorldId40RoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/world-id-4-0/page";

it("renders the v3 World ID 4.0 page for v3, not v2", async () => {
  render(
    await WorldId40RoutePage({
      params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
    }),
  );
  expect(screen.getByTestId("v3-world-id-40")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-world-id-40")).not.toBeInTheDocument();
});
