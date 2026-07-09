/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

// #region Mocks
const pickPortalVersion = jest.fn();
jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: (...args: unknown[]) => pickPortalVersion(...args),
}));

jest.mock("@/scenes/Portal/Teams/TeamId/Apps/AppId/layout", () => ({
  AppIdLayout: () => <div data-testid="v2-appid-layout" />,
}));
jest.mock("@/scenes/PortalV3/Teams/TeamId/Apps/AppId/layout", () => ({
  AppIdLayout: () => <div data-testid="v3-appid-layout" />,
}));

import Layout from "../../app/(portal)/teams/[teamId]/apps/[appId]/layout";
// #endregion

const props = () => ({
  params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
  children: null,
});

beforeEach(() => jest.clearAllMocks());

it("renders the v3 app chrome for v3 users", async () => {
  pickPortalVersion.mockImplementation(async (v3: () => unknown) => v3());
  render(await Layout(props()));
  expect(screen.getByTestId("v3-appid-layout")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-appid-layout")).not.toBeInTheDocument();
});

it("renders the v2 app chrome for v2 users (v2 path untouched)", async () => {
  pickPortalVersion.mockImplementation(
    async (_v3: () => unknown, v2: () => unknown) => v2(),
  );
  render(await Layout(props()));
  expect(screen.getByTestId("v2-appid-layout")).toBeInTheDocument();
  expect(screen.queryByTestId("v3-appid-layout")).not.toBeInTheDocument();
});
