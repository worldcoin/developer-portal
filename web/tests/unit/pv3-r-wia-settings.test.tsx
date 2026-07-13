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

// @/lib/urls is intentionally NOT mocked — the redirect target shape
// (urls.worldIdActionDetail + appendSearchParams) is what's under test.
jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/Settings/page",
  () => ({
    WorldIdActionIdSettingsPage: () => <div data-testid="v2-wia-settings" />,
  }),
);

import RoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/world-id-actions/[actionId]/settings/page";
// #endregion

const props = (searchParams: Record<string, string> = {}) => ({
  params: Promise.resolve({
    teamId: "team_1",
    appId: "app_1",
    actionId: "action_1",
  }),
  searchParams: Promise.resolve(searchParams),
});

it("folds v3 settings into the new action detail page, preserving the query string", async () => {
  await RoutePage(props());
  expect(redirect).toHaveBeenCalledWith(
    "/teams/team_1/apps/app_1/world-id/actions/action_1",
  );

  await RoutePage(props({ foo: "bar" }));
  expect(redirect).toHaveBeenCalledWith(
    "/teams/team_1/apps/app_1/world-id/actions/action_1?foo=bar",
  );
});
