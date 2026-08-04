/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { ActionsSearchToolbar } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/layout/ActionsSearchToolbar";
import { ActionCard } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/page/ActionCard";
import { ActionsGrid } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/page/ActionsGrid";

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as typeof ResizeObserver;

// The grid fetches Last 7 Days previews for visible cards; stub the
// endpoint so jsdom never attempts real network I/O (approach note §8).
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: async () => ({
      period: "last_7_days",
      app: { count: "0", series: [] },
      legacy_actions: [],
      actions: [],
    }),
  } as Response),
) as unknown as typeof fetch;

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
      emptyReason="Ask a team owner or admin to create actions."
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
      emptyReason="Ask a team owner or admin to create actions."
      onCreateActionConsumed={jest.fn()}
      onActionsChanged={jest.fn()}
    />,
  );

  expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "action-13" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByRole("link", { name: "action-13" })).toBeInTheDocument();
});

const emptyGrid = (over: Partial<ComponentProps<typeof ActionsGrid>> = {}) => (
  <ActionsGrid
    actions={[]}
    teamId="team_1"
    appId="app_1"
    search=""
    canCreate={false}
    emptyReason="Ask a team owner or admin to create actions."
    onCreateActionConsumed={jest.fn()}
    onActionsChanged={jest.fn()}
    {...over}
  />
);

it("explains an empty grid that offers no way to create", () => {
  render(emptyGrid());

  expect(
    screen.getByText("Ask a team owner or admin to create actions."),
  ).toBeInTheDocument();
});

it("explains a search that filters every action out", () => {
  render(
    emptyGrid({
      actions: [{ id: "action_1", action: "verify", description: "" }],
      search: "nothing-matches",
      canCreate: true,
    }),
  );

  expect(screen.getByText("No actions match your search.")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Create action" }),
  ).toBeInTheDocument();
});

it("leaves the create tile as the only empty state when creation is allowed", () => {
  render(emptyGrid({ canCreate: true }));

  expect(
    screen.getByRole("button", { name: "Create action" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByText("Ask a team owner or admin to create actions."),
  ).not.toBeInTheDocument();
});

it("opens a deferred create intent when it becomes actionable", async () => {
  const props = {
    actions: [],
    teamId: "team_1",
    appId: "app_1",
    search: "",
    canCreate: true,
    emptyReason: "Ask a team owner or admin to create actions.",
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

it("renders the shared actions search toolbar above a stable divider", () => {
  const onSearchChange = jest.fn();
  const { container } = render(
    <ActionsSearchToolbar search="" onSearchChange={onSearchChange} />,
  );

  expect(container.firstElementChild).toHaveClass("min-h-[52px]", "border-b");
  const search = screen.getByRole("textbox", { name: "Search actions" });
  fireEvent.change(search, { target: { value: "vote" } });
  expect(onSearchChange).toHaveBeenCalledWith("vote");
  expect(screen.queryByRole("link")).toBeNull();
});
