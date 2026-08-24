/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

const getSession = jest.fn();
const fetchSandboxAccessRequest = jest.fn();
const fetchSandboxAccessRequestIos = jest.fn();
jest.mock("@/lib/auth0", () => ({ auth0: { getSession: () => getSession() } }));
jest.mock(
  "@/api/v2/sandbox-access-request/server/fetch-sandbox-access-request",
  () => ({
    fetchSandboxAccessRequest: (...args: unknown[]) =>
      fetchSandboxAccessRequest(...args),
  }),
);
jest.mock(
  "@/api/v2/sandbox-access-request-ios/server/fetch-sandbox-access-request-ios",
  () => ({
    fetchSandboxAccessRequestIos: (...args: unknown[]) =>
      fetchSandboxAccessRequestIos(...args),
  }),
);
jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
jest.mock("next/headers", () => ({
  headers: async () => ({ get: () => "/profile" }),
}));

// Stub the shell so we test only PortalLayout's session -> shell wiring.
jest.mock("@/scenes/PortalV3/layout/Shell", () => ({
  PortalShell: (props: {
    user: { name?: string | null };
    teams: { id: string }[];
    apiKeyTeamIds: string[];
    sandboxRequestAndroid: { email: string } | null;
    sandboxRequestIos: { ascEmail: string } | null;
    children: React.ReactNode;
  }) => (
    <div
      data-testid="shell"
      data-team-count={props.teams.length}
      data-api-key-team-ids={props.apiKeyTeamIds.join(",")}
      data-sandbox-email={props.sandboxRequestAndroid?.email}
      data-sandbox-ios-email={props.sandboxRequestIos?.ascEmail}
      data-user-name={props.user.name}
    >
      {props.children}
    </div>
  ),
}));

import { PortalLayout } from "@/scenes/PortalV3/layout";

beforeEach(() => {
  jest.clearAllMocks();
  fetchSandboxAccessRequest.mockResolvedValue(null);
  fetchSandboxAccessRequestIos.mockResolvedValue(null);
});

it("hydrates the user's iOS sandbox request into the shell", async () => {
  getSession.mockResolvedValue({
    user: {
      sub: "auth0|ada",
      name: "Ada",
      email: "ada@example.com",
      hasura: { id: "usr_abc123", memberships: [] },
    },
  });
  fetchSandboxAccessRequestIos.mockResolvedValue({
    ascEmail: "apple@example.com",
    status: "pending",
    createdAt: "2026-08-21T00:00:00Z",
    updatedAt: "2026-08-21T00:00:00Z",
  });

  render(await PortalLayout({ children: null }));

  expect(fetchSandboxAccessRequestIos).toHaveBeenCalledWith("usr_abc123");
  expect(screen.getByTestId("shell")).toHaveAttribute(
    "data-sandbox-ios-email",
    "apple@example.com",
  );
});

it("mounts the shell with teams from the session", async () => {
  getSession.mockResolvedValue({
    user: {
      sub: "auth0|ada",
      name: "Ada",
      email: "ada@example.com",
      hasura: {
        memberships: [
          { role: "OWNER", team: { id: "team_1", name: "Acme" } },
          { role: "MEMBER", team: { id: "team_2", name: "Other" } },
        ],
      },
    },
  });
  render(await PortalLayout({ children: <div data-testid="body" /> }));
  expect(screen.getByTestId("shell")).toHaveAttribute("data-team-count", "2");
  expect(screen.getByTestId("shell")).toHaveAttribute(
    "data-api-key-team-ids",
    "team_1",
  );
  expect(screen.getByTestId("body")).toBeInTheDocument();
});

it("hydrates the user's sandbox request into the shell", async () => {
  getSession.mockResolvedValue({
    user: {
      sub: "auth0|ada",
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

it("keeps the Android state when iOS request hydration fails", async () => {
  getSession.mockResolvedValue({
    user: {
      sub: "auth0|ada",
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
  fetchSandboxAccessRequestIos.mockRejectedValue(new Error("hasura down"));

  render(await PortalLayout({ children: null }));

  expect(screen.getByTestId("shell")).toHaveAttribute(
    "data-sandbox-email",
    "tester@gmail.com",
  );
  expect(screen.getByTestId("shell")).not.toHaveAttribute(
    "data-sandbox-ios-email",
  );
});

it("labels World ID sessions without exposing their nullifier-like name", async () => {
  getSession.mockResolvedValue({
    user: {
      sub: "oauth2|worldcoin|0xabc123",
      name: "0xabc123",
      hasura: { id: "usr_world_id", memberships: [] },
    },
  });

  render(await PortalLayout({ children: null }));

  expect(screen.getByTestId("shell")).toHaveAttribute(
    "data-user-name",
    "Anonymous user",
  );
});
