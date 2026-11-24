/** @jest-environment jsdom */
import "@testing-library/jest-dom";

// #region Mocks
const redirect = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirect(...args),
}));

import RoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/page";
// #endregion

const props = (searchParams: Record<string, string> = {}) => ({
  params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
  searchParams: Promise.resolve(searchParams),
});

beforeEach(() => jest.clearAllMocks());

it("redirects the legacy app dashboard to World ID", async () => {
  await RoutePage(props());

  expect(redirect).toHaveBeenCalledWith("/teams/team_1/apps/app_1/world-id");
});

it("preserves only the enable flow when redirecting", async () => {
  await RoutePage(props({ enableWorldId4: "true", ignored: "value" }));

  expect(redirect).toHaveBeenCalledWith(
    "/teams/team_1/apps/app_1/world-id?enableWorldId4=true&tab=configuration",
  );
});
