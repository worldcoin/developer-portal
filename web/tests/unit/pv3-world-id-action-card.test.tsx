/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { WORLD_ID_TABS } from "@/lib/world-id-tabs";
import { ActionCard } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/page/ActionCard";
import { ActionsGrid } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/page/ActionsGrid";
import { WorldIdTabs } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/layout/Tabs";

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as typeof ResizeObserver;

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/page/CreateActionDialogV4",
  () => ({
    CreateActionDialogV4: (props: {
      open: boolean;
      onClose: (success?: boolean) => void;
    }) => (
      <div data-testid="create-action-dialog" data-open={String(props.open)}>
        <button type="button" onClick={() => props.onClose()}>
          Close create dialog
        </button>
      </div>
    ),
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

it("paginates action cards", () => {
  render(
    <ActionsGrid
      actions={Array.from({ length: 13 }, (_, index) => ({
        id: `action_${index + 1}`,
        action: `action-${index + 1}`,
        description: "",
      }))}
      teamId="team_1"
      appId="app_1"
      search=""
      canCreate={false}
      onCreateActionConsumed={jest.fn()}
      onActionsChanged={jest.fn()}
    />,
  );

  expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "action-13" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByRole("link", { name: "action-13" })).toBeInTheDocument();
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
  expect(await screen.findByTestId("create-action-dialog")).toHaveAttribute(
    "data-open",
    "true",
  );

  fireEvent.click(screen.getByRole("button", { name: "Close create dialog" }));
  expect(screen.getByTestId("create-action-dialog")).toHaveAttribute(
    "data-open",
    "false",
  );
  expect(props.onCreateActionConsumed).toHaveBeenCalledTimes(1);
});

it("renders the shared World ID tabs and hides search on Configuration", () => {
  const props = {
    teamId: "team_1",
    appId: "app_1",
    hasLegacyActions: false,
    activeTab: WORLD_ID_TABS.Actions,
    search: "",
    onSearchChange: jest.fn(),
  };
  const { container, rerender } = render(<WorldIdTabs {...props} />);

  expect(container.firstElementChild).toHaveClass("sm:min-h-[52px]");

  expect(screen.getByRole("link", { name: "Actions" })).toHaveAttribute(
    "href",
    "/teams/team_1/apps/app_1/world-id?tab=actions",
  );
  expect(screen.getByRole("link", { name: "Actions" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(screen.getByRole("link", { name: "World ID" })).toHaveAttribute(
    "href",
    "/teams/team_1/apps/app_1/world-id?tab=configuration",
  );
  expect(screen.queryByRole("link", { name: "Legacy Actions" })).toBeNull();
  expect(
    screen.getByRole("textbox", { name: "Search actions" }),
  ).toBeInTheDocument();

  rerender(<WorldIdTabs {...props} hasLegacyActions />);
  expect(screen.getByRole("link", { name: "Legacy Actions" })).toHaveAttribute(
    "href",
    "/teams/team_1/apps/app_1/world-id?tab=legacy-actions",
  );

  rerender(
    <WorldIdTabs
      {...props}
      activeTab={WORLD_ID_TABS.Configuration}
      hasLegacyActions
    />,
  );
  expect(screen.getByRole("link", { name: "World ID" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(screen.getByRole("link", { name: "Actions" })).not.toHaveAttribute(
    "aria-current",
  );
  expect(screen.queryByRole("textbox", { name: "Search actions" })).toBeNull();
  expect(container.firstElementChild).toHaveClass("sm:min-h-[52px]");

  rerender(
    <WorldIdTabs
      {...props}
      activeTab={WORLD_ID_TABS.LegacyActions}
      hasLegacyActions
    />,
  );
  expect(screen.getByRole("link", { name: "Legacy Actions" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(screen.getByRole("link", { name: "Actions" })).not.toHaveAttribute(
    "aria-current",
  );
  expect(
    screen.getByRole("textbox", { name: "Search actions" }),
  ).toBeInTheDocument();

  rerender(
    <WorldIdTabs
      {...props}
      activeTab={WORLD_ID_TABS.LegacyActions}
      hasLegacyActions
      showActions={false}
    />,
  );
  expect(screen.queryByRole("link", { name: "Actions" })).toBeNull();
  expect(screen.getByRole("link", { name: "World ID" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Legacy Actions" })).toBeVisible();
});
