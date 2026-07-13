/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

// Control the apps query result per test.
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

// The create-app dialog pulls in a heavy subtree; stub it.
jest.mock("@/scenes/PortalV3/layout/CreateAppDialog/index-v4", () => ({
  CreateAppDialogV4: () => null,
}));

jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({ user: { name: "Ada" } }),
}));

// AppsDropdown only uses checkUserPermissions from this module, so mock just
// that (loading real utils.ts pulls in idkit/ox, which needs TextEncoder).
jest.mock("@/lib/utils", () => ({
  checkUserPermissions: () => true,
}));

const push = jest.fn();
// Mutable so a test can put an appId in the route (mock-prefixed name is
// required for jest to allow the reference inside the factory).
let mockParams: Record<string, string | undefined> = { teamId: "team_1" };
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useParams: () => mockParams,
}));

import { AppsDropdown } from "@/scenes/PortalV3/layout/Shell/AppsDropdown";

// The trigger is the only <button> in the closed dropdown (menu items are
// role="menuitem"), so this uniquely selects it without an accessible name.
const trigger = () => screen.getByRole("button");

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = { teamId: "team_1" };
});

// While the query is in flight the trigger is disabled — the dropdown never
// flashes content before the app list is known.
it("disables the trigger while the apps query is loading", () => {
  fetchApps.mockReturnValue({
    data: undefined,
    loading: true,
    error: undefined,
  });
  render(<AppsDropdown />);
  expect(trigger()).toBeDisabled();
});

// On error the trigger is disabled and no empty-state ("No apps, yet") leaks —
// we don't present a misleading empty result when the query actually failed.
it("disables the trigger when the apps query errors (no misleading empty state)", () => {
  fetchApps.mockReturnValue({
    data: undefined,
    loading: false,
    error: new Error("network down"),
  });
  render(<AppsDropdown />);
  expect(trigger()).toBeDisabled();
  expect(screen.queryByText("No apps, yet")).not.toBeInTheDocument();
});

// Once data resolves the trigger is interactive and shows the default
// all-projects label (no specific app selected).
it("enables the trigger with the default label once data has loaded", () => {
  fetchApps.mockReturnValue({
    data: { app: [] },
    loading: false,
    error: undefined,
  });
  render(<AppsDropdown />);
  expect(trigger()).toBeEnabled();
  expect(trigger()).toHaveTextContent("All projects");
});

// When the route points at an app, the trigger reflects that app's name
// instead of the default label.
it("shows the current app in the trigger when one is selected", () => {
  mockParams = { teamId: "team_1", appId: "app_1" };
  fetchApps.mockReturnValue({
    data: { app: [{ id: "app_1", app_metadata: [{ name: "My App" }] }] },
    loading: false,
    error: undefined,
  });
  render(<AppsDropdown />);
  expect(trigger()).toHaveTextContent("My App");
});
