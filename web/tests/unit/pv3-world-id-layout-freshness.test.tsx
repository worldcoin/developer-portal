/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { WorldIdLayout } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/layout";
import { WorldIdPage } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/page";

// #region Mocks
// The shared layout renders clean in jsdom with no TextEncoder shim, even though
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

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/LegacyActions/page",
  () => ({
    LegacyActionsPage: () => <div data-testid="legacy-actions-child" />,
  }),
);

let searchParams = new URLSearchParams();
let pathname = "/teams/team_1/apps/app_1/world-id";
const replace = jest.fn((url: string) => {
  // Keep the navigation mock in sync with query-parameter consumption.
  searchParams = new URLSearchParams(url.split("?")[1] ?? "");
});
const push = jest.fn();
const refresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push, refresh }),
  usePathname: () => pathname,
  useSearchParams: () => searchParams,
}));

let gridMounts = 0;

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/page/ActionsGrid",
  () => ({
    ActionsGrid: (props: {
      canCreate?: boolean;
      initialDialogOpen?: boolean;
      onActionsChanged?: () => void;
      onCreateActionConsumed?: () => void;
    }) => {
      React.useEffect(() => {
        gridMounts += 1;
      }, []);
      return (
        <div
          data-testid="actions-grid"
          data-can-create={String(Boolean(props.canCreate))}
          data-dialog-open={String(Boolean(props.initialDialogOpen))}
        >
          <button type="button" onClick={() => props.onActionsChanged?.()}>
            actions-changed
          </button>
          <button
            type="button"
            onClick={() => props.onCreateActionConsumed?.()}
          >
            consume-create
          </button>
        </div>
      );
    },
  }),
);

jest.mock("@/components/Skeletons", () => ({
  SkeletonForm: () => <div data-testid="skeleton-form" />,
}));

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/layout/RpSummary",
  () => ({
    RpSummary: (props: {
      initialStatus?: string;
      onRpChanged?: (status?: string) => void;
    }) => (
      <div data-testid="rp-summary" data-status={props.initialStatus}>
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
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/layout/RegisterRpEmptyState",
  () => ({
    RegisterRpEmptyState: (props: {
      initialOpen?: boolean;
      onRegistered?: () => void;
      onSetupClosed?: (completed: boolean) => void;
    }) => (
      <div
        data-testid="register-rp"
        data-open={String(Boolean(props.initialOpen))}
      >
        <button
          type="button"
          onClick={() => {
            props.onRegistered?.();
            props.onSetupClosed?.(true);
          }}
        >
          complete-setup
        </button>
      </div>
    ),
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
      engine: "cloud",
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
                signer_address: "0x1234567890abcdef1234567890abcdef12345678",
                created_at: "2026-01-01T00:00:00Z",
              },
            ],
    },
  ],
  action: over.legacy ? [{ id: "a_1" }] : [],
  action_v4: [{ id: "av_1", action: "vote", description: "Vote" }],
});

const el = (over?: Partial<React.ComponentProps<typeof WorldIdLayout>>) => (
  <WorldIdLayout teamId="team_1" appId="app_1" canManageWorldId {...over}>
    <WorldIdPage />
  </WorldIdLayout>
);

const setQuery = (result: Record<string, unknown>) =>
  useQueryMock.mockReturnValue({ error: undefined, refetch, ...result });

beforeEach(() => {
  jest.clearAllMocks();
  gridMounts = 0;
  searchParams = new URLSearchParams();
  pathname = "/teams/team_1/apps/app_1/world-id";
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
describe("WorldIdLayout [loading boundary]", () => {
  it("renders only the configuration skeleton until RP data resolves", () => {
    setQuery({ data: undefined, loading: true });
    render(el());

    expect(screen.getByTestId("skeleton-form")).toBeInTheDocument();
    expect(screen.queryByTestId("actions-grid")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Actions" }),
    ).not.toBeInTheDocument();
  });

  it("keeps real content during a background refetch and never remounts the grid", () => {
    const data = makeData({ banned: true, legacy: true });
    setQuery({ data, loading: false });
    const view = render(el());

    expect(screen.getByTestId("actions-grid")).toBeInTheDocument();
    expect(gridMounts).toBe(1);

    setQuery({ data: { ...data }, loading: true });
    view.rerender(el());

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

  it("does not flash the summary skeleton when RP data is cached", () => {
    searchParams = new URLSearchParams("tab=world-id-4-0");
    setQuery({ data: makeData(), loading: true });
    render(el());

    expect(screen.queryByTestId("skeleton-form")).not.toBeInTheDocument();
    expect(screen.getByTestId("rp-summary")).toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith(
      "/teams/team_1/apps/app_1/world-id?tab=configuration",
      { scroll: false },
    );
  });
});
// #endregion

// #region Optimistic status
describe("WorldIdLayout [optimistic status]", () => {
  it("shows RP configuration only on the World ID tab", () => {
    searchParams = new URLSearchParams("tab=configuration");
    setQuery({ data: makeData(), loading: false });
    render(el());

    expect(screen.getByTestId("rp-summary")).toBeInTheDocument();
    expect(screen.queryByTestId("actions-grid")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "World ID" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("shows existing Actions but disables creation while registration is pending", () => {
    setQuery({ data: makeData({ status: "pending" }), loading: false });
    render(el());

    expect(screen.queryByTestId("rp-summary")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Actions" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    expect(screen.getByTestId("actions-grid")).toHaveAttribute(
      "data-dialog-open",
      "false",
    );
    expect(screen.getByTestId("actions-grid")).toHaveAttribute(
      "data-can-create",
      "false",
    );
  });

  it("lets a background refetch override an optimistic status for the same RP", () => {
    searchParams = new URLSearchParams("tab=world-id-4-0");
    setQuery({ data: makeData({ status: "pending" }), loading: false });
    const view = render(el());

    fireEvent.click(screen.getByText("rp-registered"));

    setQuery({ data: makeData({ status: "failed" }), loading: false });
    view.rerender(el());

    expect(screen.getByTestId("rp-summary")).toHaveAttribute(
      "data-status",
      "failed",
    );
  });
});
// #endregion

// #region Setup to create handoff
describe("WorldIdLayout [setup to create handoff]", () => {
  it("keeps a consumed enable deep link on World ID configuration", () => {
    searchParams = new URLSearchParams("enableWorldId4=true");
    setQuery({ data: makeData(), loading: false });
    render(el());

    expect(screen.getByTestId("rp-summary")).toBeInTheDocument();
    expect(replace).toHaveBeenLastCalledWith(
      "/teams/team_1/apps/app_1/world-id?tab=configuration",
      { scroll: false },
    );
  });

  it("hides the Actions section until the app has an RP registration", () => {
    setQuery({ data: makeData({ rp: false }), loading: false });
    render(el());

    expect(screen.getByTestId("register-rp")).toHaveAttribute(
      "data-open",
      "false",
    );
    expect(screen.queryByTestId("actions-grid")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Actions" }),
    ).not.toBeInTheDocument();
  });

  it("keeps legacy actions reachable while the v4 Actions section is hidden", () => {
    setQuery({
      data: makeData({ rp: false, legacy: true }),
      loading: false,
    });
    render(el());

    expect(screen.getByTestId("register-rp")).toBeInTheDocument();
    expect(screen.queryByTestId("actions-grid")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Legacy Actions" }),
    ).toHaveAttribute(
      "href",
      "/teams/team_1/apps/app_1/world-id?tab=legacy-actions",
    );
    expect(
      screen.queryByRole("link", { name: "Actions" }),
    ).not.toBeInTheDocument();
  });

  it("renders legacy actions without exposing v4 Actions before RP setup", () => {
    searchParams = new URLSearchParams("tab=legacy-actions");
    setQuery({
      data: makeData({ rp: false, legacy: true }),
      loading: false,
    });

    render(el());

    expect(screen.queryByTestId("register-rp")).not.toBeInTheDocument();
    expect(screen.getByTestId("legacy-actions-child")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Legacy Actions" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.queryByRole("link", { name: "Actions" }),
    ).not.toBeInTheDocument();
  });

  it("opens setup for a create-action deep link while Actions is hidden", () => {
    searchParams = new URLSearchParams("createAction=true");
    setQuery({ data: makeData({ rp: false }), loading: false });
    render(el());

    expect(screen.getByTestId("register-rp")).toHaveAttribute(
      "data-open",
      "true",
    );
    expect(screen.queryByTestId("actions-grid")).not.toBeInTheDocument();
  });

  it("resumes the create dialog after setup produces an active RP", () => {
    searchParams = new URLSearchParams("createAction=true");
    setQuery({ data: makeData({ rp: false }), loading: false });
    const view = render(el());

    expect(screen.getByTestId("register-rp")).toHaveAttribute(
      "data-open",
      "true",
    );
    fireEvent.click(screen.getByText("complete-setup"));
    expect(refetch).toHaveBeenCalledTimes(1);

    setQuery({
      data: makeData({ status: "pending" }),
      loading: false,
    });
    view.rerender(el());

    expect(screen.queryByTestId("actions-grid")).not.toBeInTheDocument();
    expect(gridMounts).toBe(0);

    setQuery({ data: makeData(), loading: false });
    view.rerender(el());

    expect(screen.getByTestId("actions-grid")).toHaveAttribute(
      "data-dialog-open",
      "true",
    );
    expect(gridMounts).toBe(1);
  });

  it("composes query cleanup before the first navigation commits", () => {
    searchParams = new URLSearchParams(
      "tab=world-id-4-0&createAction=true&keep=this",
    );
    setQuery({ data: makeData(), loading: false });
    render(el());

    expect(replace).toHaveBeenLastCalledWith(
      "/teams/team_1/apps/app_1/world-id?tab=configuration&createAction=true&keep=this",
      { scroll: false },
    );

    fireEvent.click(screen.getByText("consume-create"));

    expect(replace).toHaveBeenLastCalledWith(
      "/teams/team_1/apps/app_1/world-id?tab=configuration&keep=this",
      { scroll: false },
    );
  });
});
// #endregion

// #region Revalidation
describe("WorldIdLayout [revalidation]", () => {
  it("keeps search as local layout state instead of hydrating it from the URL", () => {
    searchParams = new URLSearchParams("search=vote");
    setQuery({ data: makeData(), loading: false });
    render(el());

    expect(screen.getByPlaceholderText(/search/i)).toHaveValue("");
  });

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
    render(el({ appId: "" }));

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
