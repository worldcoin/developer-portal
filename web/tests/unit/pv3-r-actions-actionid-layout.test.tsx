/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown) => v3(),
}));
jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/Actions/ActionId/layout",
  () => ({
    ActionIdLayout: () => <div data-testid="v2-actions-actionid-layout" />,
  }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Actions/ActionId/layout",
  () => ({
    ActionIdLayout: (props: { children: React.ReactNode }) => (
      <div data-testid="v3-actions-actionid-layout">{props.children}</div>
    ),
  }),
);
import ActionsLayout from "../../app/(portal)/teams/[teamId]/apps/[appId]/actions/layout";
import ActionDetailLayout from "../../app/(portal)/teams/[teamId]/apps/[appId]/actions/[actionId]/layout";

it("renders a legacy action detail without the World ID tab bar", async () => {
  const actionDetail = await ActionDetailLayout({
    params: Promise.resolve({
      teamId: "team_1",
      appId: "app_1",
      actionId: "a_1",
    }),
    children: <div data-testid="legacy-action-detail" />,
  });

  render(<ActionsLayout>{actionDetail}</ActionsLayout>);
  expect(screen.getByTestId("v3-actions-actionid-layout")).toBeInTheDocument();
  expect(screen.getByTestId("legacy-action-detail")).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Actions" })).toBeNull();
  expect(screen.queryByRole("link", { name: "World ID" })).toBeNull();
  expect(screen.queryByRole("link", { name: "Legacy Actions" })).toBeNull();
  expect(
    screen.queryByTestId("v2-actions-actionid-layout"),
  ).not.toBeInTheDocument();
});
