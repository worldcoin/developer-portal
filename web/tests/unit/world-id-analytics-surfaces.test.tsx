/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { print } from "graphql";
import React, { Suspense } from "react";
import { WorldIdLayout } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/layout";
import { ActionsGrid } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/page/ActionsGrid";
import { WorldIdPage } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/page";
import { WorldIdActionDetailPage } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/page";
import { ActionIdPage as PortalV3LegacyActionPage } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Actions/ActionId/page";
import { ActionIdPage as PortalLegacyActionPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Actions/ActionId/page";
import { makeAnalyticsResponse } from "../contracts/world-id-analytics-endpoint";

// #region Mocks
const useQueryMock = jest.fn();
const refetch = jest.fn();
const fetchMock = jest.fn();

jest.mock("@apollo/client/react", () => ({
  useQuery: (...args: unknown[]) => useQueryMock(...args),
}));

let searchParams = new URLSearchParams();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: jest.fn(),
    push: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => "/teams/team_1/apps/app_1/world-id-4-0",
  useSearchParams: () => searchParams,
  useParams: () => ({ teamId: "team_1", appId: "app_1" }),
}));

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/page/CreateActionDialogV4",
  () => ({
    CreateActionDialogV4: () => <div data-testid="create-action-dialog" />,
  }),
);

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/Danger/DangerZoneSection",
  () => ({
    DangerZoneSection: () => <div data-testid="danger-zone" />,
  }),
);

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/layout/RpSummary",
  () => ({
    RpSummary: () => <div data-testid="rp-summary" />,
  }),
);

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/layout/RegisterRpEmptyState",
  () => ({
    RegisterRpEmptyState: () => <div data-testid="register-rp" />,
  }),
);

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/page/SettingsCard",
  () => ({
    SettingsCard: () => <div data-testid="v4-settings" />,
  }),
);

global.fetch = fetchMock as unknown as typeof fetch;
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as typeof ResizeObserver;
// #endregion

// #region Test Data
const appId = "app_00000000000000000000000000000001";
const v3ActionId = "action_000000000000000000000000000001";
const v4ActionId = "action_v4_0000000000000000000000000001";

const makePointSeries = (count = "5") => [
  { date: "2026-07-28", count: "0" },
  { date: "2026-07-29", count: "2" },
  { date: "2026-07-30", count },
];

const analyticsResponseFor = (requestedActionIds: string[] = []) =>
  makeAnalyticsResponse({
    period: "last_7_days",
    app: {
      count: "7",
      series: makePointSeries("5"),
    },
    legacyActions: requestedActionIds
      .filter((id) => id.startsWith("action_") && !id.startsWith("action_v4_"))
      .map((id) => ({
        id,
        count: "4",
        series: makePointSeries("2"),
      })),
    actions: requestedActionIds
      .filter((id) => id.startsWith("action_v4_"))
      .map((id) => ({
        id,
        count: "5",
        series: makePointSeries("3"),
      })),
  });

const requestUrl = (input: string | URL | Request) => {
  if (input instanceof Request) return new URL(input.url);
  return new URL(input.toString(), "http://localhost");
};

const installAnalyticsFetch = () => {
  fetchMock.mockImplementation((input: string | URL | Request) => {
    const url = requestUrl(input);
    const ids = (url.searchParams.get("action_ids") ?? "")
      .split(",")
      .filter(Boolean);
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => analyticsResponseFor(ids),
    } as Response);
  });
};

const overviewData = (actions = 2) => ({
  app: [
    {
      id: appId,
      is_banned: false,
      is_staging: false,
      rp_registration: [
        {
          rp_id: "rp_0000000000000001",
          status: "registered",
          staging_status: null,
          mode: "managed",
          created_at: "2026-07-20T00:00:00.000Z",
        },
      ],
    },
  ],
  action: [{ id: v3ActionId }],
  action_v4: Array.from({ length: actions }, (_, index) => ({
    id: `action_v4_${(index + 1).toString().padStart(32, "0")}`,
    action: `action-${index + 1}`,
    description: "",
  })),
});

const renderWorldIdApp = () =>
  render(
    <WorldIdLayout teamId="team_1" appId={appId} canManageWorldId={false}>
      <WorldIdPage />
    </WorldIdLayout>,
  );

const v4DetailData = {
  action_v4: [
    {
      id: v4ActionId,
      action: "vote",
      description: "Vote once",
      created_at: "2026-07-20T00:00:00.000Z",
      nullifiers_aggregate: { aggregate: { count: 999 } },
      nullifiers: [
        {
          id: "nullifier_v4_1",
          action_v4_id: v4ActionId,
          created_at: "2026-07-30T11:00:00.000Z",
          nullifier: "0x1234567890abcdef1234567890abcdef",
        },
      ],
    },
  ],
};

const legacyDetailData = (isStaging = false) => ({
  action: [
    {
      id: v3ActionId,
      app: { engine: "cloud", is_staging: isStaging },
      nullifiers: [
        {
          id: "nil_1",
          updated_at: "2026-07-30T11:00:00.000Z",
          nullifier_hash: "1234567890abcdef1234567890abcdef",
          uses: 8,
        },
      ],
    },
  ],
});

const fulfilledParams = {
  then(resolve: (value: Record<string, string>) => void) {
    resolve({
      teamId: "team_1",
      appId,
      actionId: v3ActionId,
    });
  },
} as unknown as Promise<Record<string, string>>;

beforeEach(() => {
  jest.clearAllMocks();
  searchParams = new URLSearchParams();
  refetch.mockResolvedValue({});
  installAnalyticsFetch();
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "visible",
  });
});
// #endregion

// #region App hero
describe("World ID app page [combined analytics hero]", () => {
  it("renders one combined metric for the whole app", async () => {
    useQueryMock.mockReturnValue({
      data: overviewData(),
      loading: false,
      error: undefined,
      refetch,
    });

    renderWorldIdApp();

    expect(
      await screen.findByRole("heading", { name: "Unique Verifications" }),
    ).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();

    const appRequests = fetchMock.mock.calls
      .map((call) => requestUrl(call[0]))
      .filter((url) => !url.searchParams.has("action_ids"));
    expect(appRequests).toHaveLength(1);
    expect(appRequests[0].searchParams.get("period")).toBe("last_7_days");
    expect(appRequests[0].searchParams.get("environment")).toBe("production");
  });

  it("keeps the hero on production even when the app is staging", async () => {
    useQueryMock.mockReturnValue({
      data: {
        ...overviewData(),
        app: [{ ...overviewData().app[0], is_staging: true }],
      },
      loading: false,
      error: undefined,
      refetch,
    });

    renderWorldIdApp();

    await screen.findByRole("heading", { name: "Unique Verifications" });
    const appRequest = fetchMock.mock.calls
      .map((call) => requestUrl(call[0]))
      .find((url) => !url.searchParams.has("action_ids"));
    expect(appRequest?.searchParams.get("environment")).toBe("production");
  });

  it("keeps the app total independent of card search and pagination requests", async () => {
    useQueryMock.mockReturnValue({
      data: overviewData(13),
      loading: false,
      error: undefined,
      refetch,
    });
    renderWorldIdApp();
    expect(await screen.findByText("7")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: { value: "action-13" },
    });

    expect(screen.getByText("7")).toBeInTheDocument();
    const appRequest = fetchMock.mock.calls
      .map((call) => requestUrl(call[0]))
      .find((url) => !url.searchParams.has("action_ids"));
    expect(appRequest?.searchParams.has("action_ids")).toBe(false);
  });
});
// #endregion

// #region V4 card previews
describe("World ID action grid [visible previews]", () => {
  it("requests Last 7 Days previews for only the twelve visible action ids", async () => {
    const actions = Array.from({ length: 13 }, (_, index) => ({
      id: `action_v4_${(index + 1).toString().padStart(32, "0")}`,
      action: `action-${index + 1}`,
      description: "",
    }));
    render(
      <ActionsGrid
        actions={actions}
        teamId="team_1"
        appId={appId}
        search=""
        canCreate={false}
        onCreateActionConsumed={jest.fn()}
        onActionsChanged={jest.fn()}
      />,
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const firstPageRequestedIds = new Set(
      fetchMock.mock.calls.flatMap((call) =>
        (requestUrl(call[0]).searchParams.get("action_ids") ?? "")
          .split(",")
          .filter(Boolean),
      ),
    );

    expect(firstPageRequestedIds).toEqual(
      new Set(actions.slice(0, 12).map((action) => action.id)),
    );
    expect(firstPageRequestedIds.has(actions[12].id)).toBe(false);
    for (const call of fetchMock.mock.calls) {
      const url = requestUrl(call[0]);
      expect(url.searchParams.get("period")).toBe("last_7_days");
      expect(
        (url.searchParams.get("action_ids") ?? "").split(",").filter(Boolean)
          .length,
      ).toBeLessThanOrEqual(12);
    }

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some((call) =>
          (requestUrl(call[0]).searchParams.get("action_ids") ?? "")
            .split(",")
            .includes(actions[12].id),
        ),
      ).toBe(true),
    );
    expect(
      screen.getByText("Unique Verifications", {
        selector: "span",
      }),
    ).toBeInTheDocument();
  });
});
// #endregion

// #region V4 action detail
describe("World ID v4 action detail [single aggregate and feed]", () => {
  it("uses the graph number as the sole aggregate and preserves the latest-100 feed", async () => {
    useQueryMock.mockReturnValue({
      data: v4DetailData,
      loading: false,
      error: undefined,
      refetch,
    });

    render(
      <WorldIdActionDetailPage
        params={{ teamId: "team_1", appId, actionId: v4ActionId }}
        canModify={false}
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "Unique Verifications" }),
    ).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.queryByText("999")).not.toBeInTheDocument();
    expect(screen.getByText("Recent verifications")).toBeInTheDocument();
    expect(screen.getByText("Nullifier")).toBeInTheDocument();
    expect(screen.getByText(/0x1234567890/)).toBeInTheDocument();
    expect(screen.queryByText(/Verified humans/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Human$/i)).not.toBeInTheDocument();

    // The bounded feed limit is a narrow query-wiring obligation that cannot
    // be inferred from a mocked result. Keep this one document assertion close
    // to the rendered latest-100 behavior.
    const feedDocument = print(useQueryMock.mock.calls[0][0]);
    expect(feedDocument.replace(/\s+/g, " ")).toMatch(
      /nullifiers\s*\(\s*limit:\s*100/i,
    );
  });
});
// #endregion

// #region Active legacy v3 action details
describe.each([
  ["PortalV3", PortalV3LegacyActionPage],
  ["Portal", PortalLegacyActionPage],
])(
  "%s legacy action detail [analytics replacement]",
  (_name, LegacyActionPage) => {
    it("replaces ActionStatsGraph while preserving the bounded verification feed", async () => {
      useQueryMock.mockReturnValue({
        data: legacyDetailData(),
        loading: false,
        error: undefined,
      });

      await act(async () => {
        render(
          <Suspense fallback={<div>loading</div>}>
            <LegacyActionPage params={fulfilledParams} />
          </Suspense>,
        );
      });

      expect(
        await screen.findByRole("heading", {
          name: "Unique Verifications",
        }),
      ).toBeInTheDocument();
      expect(screen.getByText("4")).toBeInTheDocument();
      expect(screen.getByText("Recent verifications")).toBeInTheDocument();
      expect(screen.getByText("Nullifier")).toBeInTheDocument();
      expect(screen.getByText(/1234567890/)).toBeInTheDocument();
      expect(screen.queryByText(/Verified humans/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/^Human$/i)).not.toBeInTheDocument();

      expect(useQueryMock).toHaveBeenCalledTimes(1);
      const feedDocument = print(useQueryMock.mock.calls[0][0]);
      expect(feedDocument.replace(/\s+/g, " ")).toMatch(
        /nullifiers\s*\(\s*limit:\s*100/i,
      );
      expect(feedDocument).toMatch(/is_staging/);
      await waitFor(() => expect(fetchMock).toHaveBeenCalled());
      expect(
        fetchMock.mock.calls.some(
          (call) =>
            requestUrl(call[0]).searchParams.get("environment") ===
            "production",
        ),
      ).toBe(true);
    });

    it("maps staging apps to the staging analytics environment", async () => {
      useQueryMock.mockReturnValue({
        data: legacyDetailData(true),
        loading: false,
        error: undefined,
      });

      await act(async () => {
        render(
          <Suspense fallback={<div>loading</div>}>
            <LegacyActionPage params={fulfilledParams} />
          </Suspense>,
        );
      });

      expect(
        await screen.findByRole("heading", {
          name: "Unique Verifications",
        }),
      ).toBeInTheDocument();
      await waitFor(() =>
        expect(
          fetchMock.mock.calls.some(
            (call) =>
              requestUrl(call[0]).searchParams.get("environment") === "staging",
          ),
        ).toBe(true),
      );
    });
  },
);
// #endregion
