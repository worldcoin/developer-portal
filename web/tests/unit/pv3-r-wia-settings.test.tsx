/** @jest-environment jsdom */
import "@testing-library/jest-dom";
const redirectMock = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));
import RoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/world-id-actions/[actionId]/settings/page";

beforeEach(() => {
  jest.clearAllMocks();
});

it("redirects settings links to the action detail", async () => {
  await RoutePage();

  expect(
    new URL(
      redirectMock.mock.calls[0][0],
      "https://portal.test/teams/t/apps/a/world-id-actions/x/settings",
    ).pathname,
  ).toBe("/teams/t/apps/a/world-id-actions/x/");
});
