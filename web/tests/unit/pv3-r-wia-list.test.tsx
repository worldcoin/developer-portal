/** @jest-environment jsdom */
import "@testing-library/jest-dom";

// #region Mocks
const redirectMock = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));
// #endregion

import RoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/world-id-actions/page";

const props = (searchParams: Record<string, string> = {}) => ({
  params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
  searchParams: Promise.resolve(searchParams),
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("/world-id-actions [legacy redirect]", () => {
  it("redirects the retired list route to the canonical Actions tab", async () => {
    await RoutePage(props());

    expect(redirectMock).toHaveBeenCalledWith(
      "/teams/team_1/apps/app_1/world-id?tab=actions",
    );
  });

  it("preserves query parameters and overwrites a stale tab", async () => {
    await RoutePage(props({ createAction: "true", tab: "configuration" }));

    expect(redirectMock).toHaveBeenCalledWith(
      "/teams/team_1/apps/app_1/world-id?createAction=true&tab=actions",
    );
  });
});
