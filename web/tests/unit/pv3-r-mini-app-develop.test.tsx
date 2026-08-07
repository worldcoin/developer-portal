/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
jest.mock("next/navigation", () => ({ redirect: jest.fn() }));
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MiniApp/Develop/page",
  () => ({
    DevelopPage: () => <div data-testid="v3-mini-app-develop" />,
  }),
);

import RoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/mini-app/develop/page";

it("renders the v3 Develop page", async () => {
  render(
    await RoutePage({
      params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
    }),
  );

  expect(screen.getByTestId("v3-mini-app-develop")).toBeInTheDocument();
});
