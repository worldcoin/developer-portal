/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

const isV3 = jest.fn();
jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  isPortalV3ForSession: () => isV3(),
}));
jest.mock("@/scenes/PortalV3/Teams/TeamId/Apps/AppId/layout", () => ({
  AppIdLayout: (p: { children: React.ReactNode }) => (
    <div data-testid="v3-app">{p.children}</div>
  ),
}));
jest.mock("@/scenes/Portal/Teams/TeamId/Apps/AppId/layout", () => ({
  AppIdLayout: (p: { children: React.ReactNode }) => (
    <div data-testid="v2-app">{p.children}</div>
  ),
}));

import AppRouteLayout from "../../app/(portal)/teams/[teamId]/apps/[appId]/layout";

const call = () =>
  AppRouteLayout({
    params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
    children: <div data-testid="body" />,
  });

beforeEach(() => jest.clearAllMocks());

it("renders the v3 app guard for v3", async () => {
  isV3.mockResolvedValue(true);
  render(await call());
  expect(screen.getByTestId("v3-app")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-app")).not.toBeInTheDocument();
});

it("renders the v2 app layout otherwise", async () => {
  isV3.mockResolvedValue(false);
  render(await call());
  expect(screen.getByTestId("v2-app")).toBeInTheDocument();
});
