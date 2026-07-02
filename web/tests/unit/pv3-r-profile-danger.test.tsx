/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown) => v3(),
}));
jest.mock("@/scenes/Portal/Profile/DangerZone/page", () => ({
  DangerZone: () => <div data-testid="v2-profile-danger" />,
}));
jest.mock("@/scenes/PortalV3/Profile/DangerZone/page", () => ({
  DangerZone: () => <div data-testid="v3-profile-danger" />,
}));
import RoutePage from "../../app/(portal)/profile/danger/page";
it("renders v3 profile-danger", async () => {
  render(await RoutePage());
  expect(screen.getByTestId("v3-profile-danger")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-profile-danger")).not.toBeInTheDocument();
});
