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
// #endregion

import {
  SidebarAnimationShell,
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
});

describe("v3 SidebarNav", () => {
  it("maps app routes (including legacy paths) to their active item", () => {
    const cases: Array<[string, string]> = [
      [base, "World ID"],
      [`${base}/world-id`, "World ID"],
      [`${base}/world-id/legacy-actions`, "World ID"],
      [`${base}/world-id-4-0`, "World ID"],
      [`${base}/world-id-actions`, "World ID"],
      [`${base}/actions`, "World ID"],
      [`${base}/configuration`, "Configuration"],
    ];
    for (const [path, label] of cases) {
      usePathname.mockReturnValue(path);
      const { unmount } = renderSidebar();
      expect(isCurrent(label)).toBe(true);
      if (path === base) {
        expect(link("World ID")).toHaveAttribute("href", `${base}/world-id`);
      }
      unmount();
    }
  });

  it("expands Mini App children only on its routes and marks the child", () => {
    const collapsed = renderSidebar();
    noLink("Permissions");
    collapsed.unmount();

    usePathname.mockReturnValue(`${base}/mini-app/permissions`);
    const expanded = renderSidebar();
    expect(link("Mini App")).toHaveAttribute("data-active", "true");
    expect(isCurrent("Mini App")).toBe(false);
    expect(isCurrent("Permissions")).toBe(true);
    expect(link("Transactions")).toBeInTheDocument();
    expect(link("Notifications")).toBeInTheDocument();
    expanded.unmount();

    // Legacy top-level transactions route still belongs to Mini App.
    usePathname.mockReturnValue(`${base}/transactions`);
    renderSidebar();
    expect(link("Mini App")).toHaveAttribute("data-active", "true");
  });

  it("shows Overview instead of app tabs when the route has no app", () => {
    useParams.mockReturnValue({ teamId });
    usePathname.mockReturnValue(`/teams/${teamId}/settings`);
    renderSidebar();
    expect(link("Overview")).toHaveAttribute("href", `/teams/${teamId}`);
    expect(isCurrent("Team settings")).toBe(true);
    noLink("World ID");
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

  it("navigates optimistically via the router, leaving modifier clicks to the Link", () => {
    renderSidebar();
    fireEvent.click(link("Configuration"), { metaKey: true });
    expect(routerPush).not.toHaveBeenCalled();
    fireEvent.click(link("Configuration"));
    expect(routerPush).toHaveBeenCalledWith(`${base}/configuration`);
  });
});

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
