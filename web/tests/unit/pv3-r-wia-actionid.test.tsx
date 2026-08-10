/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockGetIsUserAllowedToUpdateApp = jest.fn();
jest.mock("@/lib/permissions", () => ({
  getIsUserAllowedToUpdateApp: (...args: unknown[]) =>
    mockGetIsUserAllowedToUpdateApp(...args),
}));
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/page",
  () => ({
    WorldIdActionDetailPage: (props: { canModify: boolean }) => (
      <div
        data-testid="v3-wia-actionid"
        data-can-modify={String(props.canModify)}
      />
    ),
  }),
);
import RoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/world-id-actions/[actionId]/page";

const props = () => ({
  params: Promise.resolve({ teamId: "t", appId: "a", actionId: "x" }),
});

beforeEach(() => {
  jest.clearAllMocks();
});

it("renders the action detail without modify permission", async () => {
  mockGetIsUserAllowedToUpdateApp.mockResolvedValue(false);

  render(await RoutePage(props()));

  expect(screen.getByTestId("v3-wia-actionid")).toBeInTheDocument();
  expect(screen.getByTestId("v3-wia-actionid")).toHaveAttribute(
    "data-can-modify",
    "false",
  );
  expect(mockGetIsUserAllowedToUpdateApp).toHaveBeenCalledWith("a");
});

it("renders the action detail with modify permission", async () => {
  mockGetIsUserAllowedToUpdateApp.mockResolvedValue(true);

  render(await RoutePage(props()));

  expect(screen.getByTestId("v3-wia-actionid")).toHaveAttribute(
    "data-can-modify",
    "true",
  );
});
