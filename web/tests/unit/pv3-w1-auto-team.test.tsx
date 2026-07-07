/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";

const invalidate = jest.fn().mockResolvedValue(undefined);
jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({ invalidate }),
}));
const push = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
jest.mock("posthog-js", () => ({ capture: jest.fn() }));

import { AutoTeamBootstrap } from "@/scenes/PortalV3/layout/AutoTeamBootstrap";

beforeEach(() => {
  jest.clearAllMocks();
});

it("creates team then invalidates session and redirects", async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ returnTo: "/teams/team_9" }),
  }) as never;
  render(<AutoTeamBootstrap defaultName="Soam's team" hasUser={false} />);
  await waitFor(() => expect(push).toHaveBeenCalledWith("/teams/team_9"));
  expect(global.fetch).toHaveBeenCalledWith(
    "/api/create-team",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ team_name: "Soam's team", hasUser: false }),
    }),
  );
  expect(invalidate).toHaveBeenCalled(); // session refreshed BEFORE navigation
});

it("failure → loud error card with manual escape hatch, no redirect", async () => {
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
  expect(push).not.toHaveBeenCalled();
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
  await waitFor(() => expect(push).toHaveBeenCalled());
  expect(global.fetch).toHaveBeenCalledTimes(1);
});

it("network failure (fetch rejects) → error card, no redirect", async () => {
  global.fetch = jest
    .fn()
    .mockRejectedValue(new Error("network down")) as never;
  render(<AutoTeamBootstrap defaultName="T" hasUser={false} />);
  await waitFor(() =>
    expect(screen.getByText(/couldn.t set up your workspace/i)).toBeTruthy(),
  );
  expect(push).not.toHaveBeenCalled();
});

it("lost race (create fails but a concurrent attempt made the team) → recovers to the app, no error card", async () => {
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
  await waitFor(() => expect(push).toHaveBeenCalledWith("/teams/team_9/apps"));
  expect(invalidate).toHaveBeenCalled();
  expect(
    screen.queryByText(/couldn.t set up your workspace/i),
  ).not.toBeInTheDocument();
});
