/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

const isV3 = jest.fn();
jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  isPortalV3ForSession: () => isV3(),
}));
jest.mock("@/scenes/PortalV3/layout", () => ({
  PortalLayout: (p: { variant?: string; children: React.ReactNode }) => (
    <div data-testid="v3-shell" data-variant={p.variant}>
      {p.children}
    </div>
  ),
}));
jest.mock("@/scenes/Portal/Profile/layout", () => ({
  ProfileLayout: (p: { children: React.ReactNode }) => (
    <div data-testid="profile-tabs">{p.children}</div>
  ),
}));

import ProfileRouteLayout from "../../app/(portal)/profile/layout";

beforeEach(() => jest.clearAllMocks());

it("wraps the v2 profile tabs in the account shell for v3", async () => {
  isV3.mockResolvedValue(true);
  render(await ProfileRouteLayout({ children: <div data-testid="body" /> }));
  expect(screen.getByTestId("v3-shell")).toHaveAttribute(
    "data-variant",
    "account",
  );
  // sub-tabs kept (Danger zone stays reachable) and rendered inside the shell
  expect(screen.getByTestId("profile-tabs")).toBeInTheDocument();
  expect(screen.getByTestId("body")).toBeInTheDocument();
});

it("renders the plain v2 profile layout otherwise", async () => {
  isV3.mockResolvedValue(false);
  render(await ProfileRouteLayout({ children: <div data-testid="body" /> }));
  expect(screen.getByTestId("profile-tabs")).toBeInTheDocument();
  expect(screen.queryByTestId("v3-shell")).not.toBeInTheDocument();
});
