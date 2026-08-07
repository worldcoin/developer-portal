/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
jest.mock("@/scenes/PortalV3/Profile/page", () => ({
  ProfilePage: () => <div data-testid="v3-profile" />,
}));
import RoutePage from "../../app/(portal)/profile/page";

it("renders the profile page", async () => {
  render(await RoutePage());
  expect(screen.getByTestId("v3-profile")).toBeInTheDocument();
});
