/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

// #region Mocks
jest.mock("@/lib/genarate-title", () => ({
  generateMetaTitle: () => "title",
}));

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/Danger/page",
  () => ({
    AppDangerZonePage: () => <div data-testid="v3-danger-page" />,
  }),
);

import Page from "../../app/(portal)/teams/[teamId]/apps/[appId]/configuration/danger/page";
// #endregion

const props = () => ({
  params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
});

beforeEach(() => jest.clearAllMocks());

it("renders the separated Danger page", async () => {
  render(await Page(props()));
  expect(screen.getByTestId("v3-danger-page")).toBeInTheDocument();
});
