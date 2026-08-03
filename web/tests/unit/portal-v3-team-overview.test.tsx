/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

// #region Mocks
const getSession = jest.fn();
jest.mock("@/lib/auth0", () => ({
  auth0: { getSession: (...args: unknown[]) => getSession(...args) },
}));

jest.mock(
  "@/graphql/graphql",
  () => ({
    Role_Enum: { Owner: "OWNER" },
  }),
  { virtual: true },
);

jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({}),
}));

const InitialApp = jest.fn();
jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/page/graphql/server/apps.generated",
  () => ({
    getSdk: () => ({ InitialApp }),
  }),
);

jest.mock("@/components/SizingWrapper", () => ({
  SizingWrapper: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("@/components/Unauthorized", () => ({
  Unauthorized: () => <div data-testid="unauthorized" />,
}));
jest.mock("@/scenes/PortalV3/Teams/TeamId/Apps/page/AppsPageClient", () => ({
  AppsPageClient: (props: { initialIsOwner?: boolean }) => (
    <div
      data-testid="empty-app-actions"
      data-owner={String(props.initialIsOwner)}
    />
  ),
}));
jest.mock("@/scenes/PortalV3/Teams/TeamId/Team/page/Apps", () => ({
  Apps: () => <div data-testid="apps-grid" />,
}));
// #endregion

import { TeamIdPage } from "@/scenes/PortalV3/Teams/TeamId/Team/page";

// #region Test Data
const props = {
  params: { teamId: "team_1" },
  searchParams: {},
};

const sessionWithTeam = (role = "OWNER") => ({
  user: {
    hasura: {
      memberships: [{ role, team: { id: "team_1" } }],
    },
  },
});
// #endregion

beforeEach(() => jest.clearAllMocks());

// #region Canonical overview states
describe("Portal V3 team overview", () => {
  it("shows the existing action cards before the team has an app", async () => {
    getSession.mockResolvedValue(sessionWithTeam());
    InitialApp.mockResolvedValue({ app: [] });

    render(await TeamIdPage(props));

    expect(screen.getByTestId("empty-app-actions")).toHaveAttribute(
      "data-owner",
      "true",
    );
    expect(screen.queryByTestId("apps-grid")).not.toBeInTheDocument();
  });

  it("shows the apps grid once the team has an app", async () => {
    getSession.mockResolvedValue(sessionWithTeam());
    InitialApp.mockResolvedValue({ app: [{ id: "app_1" }] });

    render(await TeamIdPage(props));

    expect(screen.getByTestId("apps-grid")).toBeInTheDocument();
    expect(screen.queryByTestId("empty-app-actions")).not.toBeInTheDocument();
  });

  it("does not query apps for a team outside the current memberships", async () => {
    getSession.mockResolvedValue(sessionWithTeam());

    render(
      await TeamIdPage({
        params: { teamId: "team_foreign" },
        searchParams: {},
      }),
    );

    expect(screen.getByTestId("unauthorized")).toBeInTheDocument();
    expect(InitialApp).not.toHaveBeenCalled();
  });
});
// #endregion
