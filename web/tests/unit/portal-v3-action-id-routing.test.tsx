/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown, _v2: () => unknown) => v3(),
}));
jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/Actions/ActionId/page",
  () => ({
    ActionIdPage: () => <div data-testid="v2-action-id" />,
  }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Actions/ActionId/page",
  () => ({
    ActionIdPage: () => <div data-testid="v3-action-id" />,
  }),
);

import ActionIdRoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/actions/[actionId]/page";

it("renders the v3 action overview for v3, not v2", async () => {
  render(
    await ActionIdRoutePage({ params: Promise.resolve({ actionId: "a_1" }) }),
  );
  expect(screen.getByTestId("v3-action-id")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-action-id")).not.toBeInTheDocument();
});
