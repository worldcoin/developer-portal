/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
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

it("renders an action detail without the World ID tab bar", async () => {
  const actionDetail = await ActionDetailLayout({
    params: Promise.resolve({
      teamId: "team_1",
      appId: "app_1",
      actionId: "a_1",
    }),
    children: <div data-testid="action-detail" />,
  });

  render(<ActionsLayout>{actionDetail}</ActionsLayout>);
  expect(screen.getByTestId("v3-actions-actionid-layout")).toBeInTheDocument();
  expect(screen.getByTestId("action-detail")).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Actions" })).toBeNull();
  expect(screen.queryByRole("link", { name: "World ID" })).toBeNull();
  expect(screen.queryByRole("link", { name: "Legacy Actions" })).toBeNull();
});
