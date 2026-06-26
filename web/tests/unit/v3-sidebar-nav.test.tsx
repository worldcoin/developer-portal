/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

const usePathname = jest.fn();
const useParams = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
  useParams: () => useParams(),
}));

import { SidebarNav } from "@/scenes/PortalV3/Shell/SidebarNav";

describe("SidebarNav", () => {
  it("marks the active section with aria-current=page", () => {
    useParams.mockReturnValue({ teamId: "team_1", appId: "app_1" });
    usePathname.mockReturnValue("/teams/team_1/apps/app_1/configuration");
    render(<SidebarNav />);
    expect(screen.getByText("Configuration").closest("a")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("does not mark a non-active section", () => {
    useParams.mockReturnValue({ teamId: "team_1", appId: "app_1" });
    usePathname.mockReturnValue("/teams/team_1/apps/app_1/configuration");
    render(<SidebarNav />);
    expect(screen.getByText("World ID").closest("a")).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("hides the app-scope group when no app is selected", () => {
    useParams.mockReturnValue({ teamId: "team_1" });
    usePathname.mockReturnValue("/teams/team_1/apps");
    render(<SidebarNav />);
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.getByText("API Keys")).toBeInTheDocument();
  });

  it("keeps team-scope items available without a selected app", () => {
    useParams.mockReturnValue({ teamId: "team_1" });
    usePathname.mockReturnValue("/teams/team_1/apps");
    render(<SidebarNav />);
    expect(screen.getByText("API Keys").closest("a")).toHaveAttribute(
      "href",
      "/teams/team_1/api-keys",
    );
  });
});
