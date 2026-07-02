/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown) => v3(),
}));
jest.mock("@/scenes/Portal/Profile/layout", () => ({
  ProfileLayout: () => <div data-testid="v2-profile-layout" />,
}));
jest.mock("@/scenes/PortalV3/Profile/layout", () => ({
  ProfileLayout: () => <div data-testid="v3-profile-layout" />,
}));
import Layout from "../../app/(portal)/profile/layout";
it("renders v3 profile layout", async () => {
  render(await Layout({ children: null }));
  expect(screen.getByTestId("v3-profile-layout")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-profile-layout")).not.toBeInTheDocument();
});
