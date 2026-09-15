/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import React from "react";

// #region Mocks
jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const teamId = "team_0b1509aa95ebcd6d96fd71221166cfc3";
const appId = "app_9cdd0a714aec9ed17dca660bc9ffe72a";
jest.mock("next/navigation", () => ({
  useParams: () => ({ teamId, appId }),
}));

const useQueryMock = jest.fn();
jest.mock("@apollo/client/react", () => ({
  useQuery: (...args: unknown[]) => useQueryMock(...args),
}));

const checkUserPermissions = jest.fn(() => true);
jest.mock("@/lib/utils", () => ({
  checkUserPermissions: (...args: unknown[]) => checkUserPermissions(),
  truncateString: (value?: string) => value ?? "",
}));

jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({ user: { sub: "user_1" } }),
}));

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/Danger/DeleteModal",
  () => ({
    DeleteModal: (props: { openDeleteModal: boolean }) =>
      props.openDeleteModal ? <div data-testid="delete-modal" /> : null,
  }),
);

import { DangerZoneDisclosure } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/Danger/DangerZoneDisclosure";
import { AppDangerZonePage } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/Danger/page";
// #endregion

const renderDisclosure = () =>
  render(
    <DangerZoneDisclosure
      appId="app_1"
      teamId="team_1"
      appName="Sign In App"
    />,
  );

beforeEach(() => {
  jest.clearAllMocks();
  checkUserPermissions.mockReturnValue(true);
  useQueryMock.mockReturnValue({
    data: { app: [{ app_metadata: [{ name: "na" }] }] },
    loading: false,
    error: undefined,
  });
});

// #region collapsed dropdown
describe("v3 DangerZoneDisclosure", () => {
  it("keeps the delete card inside a collapsed dropdown", () => {
    const { container } = renderDisclosure();
    const details = container.querySelector("details") as HTMLDetailsElement;

    expect(details.open).toBe(false);
    expect(within(details).getByText("Danger zone")).toBeInTheDocument();
    expect(within(details).getByText(/Permanently delete/)).toHaveTextContent(
      "Sign In App",
    );
    expect(
      within(details).getByRole("button", { name: "Delete app" }),
    ).toBeInTheDocument();
  });

  it("replaces the delete action with a note for non-owners", () => {
    checkUserPermissions.mockReturnValue(false);
    renderDisclosure();

    expect(
      screen.getByText("Only a team owner can delete this app."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete app" }),
    ).not.toBeInTheDocument();
  });
});
// #endregion

// #region Danger zone destination
describe("v3 Configuration [danger zone]", () => {
  it("keeps destructive settings on a dedicated page with a path back", () => {
    render(<AppDangerZonePage params={{ teamId, appId }} />);

    expect(
      screen.getByRole("heading", { name: "Danger zone" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to configuration" }),
    ).toHaveAttribute("href", `/teams/${teamId}/apps/${appId}/configuration`);
    expect(screen.getByText(/Permanently delete/)).toHaveTextContent("na");
    expect(
      screen.getByRole("button", { name: "Delete app" }),
    ).toBeInTheDocument();
  });
});
// #endregion
