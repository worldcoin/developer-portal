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
  it("marks the active route with aria-current and leaves others unmarked", () => {
    useParams.mockReturnValue({ teamId: "team_1", appId: "app_1" });
    usePathname.mockReturnValue("/teams/team_1/apps/app_1/configuration");
    render(<SidebarNav />);
    expect(screen.getByText("Configuration").closest("a")).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByText("World ID").closest("a")).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("without a selected app, app-scope items point to the apps list and team-scope items link normally", () => {
    useParams.mockReturnValue({ teamId: "team_1" });
    usePathname.mockReturnValue("/teams/team_1/apps");
    render(<SidebarNav />);
    expect(screen.getByText("Dashboard").closest("a")).toHaveAttribute(
      "href",
      "/teams/team_1/apps",
    );
    expect(screen.getByText("API Keys").closest("a")).toHaveAttribute(
      "href",
      "/teams/team_1/api-keys",
    );
  });
});
