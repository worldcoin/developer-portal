/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

const isV3 = jest.fn();
jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  isPortalV3ForSession: () => isV3(),
}));
jest.mock("@/scenes/Portal/layout", () => ({
  PortalLayout: (p: { children: React.ReactNode }) => (
    <div data-testid="v2-portal">{p.children}</div>
  ),
}));

import PortalRootLayout from "../../app/(portal)/layout";

beforeEach(() => jest.clearAllMocks());

it("renders children directly (no v2 Header) for v3", async () => {
  isV3.mockResolvedValue(true);
  render(await PortalRootLayout({ children: <div data-testid="body" /> }));
  expect(screen.getByTestId("body")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-portal")).not.toBeInTheDocument();
});

it("renders the v2 portal layout otherwise", async () => {
  isV3.mockResolvedValue(false);
  render(await PortalRootLayout({ children: <div data-testid="body" /> }));
  expect(screen.getByTestId("v2-portal")).toBeInTheDocument();
});
