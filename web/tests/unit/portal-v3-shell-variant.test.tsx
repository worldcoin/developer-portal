/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("@/scenes/PortalV3/layout/Shell/TeamsDropdown", () => ({
  TeamsDropdown: () => <div data-testid="teams-dropdown" />,
}));
jest.mock("@/scenes/PortalV3/layout/Shell/SidebarNav", () => ({
  SidebarNav: () => <div data-testid="sidebar-nav" />,
}));
jest.mock("@/scenes/PortalV3/layout/Shell/AppsDropdown", () => ({
  AppsDropdown: () => <div data-testid="apps-dropdown" />,
}));
jest.mock("@/scenes/PortalV3/layout/Shell/UserPopup", () => ({
  UserPopup: () => <div data-testid="user-popup" />,
}));

import { PortalShell } from "@/scenes/PortalV3/layout/Shell";

const user = { name: "Ada", email: "ada@example.com" };

it("variant=app renders the full nav", () => {
  render(<PortalShell user={user} teams={[]} variant="app" />);
  expect(screen.getByTestId("teams-dropdown")).toBeInTheDocument();
  expect(screen.getByTestId("sidebar-nav")).toBeInTheDocument();
  expect(screen.getByTestId("apps-dropdown")).toBeInTheDocument();
  expect(screen.queryByTestId("portal-shell-close")).not.toBeInTheDocument();
});

it("variant=account renders the focused account view (close-X, no nav)", () => {
  render(<PortalShell user={user} variant="account" />);
  expect(screen.getByTestId("portal-shell-close")).toBeInTheDocument();
  expect(screen.getByTestId("user-popup")).toBeInTheDocument();
  expect(screen.queryByTestId("teams-dropdown")).not.toBeInTheDocument();
  expect(screen.queryByTestId("sidebar-nav")).not.toBeInTheDocument();
  expect(screen.queryByTestId("apps-dropdown")).not.toBeInTheDocument();
});
