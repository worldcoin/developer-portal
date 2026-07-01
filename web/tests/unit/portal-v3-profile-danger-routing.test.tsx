/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown, _v2: () => unknown) => v3(),
}));
jest.mock("@/scenes/Portal/Profile/DangerZone/page", () => ({
  DangerZone: () => <div data-testid="v2-danger" />,
}));
jest.mock("@/scenes/PortalV3/Profile/DangerZone/page", () => ({
  DangerZone: () => <div data-testid="v3-danger" />,
}));

import RoutePage from "../../app/(portal)/profile/danger/page";

it("renders the v3 profile-danger page for v3, not v2", async () => {
  render(await RoutePage());
  expect(screen.getByTestId("v3-danger")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-danger")).not.toBeInTheDocument();
});
