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

// Mini App exposes its three durable child routes under the parent entry while
// leaving the rest of the app navigation in place.
// #region navigation hierarchy
describe("v3 SidebarNav [navigation hierarchy]", () => {
  it("keeps Mini App children collapsed outside the Mini App section", () => {
    renderSidebar();
    expect(link("Dashboard")).toBeInTheDocument();
    expect(link("World ID")).toBeInTheDocument();
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

  it("marks Dashboard current on the app root", () => {
    renderSidebar();
    expect(isCurrent("Dashboard")).toBe(true);
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
    expect(link("Dashboard")).toBeInTheDocument();
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

  it("marks World ID current on a world-id route with no sidebar sub-items", () => {
    usePathname.mockReturnValue(`${base}/world-id-4-0`);
    renderSidebar({ appId, hasRpRegistration: true, hasLegacyActions: false });
    expect(isCurrent("World ID")).toBe(true);
    expect(
      screen.queryByRole("link", { name: "World ID 4.0" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Actions" }),
    ).not.toBeInTheDocument();
  });
});
// #endregion

// Team-less pages (e.g. /profile) carry no teamId in the URL. Team-scoped links
// must still go somewhere real — the /teams landing route, which resolves the
// user's team server-side — instead of a dead "#".
// #region team-less pages
describe("v3 SidebarNav [team-less pages]", () => {
  beforeEach(() => {
    // /profile: no teamId/appId anywhere in the URL, no app context.
    useParams.mockReturnValue({});
    useCurrentAppId.mockReturnValue(undefined);
    usePathname.mockReturnValue("/profile");
  });

  it("routes Dashboard to the /teams landing when the route has no teamId", () => {
    renderSidebar();
    expect(link("Dashboard")).toHaveAttribute("href", "/teams");
    // ...but it is not the current page while we are on /profile.
    expect(isCurrent("Dashboard")).toBe(false);
  });

  it("routes Team settings to the /teams landing rather than a dead link", () => {
    renderSidebar();
    expect(link("Team settings")).toHaveAttribute("href", "/teams");
  });
});
// #endregion

// #region World ID href routing
describe("v3 SidebarNav [World ID routing]", () => {
  it("routes World ID to /world-id-4-0 for an app with an RP registration", () => {
    renderSidebar({ appId, hasRpRegistration: true, hasLegacyActions: false });
    expect(link("World ID")).toHaveAttribute("href", `${base}/world-id-4-0`);
  });

  it("routes World ID to /actions for a legacy-actions-only app (no RP registration)", () => {
    renderSidebar({ appId, hasRpRegistration: false, hasLegacyActions: true });
    expect(link("World ID")).toHaveAttribute("href", `${base}/actions`);
  });

  it("defaults World ID to /world-id-4-0 before any flags sync", () => {
    renderSidebar();
    expect(link("World ID")).toHaveAttribute("href", `${base}/world-id-4-0`);
  });

  it("ignores flags published for a different app", () => {
    renderSidebar({
      appId: "app_other",
      hasRpRegistration: false,
      hasLegacyActions: true,
    });
    // Stale flags from another app must not change this app's World ID href.
    expect(link("World ID")).toHaveAttribute("href", `${base}/world-id-4-0`);
  });
});
// #endregion
