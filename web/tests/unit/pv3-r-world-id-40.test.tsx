/** @jest-environment jsdom */
import "@testing-library/jest-dom";

// #region Mocks
const redirectMock = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));
// #endregion

import RoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/world-id-4-0/page";

const props = (searchParams: Record<string, string> = {}) => ({
  params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
  searchParams: Promise.resolve(searchParams),
});

beforeEach(() => {
  jest.clearAllMocks();
});

// #region Legacy redirect
describe("/world-id-4-0 [legacy redirect]", () => {
  it("redirects to the canonical Configuration tab", async () => {
    await RoutePage(props());

    expect(redirectMock).toHaveBeenCalledWith(
      "/teams/team_1/apps/app_1/world-id?tab=configuration",
    );
  });

  it("preserves deep-link state and overwrites the retired tab", async () => {
    await RoutePage(
      props({
        enableWorldId4: "true",
        createAction: "true",
        tab: "world-id-4-0",
      }),
    );

    expect(redirectMock).toHaveBeenCalledWith(
      "/teams/team_1/apps/app_1/world-id?enableWorldId4=true&createAction=true&tab=configuration",
    );
  });
});
// #endregion
