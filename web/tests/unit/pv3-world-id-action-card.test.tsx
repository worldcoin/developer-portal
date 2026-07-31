/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { ActionCard } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/page/ActionCard";
import { ActionsGrid } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/page/ActionsGrid";
import { WorldIdTabs } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/layout/Tabs";
import { WorldIdSubTabs } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/SubTabs";

let mockPathname = "/teams/team_1/apps/app_1/world-id";
jest.mock("next/navigation", () => ({
  useParams: () => ({ teamId: "team_1", appId: "app_1" }),
  usePathname: () => mockPathname,
  useSelectedLayoutSegment: () => "actions",
}));

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

beforeEach(() => {
  mockPathname = "/teams/team_1/apps/app_1/world-id";
});

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

it("renders route-backed Actions and optional Legacy Actions tabs", () => {
  const props = {
    teamId: "team_1",
    appId: "app_1",
    hasLegacyActions: false,
  };
  const { rerender } = render(<WorldIdTabs {...props} />);

  expect(screen.getByRole("link", { name: "Actions" })).toHaveAttribute(
    "href",
    "/teams/team_1/apps/app_1/world-id",
  );
  expect(screen.getByRole("link", { name: "Actions" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(screen.queryByRole("link", { name: "World ID" })).toBeNull();
  expect(screen.queryByRole("link", { name: "Legacy Actions" })).toBeNull();

  rerender(<WorldIdTabs {...props} hasLegacyActions />);
  expect(screen.getByRole("link", { name: "Legacy Actions" })).toHaveAttribute(
    "href",
    "/teams/team_1/apps/app_1/world-id/legacy-actions",
  );

  mockPathname = "/teams/team_1/apps/app_1/world-id/legacy-actions";
  rerender(<WorldIdTabs {...props} hasLegacyActions />);
  expect(screen.getByRole("link", { name: "Legacy Actions" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(screen.getByRole("link", { name: "Actions" })).not.toHaveAttribute(
    "aria-current",
  );

  rerender(<WorldIdTabs {...props} hasLegacyActions showActions={false} />);
  expect(screen.queryByRole("link", { name: "Actions" })).toBeNull();
  expect(screen.getByRole("link", { name: "Legacy Actions" })).toBeVisible();
});

it("keeps the previous tab set on routes awaiting migration", () => {
  mockPathname = "/teams/team_1/apps/app_1/actions";
  render(<WorldIdSubTabs hasLegacyActions />);

  const links = screen.getAllByRole("link");
  expect(links.map((link) => link.textContent)).toEqual([
    "Actions",
    "World ID",
    "Legacy Actions",
  ]);
  expect(links[0]).toHaveAttribute("href", "/teams/team_1/apps/app_1/world-id");
  expect(links[1]).toHaveAttribute(
    "href",
    "/teams/team_1/apps/app_1/world-id?tab=world-id-4-0",
  );
  expect(links[2]).toHaveAttribute(
    "href",
    "/teams/team_1/apps/app_1/world-id/legacy-actions",
  );
});
