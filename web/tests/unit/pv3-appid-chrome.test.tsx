/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

// #region Mocks
const usePathname = jest.fn();
const useSelectedLayoutSegment = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
  useSelectedLayoutSegment: () => useSelectedLayoutSegment(),
}));

// Passthrough — the sub-tab content is what we assert on.
jest.mock("@/components/SizingWrapper", () => ({
  SizingWrapper: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

// Expose the (visible) items SectionSubTabs receives so tests can assert the
// hidden-flag logic and active state without depending on Tab markup.
jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/common/SectionSubTabs",
  () => ({
    SectionSubTabs: ({
      items,
    }: {
      items: Array<{ label: string; hidden?: boolean; active?: boolean }>;
    }) => (
      <ul data-testid="subtabs">
        {items
          .filter((i) => !i.hidden)
          .map((i) => (
            <li key={i.label} data-active={i.active ? "true" : "false"}>
              {i.label}
            </li>
          ))}
      </ul>
    ),
  }),
);

jest.mock("@/lib/urls", () => ({
  urls: {
    miniAppPermissions: () => "/mini/permissions",
    miniAppTransactions: () => "/mini/transactions",
    miniAppNotifications: () => "/mini/notifications",
    actions: () => "/actions-legacy",
  },
}));

import { AppIdChrome } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/layout/AppIdChrome";
// #endregion

// #region Test Data
const params = { teamId: "team_1", appId: "app_1" };
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  usePathname.mockReturnValue("/");
  useSelectedLayoutSegment.mockReturnValue(null);
});

// #region guard
describe("v3 AppIdChrome [missing team/app]", () => {
  it("renders only children when teamId/appId are absent", () => {
    useSelectedLayoutSegment.mockReturnValue("mini-app");
    render(
      <AppIdChrome params={{}} hasRpRegistration hasLegacyActions>
        <div data-testid="page" />
      </AppIdChrome>,
    );
    expect(screen.getByTestId("page")).toBeInTheDocument();
    expect(screen.queryByTestId("subtabs")).not.toBeInTheDocument();
  });
});
// #endregion

// #region World ID sub-tabs
describe("v3 AppIdChrome [World ID sub-tabs]", () => {
  it("shows World ID 4.0 + Actions and hides Legacy for an app with an RP registration only", () => {
    useSelectedLayoutSegment.mockReturnValue("world-id-4-0");
    render(
      <AppIdChrome params={params} hasRpRegistration hasLegacyActions={false}>
        <div />
      </AppIdChrome>,
    );
    expect(screen.getByTestId("subtabs")).toBeInTheDocument();
    expect(screen.getByText("World ID 4.0")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
    expect(screen.queryByText("World ID 3.0 Legacy")).not.toBeInTheDocument();
  });

  it("shows only Legacy for an app with legacy actions but no RP registration", () => {
    useSelectedLayoutSegment.mockReturnValue("actions");
    render(
      <AppIdChrome params={params} hasRpRegistration={false} hasLegacyActions>
        <div />
      </AppIdChrome>,
    );
    expect(screen.getByText("World ID 3.0 Legacy")).toBeInTheDocument();
    expect(screen.queryByText("World ID 4.0")).not.toBeInTheDocument();
    expect(screen.queryByText("Actions")).not.toBeInTheDocument();
  });

  it("renders no sub-tab bar when the app has neither RP registration nor legacy actions", () => {
    useSelectedLayoutSegment.mockReturnValue("world-id-4-0");
    render(
      <AppIdChrome
        params={params}
        hasRpRegistration={false}
        hasLegacyActions={false}
      >
        <div data-testid="page" />
      </AppIdChrome>,
    );
    expect(screen.queryByTestId("subtabs")).not.toBeInTheDocument();
    expect(screen.getByTestId("page")).toBeInTheDocument();
  });
});
// #endregion

// #region Mini App sub-tabs
describe("v3 AppIdChrome [Mini App sub-tabs]", () => {
  it("shows Permissions/Transactions/Notifications and marks the active tab from the pathname", () => {
    useSelectedLayoutSegment.mockReturnValue("mini-app");
    usePathname.mockReturnValue("/mini/transactions");
    render(
      <AppIdChrome params={params} hasRpRegistration hasLegacyActions>
        <div />
      </AppIdChrome>,
    );
    expect(screen.getByText("Permissions")).toBeInTheDocument();
    expect(screen.getByText("Transactions")).toBeInTheDocument();
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Transactions").getAttribute("data-active")).toBe(
      "true",
    );
    expect(screen.getByText("Permissions").getAttribute("data-active")).toBe(
      "false",
    );
  });
});
// #endregion

// #region Configuration — no sub-tabs, no primary nav
describe("v3 AppIdChrome [Configuration]", () => {
  it("renders no sub-tabs and no primary app-nav tabs (sidebar owns nav; Danger zone moved into the page)", () => {
    useSelectedLayoutSegment.mockReturnValue("configuration");
    render(
      <AppIdChrome params={params} hasRpRegistration hasLegacyActions>
        <div data-testid="page" />
      </AppIdChrome>,
    );
    expect(screen.getByTestId("page")).toBeInTheDocument();
    expect(screen.queryByTestId("subtabs")).not.toBeInTheDocument();
    // The main nav (Dashboard / World ID / Configuration / Mini App) is never
    // rendered by the v3 chrome — it lives in the sidebar shell.
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.queryByText("Mini App")).not.toBeInTheDocument();
  });
});
// #endregion
