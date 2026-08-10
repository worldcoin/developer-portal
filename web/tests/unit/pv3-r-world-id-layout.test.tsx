/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

// #region Mocks
const getIsUserAllowedToUpdateApp = jest.fn().mockResolvedValue(true);
jest.mock("@/lib/permissions", () => ({
  getIsUserAllowedToUpdateApp: (...args: unknown[]) =>
    getIsUserAllowedToUpdateApp(...args),
}));

jest.mock("@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/layout", () => ({
  WorldIdLayout: (props: {
    teamId: string;
    appId: string;
    canManageWorldId: boolean;
    children: React.ReactNode;
  }) => (
    <div
      data-testid="world-id-layout"
      data-team-id={props.teamId}
      data-app-id={props.appId}
      data-can-manage={String(props.canManageWorldId)}
    >
      {props.children}
    </div>
  ),
}));
// #endregion

import RouteLayout from "../../app/(portal)/teams/[teamId]/apps/[appId]/world-id/layout";

const props = {
  params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
  children: <div data-testid="route-child" />,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("/world-id layout", () => {
  it("renders the shared scene layout with route identity and permissions", async () => {
    render(await RouteLayout(props));

    expect(screen.getByTestId("world-id-layout")).toHaveAttribute(
      "data-team-id",
      "team_1",
    );
    expect(screen.getByTestId("world-id-layout")).toHaveAttribute(
      "data-app-id",
      "app_1",
    );
    expect(screen.getByTestId("world-id-layout")).toHaveAttribute(
      "data-can-manage",
      "true",
    );
    expect(screen.getByTestId("route-child")).toBeInTheDocument();
    expect(getIsUserAllowedToUpdateApp).toHaveBeenCalledWith("app_1");
  });
});
