/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

const isV3 = jest.fn();
jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  isPortalV3ForSession: () => isV3(),
}));
jest.mock("@/scenes/Portal/Teams/TeamId/Team/layout", () => ({
  TeamLayout: (p: { children: React.ReactNode }) => (
    <div data-testid="v2-team-tabs">{p.children}</div>
  ),
}));

import TeamTabsLayout from "../../app/(portal)/teams/[teamId]/(team)/layout";

const call = () =>
  TeamTabsLayout({
    params: Promise.resolve({ teamId: "team_1" }),
    children: <div data-testid="body" />,
  });

beforeEach(() => jest.clearAllMocks());

it("renders children without v2 tabs for v3", async () => {
  isV3.mockResolvedValue(true);
  render(await call());
  expect(screen.getByTestId("body")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-team-tabs")).not.toBeInTheDocument();
});

it("renders the v2 team tabs otherwise", async () => {
  isV3.mockResolvedValue(false);
  render(await call());
  expect(screen.getByTestId("v2-team-tabs")).toBeInTheDocument();
});
