/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import React from "react";

// #region Mocks
jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown) => v3(),
}));

const redirect = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirect(...args),
}));

jest.mock("@/scenes/Portal/Teams/TeamId/Apps/AppId/page", () => ({
  AppIdPage: () => <div data-testid="v2-dashboard" />,
}));

import RoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/page";
// #endregion

const props = (searchParams: Record<string, string> = {}) => ({
  params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
  searchParams: Promise.resolve(searchParams),
});

it("redirects v3 users to World ID and only preserves the enable flow", async () => {
  await RoutePage(props());
  expect(redirect).toHaveBeenCalledWith("/teams/team_1/apps/app_1/world-id");

  await RoutePage(props({ enableWorldId4: "true", ignored: "value" }));
  expect(redirect).toHaveBeenCalledWith(
    "/teams/team_1/apps/app_1/world-id?enableWorldId4=true",
  );
});
