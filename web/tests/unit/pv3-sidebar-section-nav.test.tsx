/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { Provider } from "jotai";
import React from "react";

// #region Mocks
const usePathname = jest.fn();
const useParams = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
  useParams: () => useParams(),
}));

jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({ user: {} }),
}));

jest.mock("@/lib/utils", () => ({
  checkUserPermissions: () => true,
}));

const useCurrentAppId = jest.fn();
jest.mock("@/scenes/PortalV3/layout/Shell/AppsDropdown", () => ({
  useCurrentAppId: () => useCurrentAppId(),
}));

import {
  AppEnvFlagsSync,
  SidebarNav,
} from "@/scenes/PortalV3/layout/Shell/SidebarNav";
// #endregion

// #region Test Data
const teamId = "team_1";
const appId = "app_1";
const base = `/teams/${teamId}/apps/${appId}`;

// Fresh jotai Provider per render so app-env flags never leak between tests.
const renderSidebar = (flags?: {
  appId: string;
  hasRpRegistration: boolean;
  hasLegacyActions: boolean;
}) =>
  render(
    <Provider>
      {flags ? <AppEnvFlagsSync {...flags} /> : null}
      <SidebarNav />
    </Provider>,
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

// #region main nav
describe("v3 SidebarNav [main nav]", () => {
  it("shows the app + team items on the dashboard (no section sidebar)", () => {
    renderSidebar();
    expect(link("Dashboard")).toBeInTheDocument();
    expect(link("World ID")).toBeInTheDocument();
    expect(link("Configuration")).toBeInTheDocument();
    expect(link("Mini App")).toBeInTheDocument();
    expect(link("Members")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Back" }),
    ).not.toBeInTheDocument();
  });

  it("keeps the main nav on Configuration (a section without sub-pages)", () => {
    usePathname.mockReturnValue(`${base}/configuration`);
    renderSidebar();
    expect(link("Dashboard")).toBeInTheDocument();
    expect(isCurrent("Configuration")).toBe(true);
    expect(
      screen.queryByRole("link", { name: "Back" }),
    ).not.toBeInTheDocument();
  });
});
// #endregion

// #region Mini App section
describe("v3 SidebarNav [Mini App section]", () => {
  it("swaps to the Mini App items with a back link to the app dashboard", () => {
    usePathname.mockReturnValue(`${base}/mini-app/permissions`);
    renderSidebar();

    expect(link("Mini App")).toHaveAttribute("href", base);
    expect(isCurrent("Permissions")).toBe(true);
    expect(isCurrent("Transactions")).toBe(false);
    expect(isCurrent("Notifications")).toBe(false);

    // The main nav is replaced, not appended to.
    expect(
      screen.queryByRole("link", { name: "Dashboard" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Members" }),
    ).not.toBeInTheDocument();
  });
});
// #endregion

// #region World ID section
describe("v3 SidebarNav [World ID section]", () => {
  it("renders the capability-backed World ID items in section mode", () => {
    usePathname.mockReturnValue(`${base}/actions`);
    renderSidebar({ appId, hasRpRegistration: true, hasLegacyActions: true });

    expect(link("World ID")).toHaveAttribute("href", base);
    expect(isCurrent("World ID 4.0")).toBe(false);
    expect(isCurrent("Actions")).toBe(false);
    expect(isCurrent("World ID 3.0 Legacy")).toBe(true);
  });

  it("falls back to the main nav when the app has neither RP registration nor legacy actions", () => {
    usePathname.mockReturnValue(`${base}/world-id-4-0`);
    renderSidebar({ appId, hasRpRegistration: false, hasLegacyActions: false });

    expect(link("Dashboard")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Back" }),
    ).not.toBeInTheDocument();
  });
});
// #endregion
