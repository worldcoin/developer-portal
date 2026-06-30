/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

const getSession = jest.fn();
jest.mock("@/lib/auth0", () => ({ auth0: { getSession: () => getSession() } }));

const redirectMock = jest.fn((url: string) => {
  throw new Error("REDIRECT:" + url);
});
jest.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
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

it("redirects to login when there is no session", async () => {
  getSession.mockResolvedValue(null);
  await expect(PortalLayout({ children: null })).rejects.toThrow(/REDIRECT/);
  expect(redirectMock).toHaveBeenCalledTimes(1);
});
