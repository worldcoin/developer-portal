/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { render, screen } from "@testing-library/react";
import React from "react";

// #region Mocks
const usePathname = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
}));

jest.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}));

jest.mock("@/lib/utils", () => ({
  cn: (...inputs: unknown[]) => inputs.filter(Boolean).join(" "),
}));

jest.mock("@/scenes/PortalV3/layout/Shell/TeamsDropdown", () => ({
  TeamsDropdown: () => <div data-testid="teams-dropdown" />,
}));
// #endregion

import { SidebarContextHeader } from "@/scenes/PortalV3/layout/Shell/SidebarContextHeader";

const renderHeader = (teams = [{ id: "team_1", name: "Team 1" }]) =>
  render(
    <SidebarProvider>
      <SidebarContextHeader teams={teams} />
    </SidebarProvider>,
  );

beforeEach(() => jest.clearAllMocks());

describe("SidebarContextHeader [route context]", () => {
  it("links profile routes back through the dashboard resolver", () => {
    usePathname.mockReturnValue("/profile");

    renderHeader();

    const link = screen.getByRole("link", { name: "Back to dashboard" });
    expect(link).toHaveAttribute("href", "/dashboard");
    expect(link.querySelector("svg")).toHaveClass("-translate-y-px");
    expect(screen.queryByTestId("teams-dropdown")).not.toBeInTheDocument();
  });

  it("hides the dashboard link on profile routes when the user has no teams", () => {
    usePathname.mockReturnValue("/profile");

    renderHeader([]);

    expect(
      screen.queryByRole("link", { name: "Back to dashboard" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("teams-dropdown")).not.toBeInTheDocument();
  });

  it("keeps the team switcher on team-scoped routes", () => {
    usePathname.mockReturnValue("/teams/team_1/settings");

    renderHeader();

    expect(screen.getByTestId("teams-dropdown")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Back to dashboard" }),
    ).not.toBeInTheDocument();
  });
});
