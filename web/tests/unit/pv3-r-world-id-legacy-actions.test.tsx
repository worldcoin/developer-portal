/** @jest-environment jsdom */
import "@testing-library/jest-dom";
// #region Mocks
let mockPortalVersion: "v2" | "v3" = "v3";
jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown, v2: () => unknown) =>
    mockPortalVersion === "v3" ? v3() : v2(),
}));

const redirectMock = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));
// #endregion

import RoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/world-id/legacy-actions/page";

const props = (searchParams: Record<string, string> = {}) => ({
  params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
  searchParams: Promise.resolve(searchParams),
});

beforeEach(() => {
  jest.clearAllMocks();
  mockPortalVersion = "v3";
});

describe("/world-id/legacy-actions [Portal V3]", () => {
  it("redirects to the canonical Legacy Actions tab", async () => {
    await RoutePage(props());

    expect(redirectMock).toHaveBeenCalledWith(
      "/teams/team_1/apps/app_1/world-id?tab=legacy-actions",
    );
  });

  it("preserves query parameters and overwrites a stale tab", async () => {
    await RoutePage(props({ search: "vote", tab: "configuration" }));

    expect(redirectMock).toHaveBeenCalledWith(
      "/teams/team_1/apps/app_1/world-id?search=vote&tab=legacy-actions",
    );
  });
});

describe("/world-id/legacy-actions [Portal V2 compatibility]", () => {
  it("redirects to the Portal V2 actions route", async () => {
    mockPortalVersion = "v2";

    await RoutePage(props({ search: "vote" }));

    expect(redirectMock).toHaveBeenCalledWith(
      "/teams/team_1/apps/app_1/actions?search=vote",
    );
  });
});
