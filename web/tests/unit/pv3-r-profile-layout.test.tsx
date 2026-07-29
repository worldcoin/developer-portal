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
import Layout from "../../app/(portal)/profile/layout";

it("renders the v3 profile without the legacy tab layout", async () => {
  render(await Layout({ children: <div data-testid="profile-page" /> }));

  expect(screen.getByTestId("profile-page")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-profile-layout")).not.toBeInTheDocument();
});
