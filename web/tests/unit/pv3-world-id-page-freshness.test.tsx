/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { WorldIdPage } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/page";

// #region Mocks
// This tree renders clean in jsdom with no TextEncoder shim, even though
// BanMessageDialog is a static import. Revisit if that import graph grows.
const useQueryMock = jest.fn();
const refetch = jest.fn();
jest.mock("@apollo/client/react", () => ({
  useQuery: (...args: unknown[]) => useQueryMock(...args),
}));

jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/WorldId/page/graphql/client/get-world-id-overview.generated",
  () => ({ GetWorldIdOverviewDocument: { __mockDoc: "worldIdOverview" } }),
);

// This file pins the page's own data layer (single useQuery, one listener
// pair). The analytics hero has its own frozen test file; isolate it here
// like the other child modules so its listeners/fetches stay out of these
// counts. Ruled with the fetch mock in the approach note (§8).
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/common/WorldIdAnalyticsGraph",
  () => ({
    WorldIdAnalyticsGraph: () => <div data-testid="analytics-graph" />,
  }),
);

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

let searchParams = new URLSearchParams();
const replace = jest.fn((url: string) => {
  // The page re-derives requestedTab/createActionRequested from
  // useSearchParams() every render; an inert replace freezes the funnel.
  searchParams = new URLSearchParams(url.split("?")[1] ?? "");
});
const push = jest.fn();
const refresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push, refresh }),
  usePathname: () => "/teams/team_1/apps/app_1/world-id-4-0",
  useSearchParams: () => searchParams,
}));

let gridMounts = 0;
let registerMounts = 0;

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/page/ActionsGrid",
  () => ({
    ActionsGrid: (props: {
      initialDialogOpen?: boolean;
      onActionsChanged?: () => void;
    }) => {
      React.useEffect(() => {
        gridMounts += 1;
      }, []);
      return (
        <div
          data-testid="actions-grid"
          data-dialog-open={String(Boolean(props.initialDialogOpen))}
        >
          <button type="button" onClick={() => props.onActionsChanged?.()}>
            actions-changed
          </button>
        </div>
      );
    },
  }),
);

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/page/ActionCard/Skeleton",
  () => ({
    ActionCardSkeleton: () => <div data-testid="action-skeleton" />,
  }),
);

jest.mock("@/components/Skeletons", () => ({
  SkeletonForm: () => <div data-testid="skeleton-form" />,
}));

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/page/WorldId40Pane",
  () => ({
    WorldId40Pane: (props: {
      initialStatus?: string;
      onRpChanged?: (status?: string) => void;
    }) => (
      <div data-testid="world-id-pane" data-status={props.initialStatus}>
        <button type="button" onClick={() => props.onRpChanged?.("registered")}>
          rp-registered
        </button>
        <button type="button" onClick={() => props.onRpChanged?.()}>
          rp-refetch-only
        </button>
      </div>
    ),
  }),
);

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/page/RegisterRpEmptyState",
  () => ({
    RegisterRpEmptyState: (props: { initialOpen?: boolean }) => {
      React.useEffect(() => {
        registerMounts += 1;
      }, []);
      return (
        <div
          data-testid="register-rp"
          data-open={String(Boolean(props.initialOpen))}
        />
      );
    },
  }),
);
// #endregion

// #region Test Data
const makeData = (
  over: {
    status?: string;
    rp?: boolean;
    banned?: boolean;
    legacy?: boolean;
    app?: unknown[];
  } = {},
) => ({
  app: over.app ?? [
    {
      id: "app_1",
      is_staging: false,
      is_banned: over.banned ?? false,
      rp_registration:
        over.rp === false
          ? []
          : [
              {
                rp_id: "rp_0123456789abcdef",
                status: over.status ?? "registered",
                staging_status: null,
                mode: "managed",
                created_at: "2026-01-01T00:00:00Z",
              },
            ],
    },
  ],
  action: over.legacy ? [{ id: "a_1" }] : [],
  action_v4: [{ id: "av_1", action: "vote", description: "Vote" }],
});

const el = (over?: Partial<React.ComponentProps<typeof WorldIdPage>>) => (
  <WorldIdPage
    params={{ teamId: "team_1", appId: "app_1" }}
    searchParams={{}}
    canManageWorldId
    {...over}
  />
);

const setQuery = (result: Record<string, unknown>) =>
  useQueryMock.mockReturnValue({ error: undefined, refetch, ...result });

beforeEach(() => {
  jest.clearAllMocks();
  gridMounts = 0;
  registerMounts = 0;
  searchParams = new URLSearchParams();
  useQueryMock.mockReset();
  // refetchOverview calls .catch() on the result.
  refetch.mockResolvedValue({});
  Object.defineProperty(document, "visibilityState", {
    value: "visible",
    configurable: true,
  });
});

afterEach(() => jest.restoreAllMocks());
// #endregion

// #region Loading boundary
describe("WorldIdPage [loading boundary]", () => {
  it("renders skeleton cards on first load when no data has arrived", () => {
    setQuery({ data: undefined, loading: true });
    render(el());

    expect(screen.queryAllByTestId("action-skeleton")).toHaveLength(2);
    expect(screen.queryByTestId("actions-grid")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it("keeps real content during a background refetch and never remounts the grid", () => {
    const data = makeData({ banned: true, legacy: true });
    setQuery({ data, loading: false });
    const view = render(el());

    expect(screen.getByTestId("actions-grid")).toBeInTheDocument();
    expect(gridMounts).toBe(1);

    setQuery({ data: { ...data }, loading: true });
    view.rerender(el());

    expect(screen.queryAllByTestId("action-skeleton")).toHaveLength(0);
    expect(screen.getByTestId("actions-grid")).toBeInTheDocument();
    expect(screen.getByText(/was banned/)).toBeInTheDocument();
    expect(screen.getByText("Legacy Actions")).toBeInTheDocument();

    setQuery({ data: { ...data }, loading: false });
    view.rerender(el());
    expect(gridMounts).toBe(1);

    expect(useQueryMock.mock.calls[0][1]).toEqual({
      variables: { app_id: "app_1" },
      skip: false,
      fetchPolicy: "cache-and-network",
      nextFetchPolicy: "cache-first",
    });
  });

  it("does not flash the form skeleton when a World ID pane is cached", () => {
    searchParams = new URLSearchParams("tab=world-id-4-0");
    setQuery({ data: makeData(), loading: true });
    render(el());

    expect(screen.queryByTestId("skeleton-form")).not.toBeInTheDocument();
    expect(screen.getByTestId("world-id-pane")).toBeInTheDocument();
  });
});
// #endregion

// #region Optimistic status
describe("WorldIdPage [optimistic status]", () => {
  it("lets a background refetch override an optimistic status for the same RP", () => {
    searchParams = new URLSearchParams("tab=world-id-4-0");
    setQuery({ data: makeData({ status: "pending" }), loading: false });
    const view = render(el());

    fireEvent.click(screen.getByText("rp-registered"));

    setQuery({ data: makeData({ status: "failed" }), loading: false });
    view.rerender(el());

    expect(screen.getByTestId("world-id-pane")).toHaveAttribute(
      "data-status",
      "failed",
    );
  });
});
// #endregion

// #region Revalidation
describe("WorldIdPage [revalidation]", () => {
  it("refetches when the tab becomes visible again, and not on mount", () => {
    setQuery({ data: makeData(), loading: false });
    render(el());

    expect(refetch).not.toHaveBeenCalled();

    const search = screen.getByPlaceholderText(/search/i);
    search.focus();
    fireEvent.change(search, { target: { value: "hello" } });

    act(() => {
      fireEvent(document, new Event("visibilitychange"));
    });

    expect(refetch).toHaveBeenCalledTimes(1);
    expect(refetch).toHaveBeenCalledWith();
    // Freshness comes from Apollo, not an RSC refresh — that reintroduces the flash.
    expect(refresh).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();

    const after = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
    expect(after.value).toBe("hello");
    expect(document.activeElement).toBe(after);
  });

  it("ignores a visibilitychange that fires while the tab is hidden", () => {
    setQuery({ data: makeData(), loading: false });
    render(el());

    Object.defineProperty(document, "visibilityState", {
      value: "hidden",
      configurable: true,
    });
    act(() => {
      fireEvent(document, new Event("visibilitychange"));
    });

    expect(refetch).not.toHaveBeenCalled();
  });

  it("refetches on window focus", () => {
    setQuery({ data: makeData(), loading: false });
    render(el());

    act(() => {
      fireEvent(window, new Event("focus"));
    });

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("removes both listeners on unmount", () => {
    const docAdd = jest.spyOn(document, "addEventListener");
    const docRemove = jest.spyOn(document, "removeEventListener");
    const winAdd = jest.spyOn(window, "addEventListener");
    const winRemove = jest.spyOn(window, "removeEventListener");

    setQuery({ data: makeData(), loading: false });
    const view = render(el());

    const visHandler = docAdd.mock.calls.find(
      ([type]) => type === "visibilitychange",
    )![1];
    const focusHandler = winAdd.mock.calls.find(
      ([type]) => type === "focus",
    )![1];

    view.unmount();

    expect(docRemove).toHaveBeenCalledWith("visibilitychange", visHandler);
    expect(winRemove).toHaveBeenCalledWith("focus", focusHandler);
  });

  it("registers the listeners once and does not re-subscribe on every render", () => {
    const docAdd = jest.spyOn(document, "addEventListener");
    const winAdd = jest.spyOn(window, "addEventListener");

    const data = makeData();
    setQuery({ data, loading: false });
    const view = render(el());

    setQuery({ data: { ...data }, loading: false });
    view.rerender(el());
    setQuery({ data: { ...data }, loading: false });
    view.rerender(el());

    expect(
      docAdd.mock.calls.filter(([type]) => type === "visibilitychange"),
    ).toHaveLength(1);
    expect(winAdd.mock.calls.filter(([type]) => type === "focus")).toHaveLength(
      1,
    );

    act(() => {
      fireEvent(document, new Event("visibilitychange"));
    });
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("does not refetch a skipped query when the app id is missing", () => {
    setQuery({ data: undefined, loading: false });
    render(el({ params: { teamId: "team_1" } }));

    expect(useQueryMock.mock.calls[0][1]).toMatchObject({
      variables: { app_id: "" },
      skip: true,
    });

    act(() => {
      fireEvent(document, new Event("visibilitychange"));
      fireEvent(window, new Event("focus"));
    });

    expect(refetch).not.toHaveBeenCalled();
    expect(screen.getByText("404")).toBeInTheDocument();
  });
});
// #endregion
