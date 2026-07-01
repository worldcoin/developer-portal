/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown) => v3(),
}));
jest.mock("@/scenes/Portal/Profile/page", () => ({
  ProfilePage: () => <div data-testid="v2-profile" />,
}));
jest.mock("@/scenes/PortalV3/Profile/page", () => ({
  ProfilePage: () => <div data-testid="v3-profile" />,
}));
import RoutePage from "../../app/(portal)/profile/page";
it("renders v3 profile", async () => {
  render(await RoutePage());
  expect(screen.getByTestId("v3-profile")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-profile")).not.toBeInTheDocument();
});
