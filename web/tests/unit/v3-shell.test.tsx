/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  usePathname: () => "/teams/team_1/apps/app_1",
  useParams: () => ({ teamId: "team_1", appId: "app_1" }),
}));

jest.mock("@/scenes/PortalV3/Shell/AppSwitcherContainer", () => ({
  AppSwitcherContainer: () => null,
}));

import { V3Shell } from "@/scenes/PortalV3/Shell";

describe("V3Shell", () => {
  it("renders its children in the content area", () => {
    render(
      <V3Shell teamId="team_1">
        <div data-testid="content">hello</div>
      </V3Shell>,
    );
    expect(screen.getByTestId("content")).toHaveTextContent("hello");
  });

  it("composes the sidebar nav (app-scope + team-scope groups)", () => {
    render(<V3Shell teamId="team_1">x</V3Shell>);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("World ID")).toBeInTheDocument();
    expect(screen.getByText("API Keys")).toBeInTheDocument();
  });
});
