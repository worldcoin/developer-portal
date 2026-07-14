/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
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

import { SidebarNav } from "@/scenes/PortalV3/layout/Shell/SidebarNav";
// #endregion

// #region Test Data
const teamId = "team_1";
const appId = "app_1";
const base = `/teams/${teamId}/apps/${appId}`;

const renderSidebar = () => render(<SidebarNav />);

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

// Mini App keeps its durable child routes.
// #region navigation hierarchy
describe("v3 SidebarNav [navigation hierarchy]", () => {
  it("leads with World ID (no Dashboard) and keeps Mini App children collapsed", () => {
    renderSidebar();
    expect(link("World ID")).toBeInTheDocument();
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
    expect(link("Mini App")).toHaveClass("bg-white");
    expect(isCurrent("Mini App")).toBe(false);
    expect(link("World ID")).toBeInTheDocument();
    expect(link("Permissions")).toHaveAttribute("aria-current", "page");
    expect(link("Transactions")).toBeInTheDocument();
    expect(link("Notifications")).toBeInTheDocument();
  });

  it("treats the legacy top-level /transactions route as the Mini App section", () => {
    usePathname.mockReturnValue(`${base}/transactions`);
    renderSidebar();
    expect(link("Mini App")).toHaveClass("bg-white");
    expect(isCurrent("Transactions")).toBe(true);
  });

  it("marks Notifications current on its Mini App route", () => {
    usePathname.mockReturnValue(`${base}/mini-app/notifications`);
    renderSidebar();
    expect(link("Mini App")).toHaveClass("bg-white");
    expect(isCurrent("Mini App")).toBe(false);
    expect(isCurrent("Notifications")).toBe(true);
  });

  it("marks World ID current on the new /world-id route with no sidebar sub-items", () => {
    usePathname.mockReturnValue(`${base}/world-id`);
    renderSidebar();
    expect(isCurrent("World ID")).toBe(true);
    expect(
      screen.queryByRole("link", { name: "World ID 4.0" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Actions" }),
    ).not.toBeInTheDocument();
  });

  it("keeps World ID current on legacy World ID routes", () => {
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
  it("routes World ID to the new /world-id landing for the selected app", () => {
    renderSidebar();
    expect(link("World ID")).toHaveAttribute("href", `${base}/world-id`);
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

  it("keeps World ID first, pointed at the apps list, and current there", () => {
    renderSidebar();
    expect(link("World ID")).toHaveAttribute("href", `/teams/${teamId}/apps`);
    expect(isCurrent("World ID")).toBe(true);
    expect(
      screen.queryByRole("link", { name: "Configuration" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Mini App" }),
    ).not.toBeInTheDocument();
  });
});
// #endregion

// Team-less links fall back to /teams.
// #region team-less pages
describe("v3 SidebarNav [team-less pages]", () => {
  beforeEach(() => {
    useParams.mockReturnValue({});
    useCurrentAppId.mockReturnValue(undefined);
    usePathname.mockReturnValue("/profile");
  });

  it("routes World ID to the /teams landing when the route has no teamId", () => {
    renderSidebar();
    expect(link("World ID")).toHaveAttribute("href", "/teams");
    expect(isCurrent("World ID")).toBe(false);
  });

  it("routes Team settings to the /teams landing rather than a dead link", () => {
    renderSidebar();
    expect(link("Team settings")).toHaveAttribute("href", "/teams");
  });
});
// #endregion
