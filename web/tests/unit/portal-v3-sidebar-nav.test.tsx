/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { SidebarNav } from "@/scenes/PortalV3/Shell/SidebarNav";

jest.mock("next/navigation", () => ({
  useParams: () => ({ teamId: "team_1", appId: "app_1" }),
  usePathname: () => "/teams/team_1/apps/app_1",
}));

describe("PortalV3 SidebarNav", () => {
  it("renders active app and team links without legacy routes", () => {
    render(<SidebarNav canSeeApiKeys canSeeSettings />);

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/teams/team_1/apps/app_1",
    );
    expect(screen.getByRole("link", { name: "World ID" })).toHaveAttribute(
      "href",
      "/teams/team_1/apps/app_1/world-id-4-0",
    );
    expect(screen.getByRole("link", { name: "Configuration" })).toHaveAttribute(
      "href",
      "/teams/team_1/apps/app_1/configuration",
    );
    expect(screen.getByRole("link", { name: "Mini App" })).toHaveAttribute(
      "href",
      "/teams/team_1/apps/app_1/mini-app",
    );
    expect(screen.getByRole("link", { name: "Members" })).toHaveAttribute(
      "href",
      "/teams/team_1",
    );
    expect(screen.getByRole("link", { name: "API Keys" })).toHaveAttribute(
      "href",
      "/teams/team_1/api-keys",
    );
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "href",
      "/teams/team_1/settings",
    );

    expect(screen.queryByText("Actions")).not.toBeInTheDocument();
    expect(screen.queryByText("Sign in with World ID")).not.toBeInTheDocument();
  });

  it("hides gated team links when permissions are false", () => {
    render(<SidebarNav canSeeApiKeys={false} canSeeSettings={false} />);
    expect(
      screen.queryByRole("link", { name: "API Keys" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Settings" }),
    ).not.toBeInTheDocument();
  });
});
