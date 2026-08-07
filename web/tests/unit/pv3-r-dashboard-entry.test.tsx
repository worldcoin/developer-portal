/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

// #region Mocks
const DashboardPage = jest.fn(() => <div data-testid="v3-dashboard-entry" />);
jest.mock("@/scenes/PortalV3/Dashboard/page", () => ({
  DashboardPage: () => DashboardPage(),
}));
// #endregion

import RoutePage from "../../app/(portal)/dashboard/page";

beforeEach(() => jest.clearAllMocks());

it("runs the latest-team dashboard resolver", async () => {
  render(await RoutePage());

  expect(screen.getByTestId("v3-dashboard-entry")).toBeInTheDocument();
  expect(DashboardPage).toHaveBeenCalledTimes(1);
});
