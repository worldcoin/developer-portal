/** @jest-environment jsdom */
import "@testing-library/jest-dom";

// #region Mocks
const redirect = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirect(...args),
}));
// #endregion

import RoutePage from "../../app/(portal)/teams/[teamId]/apps/page";

beforeEach(() => jest.clearAllMocks());

it("redirects the legacy apps index to the first-class team overview", async () => {
  await RoutePage({
    params: Promise.resolve({ teamId: "team_1" }),
  });

  expect(redirect).toHaveBeenCalledWith("/teams/team_1");
});
