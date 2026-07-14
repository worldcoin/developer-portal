/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import React from "react";

let mockPortalV3Enabled = true;
const redirectMock = jest.fn();

jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown, v2: () => unknown) =>
    mockPortalV3Enabled ? v3() : v2(),
}));
jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));

const redirect = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirect(...args),
}));

jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/Settings/page",
  () => ({
    WorldIdActionIdSettingsPage: () => <div data-testid="v2-wia-settings" />,
  }),
);
import RoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/world-id-actions/[actionId]/settings/page";

const props = () => ({
  params: Promise.resolve({ teamId: "t", appId: "a", actionId: "x" }),
});

beforeEach(() => {
  jest.clearAllMocks();
  mockPortalV3Enabled = true;
});

it("redirects v3 settings links to the action detail", async () => {
  await RoutePage(props());

  expect(redirectMock).toHaveBeenCalledWith("../");
});

it("keeps the settings page for v2", async () => {
  mockPortalV3Enabled = false;

  render(await RoutePage(props()));

  expect(screen.getByTestId("v2-wia-settings")).toBeInTheDocument();
  expect(redirectMock).not.toHaveBeenCalled();
});
