/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

const isV3 = jest.fn();
jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  isPortalV3ForSession: () => isV3(),
}));
jest.mock("@/scenes/PortalV3/layout", () => ({
  PortalLayout: (p: { variant?: string; children: React.ReactNode }) => (
    <div data-testid="v3-shell" data-variant={p.variant}>
      {p.children}
    </div>
  ),
}));
jest.mock("@/scenes/Portal/Teams/TeamId/layout", () => ({
  TeamIdLayout: (p: { children: React.ReactNode }) => (
    <div data-testid="v2-team">{p.children}</div>
  ),
}));

import TeamRouteLayout from "../../app/(portal)/teams/[teamId]/layout";

const call = () =>
  TeamRouteLayout({
    params: Promise.resolve({ teamId: "team_1" }),
    children: <div data-testid="body" />,
  });

beforeEach(() => jest.clearAllMocks());

it("mounts the v3 shell (variant=app) for v3", async () => {
  isV3.mockResolvedValue(true);
  render(await call());
  expect(screen.getByTestId("v3-shell")).toHaveAttribute("data-variant", "app");
  expect(screen.getByTestId("body")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-team")).not.toBeInTheDocument();
});

it("renders the v2 team layout otherwise", async () => {
  isV3.mockResolvedValue(false);
  render(await call());
  expect(screen.getByTestId("v2-team")).toBeInTheDocument();
});
