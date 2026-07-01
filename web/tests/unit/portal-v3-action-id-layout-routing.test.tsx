/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown, _v2: () => unknown) => v3(),
}));
jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/Actions/ActionId/layout",
  () => ({
    ActionIdLayout: (props: { children: React.ReactNode }) => (
      <div data-testid="v2-action-layout">{props.children}</div>
    ),
  }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Actions/ActionId/layout",
  () => ({
    ActionIdLayout: (props: { children: React.ReactNode }) => (
      <div data-testid="v3-action-layout">{props.children}</div>
    ),
  }),
);

import ActionIdLayoutRoute from "../../app/(portal)/teams/[teamId]/apps/[appId]/actions/[actionId]/layout";

it("renders the v3 action layout (with children) for v3, not v2", async () => {
  render(
    await ActionIdLayoutRoute({
      params: Promise.resolve({ actionId: "a_1" }),
      children: <span data-testid="kids" />,
    }),
  );
  expect(screen.getByTestId("v3-action-layout")).toBeInTheDocument();
  expect(screen.getByTestId("kids")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-action-layout")).not.toBeInTheDocument();
});
