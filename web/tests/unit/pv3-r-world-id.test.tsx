/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

// #region Mocks
jest.mock("@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/page", () => ({
  WorldIdPage: () => <div data-testid="v3-world-id" />,
}));

const redirectMock = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));
// #endregion

import RoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/world-id/page";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("/world-id", () => {
  it("renders the World ID page inside the route layout", async () => {
    render(await RoutePage());

    expect(screen.getByTestId("v3-world-id")).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
