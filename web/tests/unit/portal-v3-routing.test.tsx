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

import PortalRootLayout from "../../app/(portal)/layout";

it("v3 path renders children without the v2 portal layout (no double header)", async () => {
  render(await PortalRootLayout({ children: <div data-testid="body" /> }));
  expect(screen.getByTestId("body")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-portal")).not.toBeInTheDocument();
});
