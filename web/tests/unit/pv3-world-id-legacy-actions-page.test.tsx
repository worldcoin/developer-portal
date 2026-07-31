/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { EngineType } from "@/lib/types";
import { WORLD_ID_TABS } from "@/lib/world-id-tabs";
import React from "react";
import { LegacyActionsPage } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/LegacyActions/page";
import {
  WorldIdLayoutContext,
  type WorldIdLayoutContextValue,
} from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/layout/context";
import { WorldIdTabs } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/layout/Tabs";

// #region Mocks
const useQueryMock = jest.fn();
jest.mock("@apollo/client/react", () => ({
  useQuery: (...args: unknown[]) => useQueryMock(...args),
}));

jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/Actions/page/graphql/client/actions.generated",
  () => ({ GetActionsDocument: { __mockDoc: "actions" } }),
);
// #endregion

// #region Test Data
let engine = EngineType.Cloud;
let actions = [
  {
    id: "legacy_1",
    name: "Community vote",
    action: "community-vote",
    description: "Vote once in the community poll",
    nullifiers: { aggregate: { sum: { uses: 4 } } },
  },
  {
    id: "legacy_2",
    name: "Claim access",
    action: "claim-access",
    description: "Unlock access",
    nullifiers: { aggregate: { sum: { uses: 1 } } },
  },
];
const refreshOverview = jest.fn();

const LegacyActionsHarness = () => {
  const [actionsSearch, setActionsSearch] = React.useState("");
  const contextValue: WorldIdLayoutContextValue = {
    teamId: "team_1",
    appId: "app_1",
    canManageWorldId: true,
    activeTab: WORLD_ID_TABS.LegacyActions,
    appEngine: engine,
    actions: [],
    actionsSearch,
    hasActiveRp: true,
    shouldOpenCreateAction: false,
    consumeCreateAction: jest.fn(),
    refreshOverview,
  };

  return (
    <WorldIdLayoutContext.Provider value={contextValue}>
      <WorldIdTabs
        teamId="team_1"
        appId="app_1"
        hasLegacyActions
        activeTab={WORLD_ID_TABS.LegacyActions}
        search={actionsSearch}
        onSearchChange={setActionsSearch}
      />
      <LegacyActionsPage />
    </WorldIdLayoutContext.Provider>
  );
};

const renderPage = () => render(<LegacyActionsHarness />);

beforeEach(() => {
  jest.clearAllMocks();
  engine = EngineType.Cloud;
  actions = [
    {
      id: "legacy_1",
      name: "Community vote",
      action: "community-vote",
      description: "Vote once in the community poll",
      nullifiers: { aggregate: { sum: { uses: 4 } } },
    },
    {
      id: "legacy_2",
      name: "Claim access",
      action: "claim-access",
      description: "Unlock access",
      nullifiers: { aggregate: { sum: { uses: 1 } } },
    },
  ];
  useQueryMock.mockImplementation(() => ({
    data: { actions },
    loading: false,
    error: undefined,
  }));
});
// #endregion

describe("LegacyActionsPage", () => {
  it("renders the warning, matching search/grid UI, and read-only cards", async () => {
    renderPage();

    const warning = await screen.findByText(
      /This functionality is deprecated in 4\.0/,
    );
    const search = screen.getByRole("textbox", { name: "Search actions" });
    const firstCard = screen.getByRole("link", {
      name: /Community vote/,
    });

    expect(
      search.compareDocumentPosition(warning) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      warning.compareDocumentPosition(firstCard) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Legacy Actions" }).closest(".border-b"),
    ).toContainElement(search);
    expect(firstCard).toHaveAttribute(
      "href",
      "/teams/team_1/apps/app_1/actions/legacy_1",
    );
    expect(firstCard).toHaveTextContent("community-vote");
    expect(firstCard).toHaveTextContent("4 uses");
    expect(screen.queryByRole("button", { name: "Create action" })).toBeNull();
    expect(useQueryMock).toHaveBeenCalledTimes(1);
    expect(useQueryMock).toHaveBeenCalledWith(
      { __mockDoc: "actions" },
      {
        variables: { app_id: "app_1", condition: {} },
        skip: false,
      },
    );
  });

  it("filters locally without redirecting when a search has no matches", async () => {
    renderPage();

    const search = await screen.findByRole("textbox", {
      name: "Search actions",
    });
    fireEvent.change(search, { target: { value: "does-not-exist" } });

    expect(
      screen.getByText("No legacy actions match your search."),
    ).toBeInTheDocument();
    expect(refreshOverview).not.toHaveBeenCalled();
  });

  it("preserves the on-chain settings destination", async () => {
    engine = EngineType.OnChain;
    renderPage();

    expect(
      await screen.findByRole("link", { name: /Community vote/ }),
    ).toHaveAttribute(
      "href",
      "/teams/team_1/apps/app_1/actions/legacy_1/settings",
    );
  });

  it("paginates legacy action cards", async () => {
    actions = Array.from({ length: 13 }, (_, index) => ({
      id: `legacy_${index + 1}`,
      name: `Legacy action ${index + 1}`,
      action: `legacy-action-${index + 1}`,
      description: "",
      nullifiers: { aggregate: { sum: { uses: 0 } } },
    }));
    renderPage();

    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Legacy action 13/ })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(
      screen.getByRole("link", { name: /Legacy action 13/ }),
    ).toBeInTheDocument();
  });

  it("refreshes the World ID overview when the app has no legacy actions", async () => {
    actions = [];
    renderPage();

    await waitFor(() => {
      expect(refreshOverview).toHaveBeenCalledTimes(1);
    });
  });
});
