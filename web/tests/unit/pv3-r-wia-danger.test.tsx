/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
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
jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/Danger/page",
  () => ({
    WorldIdActionIdDangerPage: () => <div data-testid="v2-wia-danger" />,
  }),
);
import RoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/world-id-actions/[actionId]/danger/page";

const props = () => ({
  params: Promise.resolve({ teamId: "t", appId: "a", actionId: "x" }),
});

beforeEach(() => {
  jest.clearAllMocks();
  mockPortalV3Enabled = true;
});

it("redirects v3 danger links to the action detail", async () => {
  await RoutePage(props());

  expect(
    new URL(
      redirectMock.mock.calls[0][0],
      "https://portal.test/teams/t/apps/a/world-id-actions/x/danger",
    ).pathname,
  ).toBe("/teams/t/apps/a/world-id-actions/x/");
});

it("keeps the danger page for v2", async () => {
  mockPortalV3Enabled = false;

  render(await RoutePage(props()));

  expect(screen.getByTestId("v2-wia-danger")).toBeInTheDocument();
  expect(redirectMock).not.toHaveBeenCalled();
});
