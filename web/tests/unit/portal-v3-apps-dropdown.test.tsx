/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

// Control the apps query result per test.
const fetchApps = jest.fn();
jest.mock("@apollo/client/react", () => ({
  useQuery: () => fetchApps(),
}));
jest.mock("@/scenes/common/apps/graphql/client/fetch-apps.generated", () => ({
  FetchAppsDocument: {},
}));

// The create-app dialog pulls in a heavy subtree; stub it.
jest.mock("@/scenes/Portal/layout/CreateAppDialog/index-v4", () => ({
  CreateAppDialogV4: () => null,
}));

jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({ user: { name: "Ada" } }),
}));

// canCreateApp = true so the empty state renders the "Create app" button —
// that makes "renders nothing while loading/errored" a meaningful assertion.
// AppsDropdown only uses checkUserPermissions from this module, so mock just
// that (loading real utils.ts pulls in idkit/ox, which needs TextEncoder).
jest.mock("@/lib/utils", () => ({
  checkUserPermissions: () => true,
}));

const push = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useParams: () => ({ teamId: "team_1" }),
}));

import { AppsDropdown } from "@/scenes/PortalV3/layout/Shell/AppsDropdown";

beforeEach(() => jest.clearAllMocks());

it("renders nothing while the apps query is loading", () => {
  fetchApps.mockReturnValue({
    data: undefined,
    loading: true,
    error: undefined,
  });
  const { container } = render(<AppsDropdown />);
  expect(container).toBeEmptyDOMElement();
});

it("renders nothing when the apps query errors (no misleading empty state)", () => {
  fetchApps.mockReturnValue({
    data: undefined,
    loading: false,
    error: new Error("network down"),
  });
  const { container } = render(<AppsDropdown />);
  expect(container).toBeEmptyDOMElement();
  expect(screen.queryByText("No apps")).not.toBeInTheDocument();
  expect(screen.queryByText("Create app")).not.toBeInTheDocument();
});

it("shows the empty state only once data has loaded and is empty", () => {
  fetchApps.mockReturnValue({
    data: { app: [] },
    loading: false,
    error: undefined,
  });
  render(<AppsDropdown />);
  expect(screen.getByText("Create app")).toBeInTheDocument();
});

it("renders the dropdown trigger once apps load", () => {
  fetchApps.mockReturnValue({
    data: { app: [{ id: "app_1", app_metadata: [{ name: "My App" }] }] },
    loading: false,
    error: undefined,
  });
  render(<AppsDropdown />);
  expect(screen.getByText("Select app")).toBeInTheDocument();
});
