/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

// #region Mocks
const usePathname = jest.fn();
const useParams = jest.fn();
const routerPush = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
  useParams: () => useParams(),
  useRouter: () => ({ push: routerPush, prefetch: jest.fn() }),
}));

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

const useCurrentAppId = jest.fn();
jest.mock("@/scenes/PortalV3/layout/Shell/AppsDropdown", () => ({
  useCurrentAppId: () => useCurrentAppId(),
}));
// #endregion

import {
  ShellNavigationProvider,
  SidebarNav,
} from "@/scenes/PortalV3/layout/Shell/SidebarNav";

// #region Test Data
const teamId = "team_1";
const appId = "app_1";
const base = `/teams/${teamId}/apps/${appId}`;

const renderSidebar = () =>
  render(
    <TooltipProvider>
      <SidebarProvider>
        {/* Owns the optimistic navigation state SidebarNav consumes, exactly
            as PortalShell mounts it in production. */}
        <ShellNavigationProvider>
          <SidebarNav />
        </ShellNavigationProvider>
      </SidebarProvider>
    </TooltipProvider>,
  );

const link = (label: string) => screen.getByRole("link", { name: label });
const isCurrent = (label: string) =>
  link(label).getAttribute("aria-current") === "page";
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  useParams.mockReturnValue({ teamId, appId });
  useCurrentAppId.mockReturnValue(appId);
  usePathname.mockReturnValue(base);
});

// #region navigation hierarchy
describe("v3 SidebarNav [navigation hierarchy]", () => {
  it("leads with World ID and keeps Mini App children collapsed", () => {
    renderSidebar();

    expect(link("World ID")).toBeInTheDocument();
    expect(link("World ID")).toHaveClass("cursor-pointer");
    expect(
      screen.queryByRole("link", { name: "Dashboard" }),
    ).not.toBeInTheDocument();
    expect(link("Configuration")).toBeInTheDocument();
    expect(link("Mini App")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Notifications" }),
    ).not.toBeInTheDocument();
    expect(link("Team settings")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Help center" }),
    ).not.toBeInTheDocument();
    // Destructive settings live inside Configuration, not the sidebar.
    expect(
      screen.queryByRole("link", { name: "Danger zone" }),
    ).not.toBeInTheDocument();
  });

  it("marks World ID current on the app root", () => {
    renderSidebar();
    expect(isCurrent("World ID")).toBe(true);
  });
});
// #endregion

// #region active section
describe("v3 SidebarNav [active section]", () => {
  it("marks Configuration current on a configuration route", () => {
    usePathname.mockReturnValue(`${base}/configuration`);
    renderSidebar();
    expect(isCurrent("Configuration")).toBe(true);
  });

  it("expands Mini App children and marks the current child route", () => {
    usePathname.mockReturnValue(`${base}/mini-app/permissions`);
    renderSidebar();
    expect(link("Mini App")).toHaveAttribute("data-active", "true");
    expect(isCurrent("Mini App")).toBe(false);
    expect(
      screen.getByRole("list", { name: "Mini App navigation" }),
    ).toHaveClass("mt-2");
    expect(link("World ID")).toBeInTheDocument();
    expect(link("Permissions")).toHaveAttribute("aria-current", "page");
    expect(link("Permissions")).toHaveAttribute("data-active", "true");
    expect(link("Permissions")).toHaveClass("cursor-pointer");
    expect(link("Permissions").querySelector("svg")).toHaveClass(
      "lucide-lock-keyhole",
    );
    expect(link("Transactions").querySelector("svg")).toHaveClass(
      "lucide-wallet-cards",
    );
    expect(link("Notifications").querySelector("svg")).toHaveClass(
      "lucide-bell",
    );
    expect(link("Transactions")).toBeInTheDocument();
    expect(link("Notifications")).toBeInTheDocument();
  });

  it("treats the legacy top-level transactions route as Mini App", () => {
    usePathname.mockReturnValue(`${base}/transactions`);
    renderSidebar();
    expect(link("Mini App")).toHaveAttribute("data-active", "true");
    expect(isCurrent("Transactions")).toBe(true);
  });

  it("marks Notifications current on its Mini App route", () => {
    usePathname.mockReturnValue(`${base}/mini-app/notifications`);
    renderSidebar();
    expect(link("Mini App")).toHaveAttribute("data-active", "true");
    expect(isCurrent("Mini App")).toBe(false);
    expect(isCurrent("Notifications")).toBe(true);
  });

  it("keeps World ID current across current and legacy World ID routes", () => {
    for (const suffix of ["/world-id-4-0", "/world-id-actions", "/actions"]) {
      usePathname.mockReturnValue(`${base}${suffix}`);
      const { unmount } = renderSidebar();
      expect(isCurrent("World ID")).toBe(true);
      unmount();
    }
  });
});
// #endregion

// #region World ID href
describe("v3 SidebarNav [World ID href]", () => {
  it("routes World ID to the 4.0 landing for the route app", () => {
    renderSidebar();
    expect(link("World ID")).toHaveAttribute("href", `${base}/world-id-4-0`);
  });
});
// #endregion

// #region no app selected
describe("v3 SidebarNav [no app selected]", () => {
  beforeEach(() => {
    useParams.mockReturnValue({ teamId });
    useCurrentAppId.mockReturnValue(undefined);
    usePathname.mockReturnValue(`/teams/${teamId}`);
  });

  it("shows the team overview and hides app-only entries", () => {
    renderSidebar();
    expect(link("Overview")).toHaveAttribute("href", `/teams/${teamId}`);
    expect(isCurrent("Overview")).toBe(true);
    expect(
      screen.queryByRole("link", { name: "World ID" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Configuration" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Mini App" }),
    ).not.toBeInTheDocument();
  });
});
// #endregion

// #region route-owned app context
describe("v3 SidebarNav [route-owned app context]", () => {
  beforeEach(() => {
    useParams.mockReturnValue({ teamId });
    useCurrentAppId.mockReturnValue(appId);
    usePathname.mockReturnValue(`/teams/${teamId}/settings`);
  });

  it("does not carry app links into a team-scoped route", () => {
    renderSidebar();

    expect(link("Overview")).toHaveAttribute("href", `/teams/${teamId}`);
    expect(
      screen.queryByRole("link", { name: "World ID" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Configuration" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Mini App" }),
    ).not.toBeInTheDocument();
    expect(link("Team settings")).toHaveAttribute("aria-current", "page");
  });
});
// #endregion

// #region mobile sheet behavior
// On mobile the nav mounts INSIDE the sheet when it opens, so the
// close-on-navigation effect must not fire for the mount itself — that would
// instantly flatten the sidebar the trigger just opened.
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
      <ShellNavigationProvider>
        <SheetHarness showNav={showNav} />
      </ShellNavigationProvider>
    </SidebarProvider>
  </TooltipProvider>
);

describe("v3 SidebarNav [mobile sheet]", () => {
  it("keeps the just-opened sheet open when the nav mounts inside it", () => {
    const view = render(sheetTree(false));
    fireEvent.click(screen.getByRole("button", { name: "open-sheet" }));
    expect(screen.getByTestId("sheet-state")).toHaveTextContent("open");

    view.rerender(sheetTree(true));
    expect(screen.getByTestId("sheet-state")).toHaveTextContent("open");
  });

  it("closes the sheet when the route changes", () => {
    const view = render(sheetTree(true));
    fireEvent.click(screen.getByRole("button", { name: "open-sheet" }));
    expect(screen.getByTestId("sheet-state")).toHaveTextContent("open");

    usePathname.mockReturnValue(`${base}/configuration`);
    view.rerender(sheetTree(true));
    expect(screen.getByTestId("sheet-state")).toHaveTextContent("closed");
  });
});
// #endregion

// #region optimistic navigation
describe("v3 SidebarNav [optimistic navigation]", () => {
  it("routes plain clicks through the client router", () => {
    renderSidebar();
    fireEvent.click(link("Configuration"));
    expect(routerPush).toHaveBeenCalledWith(`${base}/configuration`);
  });

  it("leaves modifier clicks to the Link default (new tab)", () => {
    renderSidebar();
    fireEvent.click(link("Configuration"), { metaKey: true });
    fireEvent.click(link("Configuration"), { ctrlKey: true });
    expect(routerPush).not.toHaveBeenCalled();
  });
});
// #endregion

// Team-scoped links disappear without a team in the route: they could only
// bounce to an arbitrary first team, which is disorienting on /profile.
// #region team-less pages
describe("v3 SidebarNav [team-less pages]", () => {
  beforeEach(() => {
    useParams.mockReturnValue({});
    useCurrentAppId.mockReturnValue(undefined);
    usePathname.mockReturnValue("/profile");
  });

  it("hides World ID when the route has no teamId", () => {
    renderSidebar();
    expect(
      screen.queryByRole("link", { name: "World ID" }),
    ).not.toBeInTheDocument();
  });

  it("hides Team settings when the route has no teamId", () => {
    renderSidebar();
    expect(
      screen.queryByRole("link", { name: "Team settings" }),
    ).not.toBeInTheDocument();
  });

  it("keeps the sandbox button visible without duplicating Help Center", () => {
    renderSidebar();
    expect(
      screen.queryByRole("button", { name: /Help center/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /World ID Sandbox/i }),
    ).toBeInTheDocument();
  });
});
// #endregion
