/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

const pickPortalVersion = jest.fn();
jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: (...args: unknown[]) => pickPortalVersion(...args),
}));

jest.mock("@/scenes/Portal/Teams/TeamId/Team/page", () => ({
  TeamIdPage: () => <div data-testid="v2-team-root" />,
}));
jest.mock("@/scenes/PortalV3/Teams/TeamId/Team/page", () => ({
  TeamIdPage: () => <div data-testid="v3-team-root" />,
}));
import RoutePage from "../../app/(portal)/teams/[teamId]/(team)/page";

const props = () => ({
  params: Promise.resolve({ teamId: "team_1" }),
  searchParams: Promise.resolve({}),
});

beforeEach(() => jest.clearAllMocks());

it("renders the v3 team overview instead of redirecting", async () => {
  pickPortalVersion.mockImplementation(async (v3: () => unknown) => v3());
  render(await RoutePage(props()));

  expect(screen.getByTestId("v3-team-root")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-team-root")).not.toBeInTheDocument();
});

it("preserves the Portal V2 team page", async () => {
  pickPortalVersion.mockImplementation(
    async (_v3: () => unknown, v2: () => unknown) => v2(),
  );
  render(await RoutePage(props()));

  expect(screen.getByTestId("v2-team-root")).toBeInTheDocument();
  expect(screen.queryByTestId("v3-team-root")).not.toBeInTheDocument();
});
