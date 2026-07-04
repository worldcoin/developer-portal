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
// Mini App active state without depending on Tab markup.
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
// The World ID sub-tabs are a server-rendered slot (AppWorldIdSubTabs); the
// chrome's only job is to mount it on World ID segments. Its own visibility
// logic is covered by pv3-appid-worldid-subtabs.test.tsx.
const worldIdTabs = <div data-testid="world-id-tabs-slot" />;
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
      <AppIdChrome params={{}} worldIdTabs={worldIdTabs}>
        <div data-testid="page" />
      </AppIdChrome>,
    );
    expect(screen.getByTestId("page")).toBeInTheDocument();
    expect(screen.queryByTestId("subtabs")).not.toBeInTheDocument();
    expect(screen.queryByTestId("world-id-tabs-slot")).not.toBeInTheDocument();
  });
});
// #endregion

// #region World ID slot mounting
describe("v3 AppIdChrome [World ID slot]", () => {
  it.each(["world-id-4-0", "world-id-actions", "actions"])(
    "mounts the World ID sub-tabs slot on the %s segment",
    (segment) => {
      useSelectedLayoutSegment.mockReturnValue(segment);
      render(
        <AppIdChrome params={params} worldIdTabs={worldIdTabs}>
          <div />
        </AppIdChrome>,
      );
      expect(screen.getByTestId("world-id-tabs-slot")).toBeInTheDocument();
    },
  );

  it("does not mount the World ID slot on non-World-ID segments", () => {
    useSelectedLayoutSegment.mockReturnValue("mini-app");
    render(
      <AppIdChrome params={params} worldIdTabs={worldIdTabs}>
        <div />
      </AppIdChrome>,
    );
    expect(screen.queryByTestId("world-id-tabs-slot")).not.toBeInTheDocument();
  });
});
// #endregion

// #region Mini App sub-tabs
describe("v3 AppIdChrome [Mini App sub-tabs]", () => {
  it("shows Permissions/Transactions/Notifications and marks the active tab from the pathname", () => {
    useSelectedLayoutSegment.mockReturnValue("mini-app");
    usePathname.mockReturnValue("/mini/transactions");
    render(
      <AppIdChrome params={params} worldIdTabs={worldIdTabs}>
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
      <AppIdChrome params={params} worldIdTabs={worldIdTabs}>
        <div data-testid="page" />
      </AppIdChrome>,
    );
    expect(screen.getByTestId("page")).toBeInTheDocument();
    expect(screen.queryByTestId("subtabs")).not.toBeInTheDocument();
    expect(screen.queryByTestId("world-id-tabs-slot")).not.toBeInTheDocument();
    // The main nav (Dashboard / World ID / Configuration / Mini App) is never
    // rendered by the v3 chrome — it lives in the sidebar shell.
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.queryByText("Mini App")).not.toBeInTheDocument();
  });
});
// #endregion
