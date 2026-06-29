/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { ShellFrame } from "@/scenes/PortalV3/Shell/ShellFrame";
import { SidebarNav } from "@/scenes/PortalV3/Shell/SidebarNav";

// next/navigation hooks used by SidebarNav.
const mockPathname = jest.fn<string, []>(() => "/teams/team_1/apps/app_1");
const mockParams = jest.fn<Record<string, string | undefined>, []>(() => ({
  teamId: "team_1",
  appId: "app_1",
}));
jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
  useParams: () => mockParams(),
}));

describe("ShellFrame", () => {
  it("renders the portal-v3-shell test id, nav, header and children", () => {
    render(
      <ShellFrame
        color={null}
        user={{ name: "Ada", email: "ada@example.com" }}
        topSlot={<div>team-switcher-slot</div>}
        nav={<div>nav-slot</div>}
        header={<div>header-slot</div>}
      >
        <div>page-body</div>
      </ShellFrame>,
    );

    expect(screen.getByTestId("portal-v3-shell")).toBeInTheDocument();
    expect(screen.getByText("team-switcher-slot")).toBeInTheDocument();
    expect(screen.getByText("nav-slot")).toBeInTheDocument();
    expect(screen.getByText("header-slot")).toBeInTheDocument();
    expect(screen.getByText("page-body")).toBeInTheDocument();
  });

  it("omits the header element when no header prop is given", () => {
    const { container } = render(
      <ShellFrame color={null} user={null} nav={<div>nav-slot</div>}>
        <div>page-body</div>
      </ShellFrame>,
    );
    expect(container.querySelector("header")).toBeNull();
    expect(screen.getByText("page-body")).toBeInTheDocument();
  });
});

describe("SidebarNav legacy-link safety", () => {
  it("renders app- and team-scope links and NO legacy surfaces", () => {
    render(<SidebarNav canSeeApiKeys canSeeSettings />);

    // Present, expected links.
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("World ID")).toBeInTheDocument();
    expect(screen.getByText("Configuration")).toBeInTheDocument();
    expect(screen.getByText("Mini App")).toBeInTheDocument();
    expect(screen.getByText("Members")).toBeInTheDocument();
    expect(screen.getByText("API Keys")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();

    // No legacy compatibility links anywhere in the nav.
    const hrefs = Array.from(document.querySelectorAll("a[href]")).map(
      (a) => a.getAttribute("href") ?? "",
    );
    for (const href of hrefs) {
      expect(href).not.toContain("/actions");
      expect(href).not.toContain("/sign-in-with-world-id");
      expect(href).not.toContain("proof-debugging");
    }
    // World ID points at the v3 surface, not legacy actions.
    expect(
      screen.getByText("World ID").closest("a")?.getAttribute("href"),
    ).toBe("/teams/team_1/apps/app_1/world-id-4-0");
  });

  it("role-gates API Keys and Settings (hidden without permission)", () => {
    render(<SidebarNav />);
    expect(screen.getByText("Members")).toBeInTheDocument();
    expect(screen.queryByText("API Keys")).not.toBeInTheDocument();
    expect(screen.queryByText("Settings")).not.toBeInTheDocument();
  });
});
