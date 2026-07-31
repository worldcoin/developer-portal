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

jest.mock("@/scenes/Portal/Teams/TeamId/Apps/page", () => ({
  AppsPage: () => <div data-testid="v2-apps-page" />,
}));
// #endregion

import RoutePage from "../../app/(portal)/teams/[teamId]/apps/page";

beforeEach(() => jest.clearAllMocks());

it("redirects the v3 apps index to the first-class team overview", async () => {
  pickPortalVersion.mockImplementation(async (v3: () => unknown) => v3());

  await RoutePage({
    params: Promise.resolve({ teamId: "team_1" }),
  });

  expect(redirect).toHaveBeenCalledWith("/teams/team_1");
});

it("preserves the Portal V2 apps page", async () => {
  pickPortalVersion.mockImplementation(
    async (_v3: () => unknown, v2: () => unknown) => v2(),
  );

  render(
    await RoutePage({
      params: Promise.resolve({ teamId: "team_1" }),
    }),
  );

  expect(screen.getByTestId("v2-apps-page")).toBeInTheDocument();
  expect(redirect).not.toHaveBeenCalled();
});
