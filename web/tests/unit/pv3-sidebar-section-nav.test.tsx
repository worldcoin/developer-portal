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

  it("routes the World ID entry to /world-id-4-0 for an app with an RP registration", () => {
    renderSidebar({ appId, hasRpRegistration: true, hasLegacyActions: false });
    expect(link("World ID")).toHaveAttribute("href", `${base}/world-id-4-0`);
  });

  it("routes the World ID entry to /actions for a legacy-actions-only app (no RP registration)", () => {
    renderSidebar({ appId, hasRpRegistration: false, hasLegacyActions: true });
    expect(link("World ID")).toHaveAttribute("href", `${base}/actions`);
  });
});
// #endregion

// #region Mini App section
describe("v3 SidebarNav [Mini App section]", () => {
  it("swaps to the Mini App items with a back link to the app dashboard", () => {
    usePathname.mockReturnValue(`${base}/mini-app/permissions`);
    renderSidebar();

    expect(link("Back")).toHaveAttribute("href", base);
    expect(screen.getByText("Mini App")).toBeInTheDocument();
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

  it("treats the legacy top-level /transactions route as the Mini App section", () => {
    usePathname.mockReturnValue(`${base}/transactions`);
    renderSidebar();
    expect(link("Back")).toBeInTheDocument();
    expect(isCurrent("Transactions")).toBe(true);
    expect(link("Transactions")).toHaveAttribute(
      "href",
      `${base}/mini-app/transactions`,
    );
  });
});
// #endregion

// #region World ID section
describe("v3 SidebarNav [World ID section]", () => {
  it("shows World ID 4.0 + Actions (no Legacy) for an app with an RP registration only", () => {
    usePathname.mockReturnValue(`${base}/world-id-4-0`);
    renderSidebar({ appId, hasRpRegistration: true, hasLegacyActions: false });

    expect(link("Back")).toHaveAttribute("href", base);
    expect(isCurrent("World ID 4.0")).toBe(true);
    expect(isCurrent("Actions")).toBe(false);
    expect(
      screen.queryByRole("link", { name: "World ID 3.0 Legacy" }),
    ).not.toBeInTheDocument();
  });

  it("shows only Legacy for an app with legacy actions but no RP registration", () => {
    usePathname.mockReturnValue(`${base}/actions`);
    renderSidebar({ appId, hasRpRegistration: false, hasLegacyActions: true });

    expect(isCurrent("World ID 3.0 Legacy")).toBe(true);
    expect(
      screen.queryByRole("link", { name: "World ID 4.0" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Actions" }),
    ).not.toBeInTheDocument();
  });

  it("falls back to the main nav when the app has neither RP registration nor legacy actions", () => {
    usePathname.mockReturnValue(`${base}/world-id-4-0`);
    renderSidebar({ appId, hasRpRegistration: false, hasLegacyActions: false });

    expect(link("Dashboard")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Back" }),
    ).not.toBeInTheDocument();
  });

  it("ignores flags published for a different app", () => {
    usePathname.mockReturnValue(`${base}/world-id-4-0`);
    renderSidebar({
      appId: "app_other",
      hasRpRegistration: true,
      hasLegacyActions: true,
    });

    // Stale flags from another app must not gate this app's section items.
    expect(link("Dashboard")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Back" }),
    ).not.toBeInTheDocument();
  });
});
// #endregion
