/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockGetIsUserAllowedToUpdateApp = jest.fn();
let mockPortalV3Enabled = true;

jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown, v2: () => unknown) =>
    mockPortalV3Enabled ? v3() : v2(),
}));
jest.mock("@/lib/permissions", () => ({
  getIsUserAllowedToUpdateApp: (...args: unknown[]) =>
    mockGetIsUserAllowedToUpdateApp(...args),
}));
jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/page",
  () => ({ WorldIdActionIdPage: () => <div data-testid="v2-wia-actionid" /> }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/page",
  () => ({
    WorldIdActionDetailPage: (props: { canDelete: boolean }) => (
      <div
        data-testid="v3-wia-actionid"
        data-can-delete={String(props.canDelete)}
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
  mockPortalV3Enabled = true;
});

it("renders the new v3 detail with delete permission", async () => {
  mockGetIsUserAllowedToUpdateApp.mockResolvedValue(false);

  render(await RoutePage(props()));

  expect(screen.getByTestId("v3-wia-actionid")).toBeInTheDocument();
  expect(screen.getByTestId("v3-wia-actionid")).toHaveAttribute(
    "data-can-delete",
    "false",
  );
  expect(mockGetIsUserAllowedToUpdateApp).toHaveBeenCalledWith("a");
  expect(screen.queryByTestId("v2-wia-actionid")).not.toBeInTheDocument();
});

it("keeps the legacy detail for v2", async () => {
  mockPortalV3Enabled = false;

  render(await RoutePage(props()));

  expect(screen.getByTestId("v2-wia-actionid")).toBeInTheDocument();
  expect(mockGetIsUserAllowedToUpdateApp).not.toHaveBeenCalled();
});
