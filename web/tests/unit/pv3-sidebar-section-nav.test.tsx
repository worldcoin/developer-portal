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
  AnalyticsAppEligibility,
  SidebarAnimationShell,
  SidebarNav,
} from "@/scenes/PortalV3/layout/Shell/SidebarNav";
import { NavActivePill } from "@/scenes/PortalV3/layout/Shell/NavItem";

// #region Test Data
const teamId = "team_1";
const appId = "app_1";
const base = `/teams/${teamId}/apps/${appId}`;

const makeWorldIdNavigationData = (options?: { rp?: boolean }) => ({
  app: [
    {
      id: appId,
      rp_registration:
        options?.rp === false
          ? []
          : [
              {
                rp_id: "rp_0123456789abcdef",
                status: "registered",
              },
            ],
    },
  ],
  action: [],
});

const renderSidebar = (
  apiKeyTeamIds = [teamId],
  eligibility?: { appId: string; enabled: boolean },
) =>
  render(
    <TooltipProvider>
      <SidebarProvider>
        <SidebarAnimationShell>
          {eligibility ? <AnalyticsAppEligibility {...eligibility} /> : null}
          <SidebarNav apiKeyTeamIds={apiKeyTeamIds} />
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

// #region Analytics allowlist gate
it("shows and activates Analytics after the app layout signals eligibility", () => {
  usePathname.mockReturnValue(`${base}/analytics`);
  renderSidebar([teamId], { appId, enabled: true });

  expect(screen.getByRole("link", { name: "Analytics" })).toBeInTheDocument();
  expect(isCurrent("Analytics")).toBe(true);
});

it("hides Analytics when only another app was signaled as eligible", () => {
  renderSidebar([teamId], {
    appId: "app_someoneelse0000000000000000000",
    enabled: true,
  });

  noLink("Analytics");
});

it("clears Analytics when a later verdict disables the current app", () => {
  const view = renderSidebar([teamId], { appId, enabled: true });
  expect(link("Analytics")).toBeInTheDocument();

  view.rerender(
    <TooltipProvider>
      <SidebarProvider>
        <SidebarAnimationShell>
          <AnalyticsAppEligibility appId={appId} enabled={false} />
          <SidebarNav apiKeyTeamIds={[teamId]} />
        </SidebarAnimationShell>
      </SidebarProvider>
    </TooltipProvider>,
  );

  noLink("Analytics");
});

it("hides Analytics when no app was signaled as eligible", () => {
  renderSidebar();

  noLink("Analytics");
});
// #endregion

// #region active pill animation compartments
it("snaps from an app tab to Projects but slides within team navigation", () => {
  const rect = (top: number, left: number, width: number, height: number) =>
    ({
      top,
      left,
      width,
      height,
      right: left + width,
      bottom: top + height,
      x: left,
      y: top,
      toJSON: () => ({}),
    }) as DOMRect;
  const getBoundingClientRect = jest
    .spyOn(Element.prototype, "getBoundingClientRect")
    .mockImplementation(function (this: Element) {
      if (this.matches("nav")) return rect(100, 20, 204, 300);
      if (this.getAttribute("href") === `/teams/${teamId}`) {
        return rect(104, 20, 204, 36);
      }
      if (this.getAttribute("href")?.includes("/world-id")) {
        return rect(160, 20, 204, 36);
      }
      return rect(216, 20, 204, 36);
    });
  const hrefs = {
    app: `${base}/world-id?tab=actions`,
    projects: `/teams/${teamId}`,
    general: `/teams/${teamId}/settings`,
  };
  const Navigation = (props: {
    active: keyof typeof hrefs;
    animate?: boolean;
  }) => (
    <nav>
      <NavActivePill animate={props.animate} />
      {Object.entries(hrefs).map(([name, href]) => (
        <a
          key={name}
          href={href}
          data-sidebar="menu-button"
          data-active={name === props.active ? "true" : "false"}
        >
          {name}
        </a>
      ))}
    </nav>
  );
  const view = render(<Navigation active="app" />);
  const pill = view.container.querySelector("nav > span")!;

  view.rerender(<Navigation active="projects" animate={false} />);
  expect(pill).not.toHaveClass("transition-[transform,width,height]");

  view.rerender(<Navigation active="general" />);
  expect(pill).toHaveClass("transition-[transform,width,height]");

  view.rerender(<Navigation active="projects" />);
  expect(pill).toHaveClass("transition-[transform,width,height]");

  getBoundingClientRect.mockRestore();
});
// #endregion

// #region Figma navigation contract
describe("v3 SidebarNav [Figma navigation contract]", () => {
  it("renders the flat app sidebar in design order with exact icon assets", () => {
    renderSidebar();

    expect(screen.getByText("Mini App")).toBeInTheDocument();
    expect(screen.getByText("Team settings")).toBeInTheDocument();
    expect(screen.getAllByRole("link").map((item) => item.textContent)).toEqual(
      [
        "Projects",
        "Dashboard",
        "World ID Configuration",
        "Verification",
        "Develop",
        "Transactions",
        "Notifications",
        "General",
        "Members",
        "API Keys",
      ],
    );

    const icons: Record<string, string> = {
      Projects: "view-grid-active",
      Dashboard: "nav-home-active",
      Verification: "nav-badge-check",
      "World ID Configuration": "nav-credential",
      Develop: "nav-delivery-check",
      Transactions: "nav-arrows-transfer",
      Notifications: "nav-bell",
      General: "nav-settings-active",
      Members: "nav-group",
      "API Keys": "nav-key",
    };
    for (const [label, icon] of Object.entries(icons)) {
      expect(link(label).querySelector("img")).toHaveAttribute(
        "src",
        `/images/portal-v3/icons/${icon}.svg`,
      );
    }

    expect(link("Dashboard")).toHaveClass("h-9", "rounded-8", "gap-3");
    expect(link("Projects")).toHaveAttribute("href", `/teams/${teamId}`);
    expect(isCurrent("Projects")).toBe(false);
    expect(link("Develop")).toHaveAttribute("href", `${base}/mini-app/develop`);
    noLink("World ID");
    noLink("Get verified");
  });

  it("optically aligns every navigation icon with its label", () => {
    renderSidebar([teamId], { appId, enabled: true });

    const iconLinks = screen
      .getAllByRole("link")
      .filter((item) => item.querySelector("img"));

    expect(iconLinks.length).toBeGreaterThan(0);
    for (const item of iconLinks) {
      expect(item.firstElementChild).toHaveClass("-translate-y-[2px]");
    }
  });

  it.each([
    [base, "Dashboard"],
    [`${base}/world-id`, "Dashboard"],
    [`${base}/world-id?tab=actions`, "Dashboard"],
    [`${base}/world-id-actions`, "Dashboard"],
    [`${base}/actions`, "Dashboard"],
    [`${base}/world-id-4-0`, "World ID Configuration"],
    [`${base}/world-id?tab=configuration`, "World ID Configuration"],
    [`${base}/configuration`, "Verification"],
    [`${base}/mini-app`, "Develop"],
    [`${base}/mini-app/permissions`, "Develop"],
    [`${base}/mini-app/transactions`, "Transactions"],
    [`${base}/mini-app/notifications`, "Notifications"],
  ])("maps %s to %s", (href, activeLabel) => {
    const [path, query = ""] = href.split("?");
    usePathname.mockReturnValue(path);
    useSearchParams.mockReturnValue(new URLSearchParams(query));
    renderSidebar();

    expect(isCurrent(activeLabel)).toBe(true);
  });

  it("defaults the canonical route to World ID Configuration without an RP", () => {
    usePathname.mockReturnValue(`${base}/world-id`);
    useQueryMock.mockReturnValue({
      data: makeWorldIdNavigationData({ rp: false }),
      loading: false,
    });
    renderSidebar();

    expect(isCurrent("World ID Configuration")).toBe(true);
    expect(link("Dashboard")).toBeInTheDocument();
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

  it("preserves an explicitly requested tab while app data is loading", () => {
    usePathname.mockReturnValue(`${base}/world-id`);
    useSearchParams.mockReturnValue(new URLSearchParams("tab=configuration"));
    useQueryMock.mockReturnValue({ data: undefined, loading: true });
    renderSidebar();

    expect(isCurrent("World ID Configuration")).toBe(true);
  });
});
// #endregion

// #region persistent app context
describe("v3 SidebarNav [persistent app context]", () => {
  it("highlights Projects on the canonical team page with the view-grid icon", () => {
    useParams.mockReturnValue({ teamId });
    usePathname.mockReturnValue(`/teams/${teamId}`);
    renderSidebar();

    expect(link("Projects")).toHaveAttribute("href", `/teams/${teamId}`);
    expect(link("Projects").querySelector("img")).toHaveAttribute(
      "src",
      "/images/portal-v3/icons/view-grid-active.svg",
    );
    expect(isCurrent("Projects")).toBe(true);
    expect(isCurrent("General")).toBe(false);
  });

  it("keeps app and team rows mounted on team settings via validated return_to", () => {
    const returnTo = `${base}/configuration?view=review`;
    useParams.mockReturnValue({ teamId });
    usePathname.mockReturnValue(`/teams/${teamId}/settings`);
    useSearchParams.mockReturnValue(
      new URLSearchParams({ return_to: returnTo, tab: "members" }),
    );
    renderSidebar();

    expect(link("Dashboard")).toHaveAttribute(
      "href",
      `${base}/world-id?tab=actions`,
    );
    expect(link("Develop")).toHaveAttribute("href", `${base}/mini-app/develop`);
    expect(isCurrent("Members")).toBe(true);
    expect(link("General")).toHaveAttribute(
      "href",
      `/teams/${teamId}/settings?return_to=${encodeURIComponent(returnTo)}`,
    );
    expect(screen.getAllByRole("link")).toHaveLength(10);
  });

  it("does not recover app scope from a cross-team return_to", () => {
    useParams.mockReturnValue({ teamId });
    usePathname.mockReturnValue(`/teams/${teamId}/settings`);
    useSearchParams.mockReturnValue(
      new URLSearchParams({
        return_to: "/teams/team_2/apps/app_2/configuration",
      }),
    );
    renderSidebar([]);

    noLink("Dashboard");
    noLink("Develop");
    noLink("API Keys");
    expect(link("Projects")).toBeInTheDocument();
    expect(isCurrent("Projects")).toBe(false);
    expect(isCurrent("General")).toBe(true);
    expect(
      screen.getByRole("button", { name: /World ID Sandbox/i }),
    ).toBeInTheDocument();
  });

  it("keeps API Keys permission-gated", () => {
    const permitted = renderSidebar([teamId]);
    expect(link("API Keys")).toBeInTheDocument();
    permitted.unmount();

    renderSidebar([]);
    noLink("API Keys");
  });

  it("uses client navigation for plain clicks and preserves modifier clicks", () => {
    renderSidebar();

    fireEvent.click(link("Develop"), { metaKey: true });
    expect(routerPush).not.toHaveBeenCalled();
    fireEvent.click(link("Develop"));
    expect(routerPush).toHaveBeenCalledWith(`${base}/mini-app/develop`);
  });

  it("shows only the sandbox action without team or app context", () => {
    useParams.mockReturnValue({});
    usePathname.mockReturnValue("/profile");
    renderSidebar();

    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(
      screen.getByRole("button", { name: /World ID Sandbox/i }),
    ).toBeInTheDocument();
  });
});
// #endregion

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

it("keeps the just-opened mobile sheet open on mount and closes on route change", () => {
  const view = render(sheetTree(false));
  fireEvent.click(screen.getByRole("button", { name: "open-sheet" }));

  view.rerender(sheetTree(true));
  expect(screen.getByTestId("sheet-state")).toHaveTextContent("open");

  usePathname.mockReturnValue(`${base}/configuration`);
  view.rerender(sheetTree(true));
  expect(screen.getByTestId("sheet-state")).toHaveTextContent("closed");
});
// #endregion
