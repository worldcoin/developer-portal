/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

// #region Mocks
jest.mock("@/scenes/PortalV3/Teams/TeamId/Apps/AppId/layout", () => ({
  AppIdLayout: () => <div data-testid="v3-appid-layout" />,
}));

import Layout from "../../app/(portal)/teams/[teamId]/apps/[appId]/layout";
// #endregion

const props = () => ({
  params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
  children: null,
});

it("renders the canonical app chrome", async () => {
  render(await Layout(props()));
  expect(screen.getByTestId("v3-appid-layout")).toBeInTheDocument();
});
