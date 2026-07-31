/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { createStore, Provider } from "jotai";
import React from "react";

// #region Mocks
const fetchApps = jest.fn();
jest.mock("@apollo/client/react", () => ({
  useQuery: (...args: unknown[]) => fetchApps(...args),
}));
jest.mock(
  "@/scenes/common/layout/AppSelector/graphql/client/fetch-apps.generated",
  () => ({
    FetchAppsDocument: {},
  }),
);

const mockOpenCreateAppDialog = jest.fn();
jest.mock("@/scenes/common/layout/CreateAppDialog/useCreateAppDialog", () => ({
  useCreateAppDialog: () => ({ open: mockOpenCreateAppDialog }),
}));

jest.mock("@/components/ui/popover", () => ({
  Popover: ({ children }: React.PropsWithChildren) => <>{children}</>,
  PopoverTrigger: ({ children }: React.PropsWithChildren) => <>{children}</>,
  PopoverContent: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
}));

jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({ user: { name: "Ada" } }),
}));

jest.mock("@/lib/utils", () => ({
  checkUserPermissions: () => true,
  cn: (...inputs: unknown[]) => inputs.filter(Boolean).join(" "),
}));

let mockParams: Record<string, string | undefined> = { teamId: "team_1" };
let mockPathname = "/teams/team_1";
jest.mock("next/navigation", () => ({
  useParams: () => mockParams,
  usePathname: () => mockPathname,
}));
// #endregion

import { AppsDropdown } from "@/scenes/PortalV3/layout/Shell/AppsDropdown";

const trigger = () => screen.getByRole("button", { name: "Switch app" });
const renderDropdown = (store = createStore()) =>
  render(
    <Provider store={store}>
      <AppsDropdown />
    </Provider>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = { teamId: "team_1" };
  mockPathname = "/teams/team_1";
});

it("disables the trigger while the apps query is loading", () => {
  fetchApps.mockReturnValue({
    data: undefined,
    loading: true,
    error: undefined,
  });

  renderDropdown();

  expect(trigger()).toBeDisabled();
});

it("disables the trigger on query errors without showing an empty state", () => {
  fetchApps.mockReturnValue({
    data: undefined,
    loading: false,
    error: new Error("network down"),
  });

  renderDropdown();

  expect(trigger()).toBeDisabled();
  expect(screen.queryByText("No apps, yet")).not.toBeInTheDocument();
});

it("enables the trigger with the default label after loading", () => {
  fetchApps.mockReturnValue({
    data: { app: [] },
    loading: false,
    error: undefined,
  });

  renderDropdown();

  expect(trigger()).toBeEnabled();
  expect(trigger()).toHaveTextContent("All apps");
  expect(trigger()).toHaveClass("h-9", "px-3");
});

it("shows the route app and offers explicit app and overview destinations", () => {
  mockParams = { teamId: "team_1", appId: "app_1" };
  fetchApps.mockReturnValue({
    data: { app: [{ id: "app_1", app_metadata: [{ name: "My App" }] }] },
    loading: false,
    error: undefined,
  });

  renderDropdown();

  expect(trigger()).toHaveTextContent("My App");
  const appLink = screen.getByRole("link", { name: /My App/ });
  expect(appLink).toHaveAttribute("href", "/teams/team_1/apps/app_1/world-id");
  expect(appLink).toHaveClass("cursor-pointer");
  expect(screen.getByRole("link", { name: "All apps" })).toHaveAttribute(
    "href",
    "/teams/team_1",
  );
});

it("uses the same deterministic app color in the trigger and app row", () => {
  mockParams = { teamId: "team_1", appId: "app_1" };
  fetchApps.mockReturnValue({
    data: { app: [{ id: "app_1", app_metadata: [{ name: "My App" }] }] },
    loading: false,
    error: undefined,
  });

  renderDropdown();

  const initials = screen.getAllByText("M");
  const backgroundClass = (initial: HTMLElement) =>
    initial.parentElement?.className
      .split(" ")
      .find((className) => className.startsWith("bg-"));

  expect(initials).toHaveLength(2);
  expect(backgroundClass(initials[0])).toBe(backgroundClass(initials[1]));
});

it("uses only the route app as context on team-scoped routes", () => {
  mockParams = { teamId: "team_1", appId: "app_1" };
  fetchApps.mockReturnValue({
    data: { app: [{ id: "app_1", app_metadata: [{ name: "My App" }] }] },
    loading: false,
    error: undefined,
  });

  const store = createStore();
  const view = renderDropdown(store);
  expect(trigger()).toHaveTextContent("My App");

  mockParams = { teamId: "team_1" };
  view.rerender(
    <Provider store={store}>
      <AppsDropdown />
    </Provider>,
  );

  expect(trigger()).toHaveTextContent("All apps");
  expect(screen.getByRole("link", { name: "All apps" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

it("hides the switcher and skips its app query on team settings", () => {
  mockPathname = "/teams/team_1/settings";
  fetchApps.mockReturnValue({
    data: undefined,
    loading: false,
    error: undefined,
  });

  renderDropdown();

  expect(
    screen.queryByRole("button", { name: "Switch app" }),
  ).not.toBeInTheDocument();
  expect(fetchApps).toHaveBeenCalledWith(
    {},
    expect.objectContaining({ skip: true }),
  );
});

it("filters all loaded apps without hiding the create action", () => {
  fetchApps.mockReturnValue({
    data: {
      app: [
        { id: "app_1", app_metadata: [{ name: "Alpha" }] },
        { id: "app_2", app_metadata: [{ name: "Beta App" }] },
        { id: "app_3", app_metadata: [{ name: "Gamma" }] },
      ],
    },
    loading: false,
    error: undefined,
  });
  renderDropdown();

  fireEvent.change(screen.getByRole("searchbox", { name: "Find an app" }), {
    target: { value: "BETA" },
  });

  expect(screen.getByRole("link", { name: /Beta App/ })).toBeVisible();
  expect(screen.queryByRole("link", { name: /Alpha/ })).not.toBeInTheDocument();
});

it("shows a no-results state when the app search has no matches", () => {
  fetchApps.mockReturnValue({
    data: {
      app: [{ id: "app_1", app_metadata: [{ name: "Alpha" }] }],
    },
    loading: false,
    error: undefined,
  });
  renderDropdown();

  fireEvent.change(screen.getByRole("searchbox", { name: "Find an app" }), {
    target: { value: "missing" },
  });

  expect(screen.getByText("No apps found")).toBeVisible();
});

it("scrolls only the app list and shows a footer shadow while more apps remain", () => {
  fetchApps.mockReturnValue({
    data: {
      app: Array.from({ length: 20 }, (_, index) => ({
        id: `app_${index}`,
        app_metadata: [{ name: `App ${index}` }],
      })),
    },
    loading: false,
    error: undefined,
  });
  renderDropdown();

  const appList = screen.getByTestId("app-switcher-list");
  const createAction = screen.getByRole("button", {
    name: "Create new app",
  });
  const footer = screen.getByTestId("app-switcher-footer");

  expect(appList).toHaveClass("overflow-y-auto", "no-scrollbar");
  expect(appList).not.toContainElement(createAction);
  expect(footer).toContainElement(createAction);

  Object.defineProperties(appList, {
    clientHeight: { configurable: true, value: 420 },
    scrollHeight: { configurable: true, value: 800 },
    scrollTop: { configurable: true, value: 0, writable: true },
  });

  fireEvent.scroll(appList);
  expect(footer.className).toContain("shadow-[");

  appList.scrollTop = 380;
  fireEvent.scroll(appList);
  expect(footer.className).not.toContain("shadow-[");
});

it("opens the shared create-app dialog from the create action", () => {
  fetchApps.mockReturnValue({
    data: { app: [] },
    loading: false,
    error: undefined,
  });
  renderDropdown();

  fireEvent.click(screen.getByRole("button", { name: "Create new app" }));

  expect(mockOpenCreateAppDialog).toHaveBeenCalledTimes(1);
});
