/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

// #region Mocks
let mockPortalVersion: "v2" | "v3" = "v3";
jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown, v2: () => unknown) =>
    mockPortalVersion === "v3" ? v3() : v2(),
}));

jest.mock("@/scenes/Portal/Teams/TeamId/Apps/AppId/Actions/page", () => ({
  ActionsPage: () => <div data-testid="v2-actions" />,
}));

const redirectMock = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));
// #endregion

import RoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/actions/page";

const props = (searchParams: Record<string, string> = {}) => ({
  params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
  searchParams: Promise.resolve(searchParams),
});

beforeEach(() => {
  jest.clearAllMocks();
  mockPortalVersion = "v3";
});

describe("/actions [Portal V3 redirect]", () => {
  it("redirects the retired list route to the canonical Legacy Actions tab", async () => {
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

describe("/actions [Portal V2 compatibility]", () => {
  it("keeps rendering the Portal V2 actions page", async () => {
    mockPortalVersion = "v2";

    render(await RoutePage(props()));

    expect(screen.getByTestId("v2-actions")).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
