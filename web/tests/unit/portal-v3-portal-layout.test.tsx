/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

const getSession = jest.fn();
jest.mock("@/lib/auth0", () => ({ auth0: { getSession: () => getSession() } }));

// PortalLayout imports AutoTeamBootstrap (a client component pulling in
// @auth0/nextjs-auth0/client, an ESM-only package). Mock it out since this
// suite only exercises the has-team branch that renders PortalShell.
jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({ invalidate: jest.fn() }),
}));

// Stub the shell so we test only PortalLayout's session -> shell wiring.
jest.mock("@/scenes/PortalV3/layout/Shell", () => ({
  PortalShell: (props: {
    teams: { id: string }[];
    children: React.ReactNode;
  }) => (
    <div data-testid="shell" data-team-count={props.teams.length}>
      {props.children}
    </div>
  ),
}));

import { PortalLayout } from "@/scenes/PortalV3/layout";

beforeEach(() => jest.clearAllMocks());

it("mounts the shell with teams from the session", async () => {
  getSession.mockResolvedValue({
    user: {
      name: "Ada",
      email: "ada@example.com",
      hasura: { memberships: [{ team: { id: "team_1", name: "Acme" } }] },
    },
  });
  render(await PortalLayout({ children: <div data-testid="body" /> }));
  expect(screen.getByTestId("shell")).toHaveAttribute("data-team-count", "1");
  expect(screen.getByTestId("body")).toBeInTheDocument();
});
