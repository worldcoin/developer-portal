/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({
    user: {
      hasura: { memberships: [{ team: { id: "team_1" }, role: "OWNER" }] },
    },
  }),
}));
const useParams = jest.fn();
const usePathname = jest.fn(() => "/teams/team_1/apps/app_1");
jest.mock("next/navigation", () => ({
  useParams: () => useParams(),
  usePathname: () => usePathname(),
}));
jest.mock("@/scenes/PortalV3/layout/Shell/AppsDropdown", () => ({
  useCurrentAppId: () => "app_1",
  AppsDropdown: () => null,
}));
// SidebarNav only uses checkUserPermissions from this module, so mock just
// that (loading real utils.ts pulls in idkit/ox, which needs TextEncoder —
// see the same pattern in portal-v3-apps-dropdown.test.tsx).
jest.mock("@/lib/utils", () => ({
  checkUserPermissions: () => true,
}));
const useAppCapabilities = jest.fn();
jest.mock("@/scenes/PortalV3/layout/Shell/use-app-capabilities", () => ({
  useAppCapabilities: (...a: unknown[]) => useAppCapabilities(...a),
}));
import { SidebarNav } from "@/scenes/PortalV3/layout/Shell/SidebarNav";

beforeEach(() => {
  jest.clearAllMocks();
  useParams.mockReturnValue({ teamId: "team_1" });
});
const caps = (
  o: Partial<{
    isMiniApp: boolean;
    hasLegacyActions: boolean;
    loaded: boolean;
  }>,
) =>
  useAppCapabilities.mockReturnValue({
    isMiniApp: false,
    hasLegacyActions: false,
    loaded: true,
    ...o,
  });

it("integrator app: core items present, Mini App & Legacy & World ID absent", () => {
  caps({});
  render(<SidebarNav />);
  for (const label of [
    "Dashboard",
    "Actions",
    "Sign in",
    "Configuration",
    "Advanced",
  ])
    expect(screen.getByText(label)).toBeTruthy();
  expect(screen.queryByText("Mini App")).toBeNull();
  expect(screen.queryByText("Legacy actions")).toBeNull();
  expect(screen.queryByText("World ID")).toBeNull();
});
it("mini-app: Mini App item appears", () => {
  caps({ isMiniApp: true });
  render(<SidebarNav />);
  expect(screen.getByText("Mini App")).toBeTruthy();
});
it("legacy actions exist: Legacy actions appears, href is legacy route", () => {
  caps({ hasLegacyActions: true });
  render(<SidebarNav />);
  expect(
    screen.getByText("Legacy actions").closest("a")?.getAttribute("href"),
  ).toBe("/teams/team_1/apps/app_1/actions");
});
it("capabilities not loaded: conditional items hidden (no flicker)", () => {
  caps({ isMiniApp: true, hasLegacyActions: true, loaded: false });
  render(<SidebarNav />);
  expect(screen.queryByText("Mini App")).toBeNull();
  expect(screen.queryByText("Legacy actions")).toBeNull();
});
it("Actions href points at world-id-actions", () => {
  caps({});
  render(<SidebarNav />);
  expect(screen.getByText("Actions").closest("a")?.getAttribute("href")).toBe(
    "/teams/team_1/apps/app_1/world-id-actions",
  );
});
