/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

// #region Mocks
const pickPortalVersion = jest.fn();
jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: (...args: unknown[]) => pickPortalVersion(...args),
}));

jest.mock("@/lib/genarate-title", () => ({
  generateMetaTitle: () => "title",
}));

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/Danger/page",
  () => ({
    AppDangerZonePage: () => <div data-testid="v3-danger-page" />,
  }),
);

jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/Configuration/Danger/page",
  () => ({
    AppProfileDangerPage: () => <div data-testid="v2-danger-page" />,
  }),
);

import Page from "../../app/(portal)/teams/[teamId]/apps/[appId]/configuration/danger/page";
// #endregion

const props = () => ({
  params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
});

beforeEach(() => jest.clearAllMocks());

it("renders the separated Danger page for v3", async () => {
  pickPortalVersion.mockImplementation(async (v3: () => unknown) => v3());
  render(await Page(props()));
  expect(screen.getByTestId("v3-danger-page")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-danger-page")).not.toBeInTheDocument();
});

it("renders the standalone Danger page for v2", async () => {
  pickPortalVersion.mockImplementation(
    async (_v3: () => unknown, v2: () => unknown) => v2(),
  );
  render(await Page(props()));
  expect(screen.getByTestId("v2-danger-page")).toBeInTheDocument();
  expect(screen.queryByTestId("v3-danger-page")).not.toBeInTheDocument();
});
