/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

const getSession = jest.fn();
const fetchSandboxAccessRequest = jest.fn();
jest.mock("@/lib/auth0", () => ({ auth0: { getSession: () => getSession() } }));
jest.mock(
  "@/api/v2/sandbox-access-request/server/fetch-sandbox-access-request",
  () => ({
    fetchSandboxAccessRequest: (...args: unknown[]) =>
      fetchSandboxAccessRequest(...args),
  }),
);
jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// Stub the shell so we test only PortalLayout's session -> shell wiring.
jest.mock("@/scenes/PortalV3/layout/Shell", () => ({
  PortalShell: (props: {
    teams: { id: string }[];
    sandboxRequest: { email: string } | null;
    children: React.ReactNode;
  }) => (
    <div
      data-testid="shell"
      data-team-count={props.teams.length}
      data-sandbox-email={props.sandboxRequest?.email}
    >
      {props.children}
    </div>
  ),
}));

import { PortalLayout } from "@/scenes/PortalV3/layout";

beforeEach(() => {
  jest.clearAllMocks();
  fetchSandboxAccessRequest.mockResolvedValue(null);
});

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

it("hydrates the user's sandbox request into the shell", async () => {
  getSession.mockResolvedValue({
    user: {
      name: "Ada",
      email: "ada@example.com",
      hasura: { id: "usr_abc123", memberships: [] },
    },
  });
  fetchSandboxAccessRequest.mockResolvedValue({
    email: "tester@gmail.com",
    accepted: false,
    createdAt: "2026-07-23T00:00:00Z",
  });

  render(await PortalLayout({ children: null }));

  expect(fetchSandboxAccessRequest).toHaveBeenCalledWith("usr_abc123");
  expect(screen.getByTestId("shell")).toHaveAttribute(
    "data-sandbox-email",
    "tester@gmail.com",
  );
});
