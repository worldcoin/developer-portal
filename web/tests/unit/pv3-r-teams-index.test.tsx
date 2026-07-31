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
  urls: { dashboard: () => "/dashboard" },
}));
jest.mock("@/scenes/Portal/Teams/page", () => ({
  TeamsPage: () => <div data-testid="v2-teams-page" />,
}));
// #endregion

import RoutePage from "../../app/(portal)/teams/page";

beforeEach(() => jest.clearAllMocks());

it("sends Portal V3 through the latest-team dashboard resolver", async () => {
  pickPortalVersion.mockImplementation(async (v3: () => unknown) => v3());

  await RoutePage();

  expect(redirect).toHaveBeenCalledWith("/dashboard");
});

it("preserves the Portal V2 teams resolver", async () => {
  pickPortalVersion.mockImplementation(
    async (_v3: () => unknown, v2: () => unknown) => v2(),
  );

  render(await RoutePage());

  expect(screen.getByTestId("v2-teams-page")).toBeInTheDocument();
  expect(redirect).not.toHaveBeenCalled();
});
