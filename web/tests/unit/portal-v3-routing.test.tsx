/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown, _v2: () => unknown) => v3(),
}));
jest.mock("@/scenes/Portal/layout", () => ({
  PortalLayout: () => <div data-testid="v2-portal" />,
}));
jest.mock("@/scenes/PortalV3/layout", () => ({
  PortalLayout: () => <div data-testid="v3-portal" />,
}));

import PortalRootLayout from "../../app/(portal)/layout";

it("mounts the v3 shell at the root for v3, not v2", async () => {
  render(await PortalRootLayout({ children: null }));
  expect(screen.getByTestId("v3-portal")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-portal")).not.toBeInTheDocument();
});
