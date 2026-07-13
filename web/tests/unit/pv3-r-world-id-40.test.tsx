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
// (urls.worldId + appendSearchParams) is what's under test.
jest.mock("@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldId40/page", () => ({
  WorldId40Page: () => <div data-testid="v2-world-id-40" />,
}));

import RoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/world-id-4-0/page";
// #endregion

const props = (searchParams: Record<string, string> = {}) => ({
  params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
  searchParams: Promise.resolve(searchParams),
});

it("redirects v3 users to the World ID landing with the 4.0 tab open", async () => {
  await RoutePage(props());
  expect(redirect).toHaveBeenCalledWith(
    "/teams/team_1/apps/app_1/world-id?tab=world-id-4-0",
  );

  // Forwards the caller's query string; the explicit 4.0 tab wins over any
  // incoming ?tab.
  await RoutePage(props({ tab: "overridden", createAction: "true" }));
  expect(redirect).toHaveBeenCalledWith(
    "/teams/team_1/apps/app_1/world-id?tab=world-id-4-0&createAction=true",
  );
});
