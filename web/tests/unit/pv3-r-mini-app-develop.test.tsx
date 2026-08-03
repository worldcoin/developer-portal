/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

const pickPortalVersion = jest.fn();
const redirect = jest.fn();

jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: (...args: unknown[]) => pickPortalVersion(...args),
}));
jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirect(...args),
}));
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MiniApp/Develop/page",
  () => ({
    DevelopPage: () => <div data-testid="v3-mini-app-develop" />,
  }),
);

import RoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/mini-app/develop/page";

beforeEach(() => {
  jest.clearAllMocks();
});

it("renders the v3 Develop page", async () => {
  pickPortalVersion.mockImplementation(async (v3: () => unknown) => v3());

  render(
    await RoutePage({
      params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
    }),
  );

  expect(screen.getByTestId("v3-mini-app-develop")).toBeInTheDocument();
});

it("redirects the v2 Develop route to Permissions", async () => {
  pickPortalVersion.mockImplementation(
    async (_v3: () => unknown, v2: () => unknown) => v2(),
  );

  await RoutePage({
    params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
  });

  expect(redirect).toHaveBeenCalledWith("../permissions");
});
