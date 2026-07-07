/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";

const invalidate = jest.fn().mockResolvedValue(undefined);
jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({ invalidate }),
}));
jest.mock("posthog-js", () => ({ capture: jest.fn() }));

// The component hard-navigates via window.location.assign (see AutoTeamBootstrap
// for why it isn't router.push). Replace location so we can assert on it.
const assign = jest.fn();
beforeAll(() => {
  Object.defineProperty(window, "location", {
    value: { assign, href: "http://localhost/create-team" },
    writable: true,
    configurable: true,
  });
});

import { AutoTeamBootstrap } from "@/scenes/PortalV3/layout/AutoTeamBootstrap";

beforeEach(() => {
  jest.clearAllMocks();
});

it("creates team, then hard-navigates to the returned workspace", async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ returnTo: "/teams/team_9/apps/" }),
  }) as never;
  render(<AutoTeamBootstrap defaultName="Soam's team" hasUser={false} />);
  await waitFor(() =>
    expect(assign).toHaveBeenCalledWith("/teams/team_9/apps/"),
  );
  expect(global.fetch).toHaveBeenCalledWith(
    "/api/create-team",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ team_name: "Soam's team", hasUser: false }),
    }),
  );
});

it("failure with no recoverable team → loud error card with manual escape hatch, no navigation", async () => {
  // Every fetch (create-team AND the recovery profile probe) fails.
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    json: async () => ({ code: "x", detail: "boom" }),
  }) as never;
  render(<AutoTeamBootstrap defaultName="Soam's team" hasUser={false} />);
  await waitFor(() =>
    expect(screen.getByText(/couldn.t set up your workspace/i)).toBeTruthy(),
  );
  expect(
    screen
      .getByText(/set up your team manually/i)
      .closest("a")
      ?.getAttribute("href"),
  ).toBe("/create-team");
  expect(assign).not.toHaveBeenCalled();
});

it("posts exactly once under StrictMode double-effect", async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ returnTo: "/t" }),
  }) as never;
  render(
    <StrictMode>
      <AutoTeamBootstrap defaultName="T" hasUser={false} />
    </StrictMode>,
  );
  await waitFor(() => expect(assign).toHaveBeenCalled());
  expect(global.fetch).toHaveBeenCalledTimes(1);
});

it("network failure (fetch rejects) with no recoverable team → error card, no navigation", async () => {
  global.fetch = jest
    .fn()
    .mockRejectedValue(new Error("network down")) as never;
  render(<AutoTeamBootstrap defaultName="T" hasUser={false} />);
  await waitFor(() =>
    expect(screen.getByText(/couldn.t set up your workspace/i)).toBeTruthy(),
  );
  expect(assign).not.toHaveBeenCalled();
});

it("lost create race (create fails but the team already exists) → recovers into the team, no error card", async () => {
  global.fetch = jest.fn(async (url: string) => {
    if (url === "/api/create-team") {
      return {
        ok: false,
        json: async () => ({ code: "server_error", detail: "duplicate" }),
      };
    }
    if (url === "/api/auth/profile") {
      return {
        ok: true,
        json: async () => ({
          hasura: {
            memberships: [{ role: "OWNER", team: { id: "team_9", name: "T" } }],
          },
        }),
      };
    }
    throw new Error(`unexpected fetch: ${url}`);
  }) as never;
  render(<AutoTeamBootstrap defaultName="T" hasUser={false} />);
  await waitFor(() =>
    expect(assign).toHaveBeenCalledWith("/teams/team_9/apps"),
  );
  expect(invalidate).toHaveBeenCalled();
  expect(
    screen.queryByText(/couldn.t set up your workspace/i),
  ).not.toBeInTheDocument();
});
