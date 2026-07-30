/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { render, screen } from "@testing-library/react";
import React from "react";

// #region Mocks
const usePathname = jest.fn();
const useParams = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
  useParams: () => useParams(),
}));

jest.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}));

jest.mock("@/lib/utils", () => ({
  cn: (...inputs: unknown[]) => inputs.filter(Boolean).join(" "),
}));

jest.mock("@/scenes/PortalV3/layout/Shell/HelpCenterMenu", () => ({
  HelpCenterMenu: () => <button type="button">Help center</button>,
}));

jest.mock("@/scenes/PortalV3/layout/Shell/SandboxButton", () => ({
  SandboxButton: () => <button type="button">World ID Sandbox</button>,
}));

const fetchApps = jest.fn();
jest.mock("@apollo/client/react", () => ({
  useQuery: () => fetchApps(),
}));
jest.mock(
  "@/scenes/common/layout/AppSelector/graphql/client/fetch-apps.generated",
  () => ({
    FetchAppsDocument: {},
  }),
);

const useCurrentAppId = jest.fn();
jest.mock("@/scenes/PortalV3/layout/Shell/AppsDropdown", () => ({
  useCurrentAppId: () => useCurrentAppId(),
}));
// #endregion

import { SidebarNav } from "@/scenes/PortalV3/layout/Shell/SidebarNav";

// #region Test Data
const teamId = "team_1";
const appId = "app_1";
const base = `/teams/${teamId}/apps/${appId}`;

const renderSidebar = () =>
  render(
    <TooltipProvider>
      <SidebarProvider>
        <SidebarNav />
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
  fetchApps.mockReturnValue({
    data: { app: [{ id: appId }] },
    loading: false,
  });
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
      screen.getByRole("button", { name: "Help center" }),
    ).toBeInTheDocument();
    expect(link("Danger zone")).toHaveAttribute(
      "href",
      `${base}/configuration/danger`,
    );
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

  it("marks only Danger zone current on the danger route", () => {
    usePathname.mockReturnValue(`${base}/configuration/danger`);
    renderSidebar();
    expect(isCurrent("Danger zone")).toBe(true);
    expect(isCurrent("Configuration")).toBe(false);
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
    usePathname.mockReturnValue(`/teams/${teamId}/apps`);
  });

  it("points World ID at the apps list and hides app-only entries", () => {
    renderSidebar();
    expect(link("World ID")).toHaveAttribute("href", `/teams/${teamId}/apps`);
    expect(isCurrent("World ID")).toBe(true);
    expect(
      screen.queryByRole("link", { name: "Configuration" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Mini App" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Danger zone" }),
    ).not.toBeInTheDocument();
  });

  it("hides Danger zone until FetchApps confirms the route app", () => {
    useParams.mockReturnValue({ teamId, appId });
    fetchApps.mockReturnValue({ data: undefined, loading: true });
    usePathname.mockReturnValue(base);
    renderSidebar();
    expect(
      screen.queryByRole("link", { name: "Danger zone" }),
    ).not.toBeInTheDocument();
  });

  it("hides Danger zone when the route app is absent from FetchApps", () => {
    useParams.mockReturnValue({ teamId, appId });
    fetchApps.mockReturnValue({ data: { app: [] }, loading: false });
    usePathname.mockReturnValue(base);
    renderSidebar();
    expect(
      screen.queryByRole("link", { name: "Danger zone" }),
    ).not.toBeInTheDocument();
  });
});
// #endregion

// #region remembered app context
describe("v3 SidebarNav [remembered app context]", () => {
  beforeEach(() => {
    useParams.mockReturnValue({ teamId });
    useCurrentAppId.mockReturnValue(appId);
    usePathname.mockReturnValue(`/teams/${teamId}/settings`);
  });

  it("keeps app links available on team-scoped routes without marking an app section current", () => {
    renderSidebar();

    expect(link("World ID")).toHaveAttribute("href", `${base}/world-id-4-0`);
    expect(link("Configuration")).toBeInTheDocument();
    expect(link("Mini App")).toBeInTheDocument();
    expect(isCurrent("World ID")).toBe(false);
    expect(isCurrent("Configuration")).toBe(false);
    expect(link("Team settings")).toHaveAttribute("aria-current", "page");
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

  it("keeps Help center and the sandbox button visible without a teamId", () => {
    renderSidebar();
    expect(
      screen.getByRole("button", { name: /Help center/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /World ID Sandbox/i }),
    ).toBeInTheDocument();
  });
});
// #endregion
