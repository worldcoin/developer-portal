/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

// #region Mocks
const usePathname = jest.fn();
const useParams = jest.fn();
const useSearchParams = jest.fn();
const routerPush = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
  useParams: () => useParams(),
  useSearchParams: () => useSearchParams(),
  useRouter: () => ({ push: routerPush, prefetch: jest.fn() }),
}));

const useQueryMock = jest.fn();
jest.mock("@apollo/client/react", () => ({
  useQuery: (...args: unknown[]) => useQueryMock(...args),
}));

jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/WorldId/navigation/graphql/client/get-world-id-navigation.generated",
  () => ({
    GetWorldIdNavigationDocument: { __mockDoc: "worldIdNavigation" },
  }),
);

// jsdom has no ResizeObserver; NavActivePill uses it to track the active item.
global.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

jest.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}));

jest.mock("@/lib/utils", () => ({
  cn: (...inputs: unknown[]) => inputs.filter(Boolean).join(" "),
}));

jest.mock("@/scenes/PortalV3/layout/Shell/SandboxButton", () => ({
  SandboxButton: () => <button type="button">World ID Sandbox</button>,
}));
// #endregion

import {
  SidebarAnimationShell,
  SidebarNav,
} from "@/scenes/PortalV3/layout/Shell/SidebarNav";

// #region Test Data
const teamId = "team_1";
const appId = "app_1";
const base = `/teams/${teamId}/apps/${appId}`;

const makeWorldIdNavigationData = (options?: {
  rp?: boolean;
  rpStatus?: string;
  legacy?: boolean;
}) => ({
  app: [
    {
      id: appId,
      rp_registration:
        options?.rp === false
          ? []
          : [
              {
                rp_id: "rp_0123456789abcdef",
                status: options?.rpStatus ?? "registered",
              },
            ],
    },
  ],
  action: options?.legacy ? [{ id: "legacy_1" }] : [],
});

const renderSidebar = () =>
  render(
    <TooltipProvider>
      <SidebarProvider>
        <SidebarAnimationShell>
          <SidebarNav />
        </SidebarAnimationShell>
      </SidebarProvider>
    </TooltipProvider>,
  );

const link = (label: string) => screen.getByRole("link", { name: label });
const noLink = (label: string) =>
  expect(screen.queryByRole("link", { name: label })).not.toBeInTheDocument();
const isCurrent = (label: string) =>
  link(label).getAttribute("aria-current") === "page";
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  useParams.mockReturnValue({ teamId, appId });
  usePathname.mockReturnValue(base);
  useSearchParams.mockReturnValue(new URLSearchParams());
  useQueryMock.mockReturnValue({
    data: makeWorldIdNavigationData(),
    loading: false,
  });
});

// #region navigation hierarchy
describe("v3 SidebarNav [navigation hierarchy]", () => {
  it("renders the app hierarchy with World ID expanded", () => {
    renderSidebar();

    expect(link("World ID")).toHaveAttribute("href", `${base}/world-id`);
    expect(link("World ID")).toHaveAttribute("data-active", "true");
    expect(isCurrent("World ID")).toBe(false);
    expect(link("World ID").querySelectorAll("img")).toHaveLength(2);
    expect(
      screen.getByRole("list", { name: "World ID navigation" }),
    ).toBeInTheDocument();
    expect(isCurrent("Actions")).toBe(true);
    expect(link("Configuration")).toBeInTheDocument();
    noLink("Legacy actions");
    expect(link("Get verified")).toBeInTheDocument();
    expect(link("Mini App")).toBeInTheDocument();
    noLink("Permissions");
    expect(link("Team settings")).toBeInTheDocument();
  });
});
// #endregion

// #region active section
describe("v3 SidebarNav [active section]", () => {
  it("maps canonical and compatibility routes to World ID children", () => {
    const cases = [
      { path: base, child: "Actions" },
      { path: `${base}/world-id`, child: "Actions" },
      { path: `${base}/world-id-4-0`, child: "Configuration" },
      { path: `${base}/world-id-actions`, child: "Actions" },
      {
        path: `${base}/world-id/legacy-actions`,
        child: "Legacy actions",
      },
      { path: `${base}/actions`, child: "Legacy actions" },
    ];

    for (const { path, child } of cases) {
      usePathname.mockReturnValue(path);
      const { unmount } = renderSidebar();
      expect(link("World ID")).toHaveAttribute("data-active", "true");
      expect(isCurrent("World ID")).toBe(false);
      expect(isCurrent(child)).toBe(true);
      unmount();
    }
  });

  it("marks Get verified current on the app review route", () => {
    usePathname.mockReturnValue(`${base}/configuration`);
    renderSidebar();

    expect(isCurrent("Get verified")).toBe(true);
    expect(
      screen.queryByRole("list", { name: "World ID navigation" }),
    ).not.toBeInTheDocument();
    expect(useQueryMock).toHaveBeenLastCalledWith(
      { __mockDoc: "worldIdNavigation" },
      expect.objectContaining({ skip: true }),
    );
  });

  it("expands Mini App children only on its routes and marks each child", () => {
    const collapsed = renderSidebar();
    noLink("Permissions");
    collapsed.unmount();

    for (const { path, child } of [
      { path: `${base}/mini-app/permissions`, child: "Permissions" },
      { path: `${base}/mini-app/transactions`, child: "Transactions" },
      { path: `${base}/transactions`, child: "Transactions" },
      { path: `${base}/mini-app/notifications`, child: "Notifications" },
    ]) {
      usePathname.mockReturnValue(path);
      const { unmount } = renderSidebar();
      expect(link("Mini App")).toHaveAttribute("data-active", "true");
      expect(isCurrent("Mini App")).toBe(false);
      expect(isCurrent(child)).toBe(true);
      expect(
        screen.getByRole("list", { name: "Mini App navigation" }),
      ).toHaveClass("mt-2");
      expect(link("Permissions").querySelector("svg")).toHaveClass(
        "lucide-lock-keyhole",
      );
      expect(link("Transactions").querySelector("svg")).toHaveClass(
        "lucide-wallet-cards",
      );
      expect(link("Notifications").querySelector("svg")).toHaveClass(
        "lucide-bell",
      );
      unmount();
    }
  });
});
// #endregion

// #region World ID subnavigation
describe("v3 SidebarNav [World ID subnavigation]", () => {
  beforeEach(() => {
    usePathname.mockReturnValue(`${base}/world-id`);
  });

  it("links every available section through the canonical World ID route", () => {
    useQueryMock.mockReturnValue({
      data: makeWorldIdNavigationData({ legacy: true }),
      loading: false,
    });
    useSearchParams.mockReturnValue(new URLSearchParams("tab=legacy-actions"));
    renderSidebar();

    expect(link("Actions")).toHaveAttribute(
      "href",
      `${base}/world-id?tab=actions`,
    );
    expect(link("Configuration")).toHaveAttribute(
      "href",
      `${base}/world-id?tab=configuration`,
    );
    expect(link("Legacy actions")).toHaveAttribute(
      "href",
      `${base}/world-id?tab=legacy-actions`,
    );
    expect(isCurrent("Legacy actions")).toBe(true);
    expect(useQueryMock).toHaveBeenCalledWith(
      { __mockDoc: "worldIdNavigation" },
      {
        variables: { app_id: appId },
        skip: false,
        fetchPolicy: "cache-and-network",
        nextFetchPolicy: "cache-first",
      },
    );
  });

  it("defaults to Configuration and hides Actions without an RP", () => {
    useQueryMock.mockReturnValue({
      data: makeWorldIdNavigationData({ rp: false }),
      loading: false,
    });
    renderSidebar();

    expect(isCurrent("Configuration")).toBe(true);
    noLink("Actions");
    noLink("Legacy actions");
  });

  it("keeps Legacy actions available without an RP when the app has them", () => {
    useQueryMock.mockReturnValue({
      data: makeWorldIdNavigationData({ rp: false, legacy: true }),
      loading: false,
    });
    useSearchParams.mockReturnValue(new URLSearchParams("tab=legacy-actions"));
    renderSidebar();

    noLink("Actions");
    expect(isCurrent("Legacy actions")).toBe(true);
  });

  it("preserves an explicitly requested child while app data is loading", () => {
    useQueryMock.mockReturnValue({ data: undefined, loading: true });
    useSearchParams.mockReturnValue(new URLSearchParams("tab=actions"));
    renderSidebar();

    expect(isCurrent("Actions")).toBe(true);
    expect(link("Configuration")).toBeInTheDocument();
  });

  it("matches the page setup intent when selecting the active child", () => {
    useSearchParams.mockReturnValue(new URLSearchParams("enableWorldId4=true"));
    renderSidebar();

    expect(isCurrent("Configuration")).toBe(true);
    expect(link("Actions")).toBeInTheDocument();
  });

  it("routes child clicks optimistically and preserves modifier clicks", () => {
    renderSidebar();

    fireEvent.click(link("Configuration"), { metaKey: true });
    expect(routerPush).not.toHaveBeenCalled();
    fireEvent.click(link("Configuration"));
    expect(routerPush).toHaveBeenCalledWith(
      `${base}/world-id?tab=configuration`,
    );
  });
});
// #endregion

// #region route-owned app context
describe("v3 SidebarNav [route-owned app context]", () => {
  it("shows Overview instead of app-only entries on team routes", () => {
    useParams.mockReturnValue({ teamId });
    usePathname.mockReturnValue(`/teams/${teamId}/settings`);
    renderSidebar();

    expect(link("Overview")).toHaveAttribute("href", `/teams/${teamId}`);
    expect(isCurrent("Team settings")).toBe(true);
    noLink("World ID");
    noLink("Get verified");
    noLink("Mini App");
  });

  it("hides team-scoped links entirely without a teamId", () => {
    useParams.mockReturnValue({});
    usePathname.mockReturnValue("/profile");
    renderSidebar();

    noLink("Overview");
    noLink("Team settings");
    expect(
      screen.getByRole("button", { name: /World ID Sandbox/i }),
    ).toBeInTheDocument();
  });

  it("navigates top-level links optimistically and preserves modifier clicks", () => {
    renderSidebar();

    fireEvent.click(link("Get verified"), { metaKey: true });
    expect(routerPush).not.toHaveBeenCalled();
    fireEvent.click(link("Get verified"));
    expect(routerPush).toHaveBeenCalledWith(`${base}/configuration`);
  });
});
// #endregion

// On mobile the nav mounts INSIDE the sheet when it opens, so the
// close-on-navigation effect must not fire for the mount itself — that would
// instantly flatten the sidebar the trigger just opened.
// #region mobile sheet behavior
const SheetHarness = (props: { showNav: boolean }) => {
  const { openMobile, setOpenMobile } = useSidebar();
  return (
    <>
      <button type="button" onClick={() => setOpenMobile(true)}>
        open-sheet
      </button>
      <span data-testid="sheet-state">{openMobile ? "open" : "closed"}</span>
      {props.showNav ? <SidebarNav /> : null}
    </>
  );
};

const sheetTree = (showNav: boolean) => (
  <TooltipProvider>
    <SidebarProvider>
      <SidebarAnimationShell>
        <SheetHarness showNav={showNav} />
      </SidebarAnimationShell>
    </SidebarProvider>
  </TooltipProvider>
);

it("keeps the just-opened mobile sheet open on nav mount, closing only on route change", () => {
  const view = render(sheetTree(false));
  fireEvent.click(screen.getByRole("button", { name: "open-sheet" }));

  view.rerender(sheetTree(true));
  expect(screen.getByTestId("sheet-state")).toHaveTextContent("open");

  usePathname.mockReturnValue(`${base}/configuration`);
  view.rerender(sheetTree(true));
  expect(screen.getByTestId("sheet-state")).toHaveTextContent("closed");
});
// #endregion
