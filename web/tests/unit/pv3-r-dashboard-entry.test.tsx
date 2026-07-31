/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

// #region Mocks
const pickPortalVersion = jest.fn();
jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: (...args: unknown[]) => pickPortalVersion(...args),
}));

const redirect = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirect(...args),
}));

jest.mock("@/lib/urls", () => ({
  urls: { teams: () => "/teams" },
}));

const DashboardPage = jest.fn(() => <div data-testid="v3-dashboard-entry" />);
jest.mock("@/scenes/PortalV3/Dashboard/page", () => ({
  DashboardPage: () => DashboardPage(),
}));
// #endregion

import RoutePage from "../../app/(portal)/dashboard/page";

beforeEach(() => jest.clearAllMocks());

it("runs the latest-team resolver for Portal V3", async () => {
  pickPortalVersion.mockImplementation(async (v3: () => unknown) => v3());

  render(await RoutePage());

  expect(screen.getByTestId("v3-dashboard-entry")).toBeInTheDocument();
  expect(DashboardPage).toHaveBeenCalledTimes(1);
});

it("keeps Portal V2 on its existing teams resolver", async () => {
  pickPortalVersion.mockImplementation(
    async (_v3: () => unknown, v2: () => unknown) => v2(),
  );

  await RoutePage();

  expect(redirect).toHaveBeenCalledWith("/teams");
  expect(DashboardPage).not.toHaveBeenCalled();
});
