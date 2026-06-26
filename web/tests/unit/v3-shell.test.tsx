/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { V3Shell } from "@/scenes/PortalV3/Shell";

describe("V3Shell (skeleton)", () => {
  it("renders its children in the content area", () => {
    render(
      <V3Shell teamId="team_123">
        <div data-testid="content">hello</div>
      </V3Shell>,
    );
    expect(screen.getByTestId("content")).toHaveTextContent("hello");
  });

  it("renders the app-scope and team-scope nav placeholders", () => {
    render(<V3Shell teamId="team_123">x</V3Shell>);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("World ID")).toBeInTheDocument();
    expect(screen.getByText("API Keys")).toBeInTheDocument();
  });
});
