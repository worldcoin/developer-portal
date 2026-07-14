/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockGetIsUserAllowedToUpdateApp = jest.fn();
const mockRedirect = jest.fn();
let mockPortalV3Enabled = true;

jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown, v2: () => unknown) =>
    mockPortalV3Enabled ? v3() : v2(),
}));
jest.mock("@/lib/permissions", () => ({
  getIsUserAllowedToUpdateApp: (...args: unknown[]) =>
    mockGetIsUserAllowedToUpdateApp(...args),
}));
jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}));
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/Actions/ActionId/page",
  () => ({
    WorldIdActionDetailPage: (props: { canDelete: boolean }) => (
      <div
        data-testid="v3-world-id-action"
        data-can-delete={String(props.canDelete)}
      />
    ),
  }),
);
import Page from "../../app/(portal)/teams/[teamId]/apps/[appId]/world-id/actions/[actionId]/page";

beforeEach(() => {
  jest.clearAllMocks();
  mockPortalV3Enabled = true;
});

const props = (
  searchParams: Record<string, string | string[] | undefined> = {},
) => ({
  params: Promise.resolve({
    teamId: "team_1",
    appId: "app_1",
    actionId: "action_1",
  }),
  searchParams: Promise.resolve(searchParams),
});

it("passes the current delete permission to the v3 detail page", async () => {
  mockGetIsUserAllowedToUpdateApp.mockResolvedValue(false);

  render(await Page(props()));

  expect(screen.getByTestId("v3-world-id-action")).toBeInTheDocument();
  expect(screen.getByTestId("v3-world-id-action")).toHaveAttribute(
    "data-can-delete",
    "false",
  );
  expect(mockGetIsUserAllowedToUpdateApp).toHaveBeenCalledWith("app_1");
});

it("preserves legacy query params without querying the v3 permission", async () => {
  mockPortalV3Enabled = false;

  await Page(props({ foo: ["bar", "baz"], skipped: undefined }));

  expect(mockRedirect).toHaveBeenCalledWith(
    "/teams/team_1/apps/app_1/world-id-actions/action_1?foo=bar&foo=baz",
  );
  expect(mockGetIsUserAllowedToUpdateApp).not.toHaveBeenCalled();
});
