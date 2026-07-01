/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown, _v2: () => unknown) => v3(),
}));
jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/Actions/ActionId/Danger/page",
  () => ({
    ActionIdDangerPage: () => <div data-testid="v2-action-danger" />,
  }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Actions/ActionId/Danger/page",
  () => ({
    ActionIdDangerPage: () => <div data-testid="v3-action-danger" />,
  }),
);

import ActionIdDangerRoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/actions/[actionId]/danger/page";

it("renders the v3 action danger for v3, not v2", async () => {
  render(
    await ActionIdDangerRoutePage({
      params: Promise.resolve({ actionId: "a_1" }),
    }),
  );
  expect(screen.getByTestId("v3-action-danger")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-action-danger")).not.toBeInTheDocument();
});
