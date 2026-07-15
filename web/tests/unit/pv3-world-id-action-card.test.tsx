/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { ActionCard } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/page/ActionCard";
import { ActionsGrid } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/page/ActionsGrid";

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/page/CreateActionDialogV4",
  () => ({
    CreateActionDialogV4: () => <div data-testid="create-action-dialog" />,
  }),
);

it("links to the canonical action route", () => {
  render(
    <ActionCard
      teamId="team_1"
      appId="app_1"
      action={{
        id: "action_1",
        action: "verify",
        description: "",
      }}
    />,
  );

  expect(screen.getByRole("link")).toHaveAttribute(
    "href",
    "/teams/team_1/apps/app_1/world-id-actions/action_1",
  );
});

it("renders the create action card before existing actions", () => {
  render(
    <ActionsGrid
      actions={[
        { id: "action_1", action: "verify", description: "Verify a human" },
      ]}
      teamId="team_1"
      appId="app_1"
      search=""
      canCreate
      onCreateActionConsumed={jest.fn()}
      onActionsChanged={jest.fn()}
    />,
  );

  const create = screen.getByRole("button", { name: "Create action" });
  const action = screen.getByRole("link", { name: /verify/i });
  expect(
    create.compareDocumentPosition(action) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
});

it("opens a deferred create intent when it becomes actionable", async () => {
  const props = {
    actions: [],
    teamId: "team_1",
    appId: "app_1",
    search: "",
    canCreate: true,
    onCreateActionConsumed: jest.fn(),
    onActionsChanged: jest.fn(),
  };
  const { rerender } = render(
    <ActionsGrid {...props} initialDialogOpen={false} />,
  );

  expect(screen.queryByTestId("create-action-dialog")).not.toBeInTheDocument();
  rerender(<ActionsGrid {...props} initialDialogOpen />);
  expect(await screen.findByTestId("create-action-dialog")).toBeInTheDocument();
});
