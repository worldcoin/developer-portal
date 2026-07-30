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

const getIsUserAllowedToUpdateApp = jest.fn().mockResolvedValue(true);
jest.mock("@/lib/permissions", () => ({
  getIsUserAllowedToUpdateApp: (...args: unknown[]) =>
    getIsUserAllowedToUpdateApp(...args),
}));

jest.mock("@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/page", () => ({
  WorldIdPage: (props: {
    params: { appId: string };
    searchParams: Record<string, string>;
    canManageWorldId: boolean;
  }) => (
    <div
      data-testid="v3-world-id"
      data-app-id={props.params.appId}
      data-create-action={props.searchParams.createAction}
      data-can-manage={String(props.canManageWorldId)}
    />
  ),
}));

const redirectMock = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));
// #endregion

import RoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/world-id/page";

// #region Test Data
const props = (searchParams: Record<string, string> = {}) => ({
  params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
  searchParams: Promise.resolve(searchParams),
});
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  mockPortalVersion = "v3";
});

// #region Portal V3
describe("/world-id [Portal V3]", () => {
  it("renders the shared World ID scene with route state and permissions", async () => {
    render(await RoutePage(props({ createAction: "true" })));

    expect(screen.getByTestId("v3-world-id")).toHaveAttribute(
      "data-app-id",
      "app_1",
    );
    expect(screen.getByTestId("v3-world-id")).toHaveAttribute(
      "data-create-action",
      "true",
    );
    expect(screen.getByTestId("v3-world-id")).toHaveAttribute(
      "data-can-manage",
      "true",
    );
    expect(getIsUserAllowedToUpdateApp).toHaveBeenCalledWith("app_1");
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
// #endregion

// #region Portal V2 compatibility
describe("/world-id [Portal V2 compatibility]", () => {
  it("redirects to the guarded legacy route without adding an empty query", async () => {
    mockPortalVersion = "v2";

    await RoutePage(props());

    expect(redirectMock).toHaveBeenCalledWith(
      "/teams/team_1/apps/app_1/world-id-4-0",
    );
  });

  it("redirects to the guarded legacy route and preserves query parameters", async () => {
    mockPortalVersion = "v2";

    await RoutePage(props({ enableWorldId4: "true" }));

    expect(redirectMock).toHaveBeenCalledWith(
      "/teams/team_1/apps/app_1/world-id-4-0?enableWorldId4=true",
    );
  });
});
// #endregion
