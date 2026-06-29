/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import React from "react";

const getSession = jest.fn();
jest.mock("@/lib/auth0", () => ({ auth0: { getSession: () => getSession() } }));

const redirectMock = jest.fn((url: string) => {
  throw new Error("REDIRECT:" + url);
});
jest.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
}));

// Mock the leaf children so we test only V3Shell's data-shaping + wiring.
jest.mock("@/scenes/PortalV3/Shell/ShellFrame", () => ({
  ShellFrame: (props: {
    user?: { name: string } | null;
    topSlot?: React.ReactNode;
    children?: React.ReactNode;
  }) => (
    <div
      data-testid="shell-frame"
      data-has-topslot={props.topSlot ? "yes" : "no"}
      data-user={props.user?.name ?? "none"}
    >
      {props.children}
    </div>
  ),
}));
jest.mock("@/scenes/PortalV3/Shell/TeamSwitcher", () => ({
  TeamSwitcher: () => <div data-testid="team-switcher" />,
}));
jest.mock("@/scenes/PortalV3/Shell/SidebarNav", () => ({
  SidebarNav: () => <div data-testid="sidebar-nav" />,
}));
jest.mock("@/scenes/PortalV3/Shell/AppSwitcherContainer", () => ({
  AppSwitcherContainer: () => <div data-testid="app-switcher" />,
}));
// Role_Enum lives in @/graphql/graphql, which pulls the GraphQL stack (needs
// TextEncoder, absent in jsdom). Stub it + the pure permission helper — the
// shell wiring under test doesn't depend on their real values (SidebarNav is mocked).
jest.mock("@/graphql/graphql", () => ({
  Role_Enum: { Owner: "OWNER", Admin: "ADMIN", Member: "MEMBER" },
}));
jest.mock("@/lib/utils", () => ({ checkUserPermissions: () => true }));

import { V3Shell } from "@/scenes/PortalV3/Shell";

const sessionWithTeams = (teams: Array<{ id: string; name: string }>) => ({
  user: {
    name: "Ada",
    email: "ada@example.com",
    hasura: { memberships: teams.map((team) => ({ team })) },
  },
});

beforeEach(() => jest.clearAllMocks());

describe("V3Shell", () => {
  it("redirects to login when there is no session", async () => {
    getSession.mockResolvedValue(null);
    await expect(V3Shell({ teamId: "team_1", children: null })).rejects.toThrow(
      /REDIRECT/,
    );
    expect(redirectMock).toHaveBeenCalledTimes(1);
  });

  it("mounts the shell + team switcher when teamId matches a membership", async () => {
    getSession.mockResolvedValue(
      sessionWithTeams([{ id: "team_1", name: "Acme" }]),
    );
    const element = await V3Shell({
      teamId: "team_1",
      children: <div data-testid="body">body</div>,
    });
    const { getByTestId } = render(element);
    expect(getByTestId("shell-frame")).toHaveAttribute(
      "data-has-topslot",
      "yes",
    );
    expect(getByTestId("shell-frame")).toHaveAttribute("data-user", "Ada");
    expect(getByTestId("body")).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("omits the team switcher when no membership matches the teamId", async () => {
    getSession.mockResolvedValue(
      sessionWithTeams([{ id: "other_team", name: "Other" }]),
    );
    const element = await V3Shell({ teamId: "team_1", children: null });
    const { getByTestId } = render(element);
    expect(getByTestId("shell-frame")).toHaveAttribute(
      "data-has-topslot",
      "no",
    );
  });
});
