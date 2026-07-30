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

jest.mock("@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldId40/page", () => ({
  WorldId40Page: () => <div data-testid="v2-world-id-40" />,
}));

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
  mockPortalVersion = "v3";
});

// #region Portal V3 compatibility redirect
describe("/world-id-4-0 [Portal V3 compatibility]", () => {
  it("redirects to the canonical route without adding an empty query", async () => {
    await RoutePage(props());

    expect(redirectMock).toHaveBeenCalledWith(
      "/teams/team_1/apps/app_1/world-id",
    );
  });

  it("redirects to the canonical route and preserves deep-link state", async () => {
    await RoutePage(
      props({
        enableWorldId4: "true",
        createAction: "true",
        tab: "world-id-4-0",
      }),
    );

    expect(redirectMock).toHaveBeenCalledWith(
      "/teams/team_1/apps/app_1/world-id?enableWorldId4=true&createAction=true&tab=world-id-4-0",
    );
  });
});
// #endregion

// #region Portal V2
describe("/world-id-4-0 [Portal V2]", () => {
  it("retains the existing World ID 4.0 page", async () => {
    mockPortalVersion = "v2";

    render(await RoutePage(props()));

    expect(screen.getByTestId("v2-world-id-40")).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
// #endregion
