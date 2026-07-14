/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

let mockPortalV3Enabled = true;

jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown, v2: () => unknown) =>
    mockPortalV3Enabled ? v3() : v2(),
}));
jest.mock("@/lib/permissions", () => ({
  getIsUserAllowedToUpdateApp: jest.fn().mockResolvedValue(true),
}));
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/Actions/ActionId/page",
  () => ({
    WorldIdActionDetailPage: () => <div data-testid="v3-wia-actionid" />,
  }),
);
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

it("renders the v3 detail for settings links", async () => {
  render(await RoutePage(props()));

  expect(screen.getByTestId("v3-wia-actionid")).toBeInTheDocument();
});

it("keeps the settings page for v2", async () => {
  mockPortalV3Enabled = false;

  render(await RoutePage(props()));

  expect(screen.getByTestId("v2-wia-settings")).toBeInTheDocument();
});
