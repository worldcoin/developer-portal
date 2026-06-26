/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { DashboardView } from "@/scenes/PortalV3/Dashboard/DashboardView";

describe("DashboardView", () => {
  it("renders the overview heading, stat labels, and quick actions", () => {
    render(
      <DashboardView
        stats={[
          { label: "Impressions", value: "0" },
          { label: "Users", value: "5" },
        ]}
      />,
    );
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Impressions")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Quick actions")).toBeInTheDocument();
    expect(screen.getByText("Create an action")).toBeInTheDocument();
  });
});
