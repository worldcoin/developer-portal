/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import React from "react";
import { PortalChromeGate } from "@/scenes/PortalV3/layout/PortalChromeGate";

// Drive the pathname the gate reads.
let mockPathname = "/";
jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

// Stub the v2 Header so we assert on the gate's branching, not Header internals.
jest.mock("@/scenes/Portal/layout/Header", () => ({
  Header: (props: { color: unknown }) => (
    <div data-testid="v2-header">header</div>
  ),
}));

describe("PortalChromeGate", () => {
  it("renders the v2 Header on a kiosk (exempt) route", () => {
    mockPathname = "/kiosk/app_00000000000000000000000000000000/action_x";
    const { queryByTestId } = render(<PortalChromeGate color={null} />);
    expect(queryByTestId("v2-header")).toBeInTheDocument();
  });

  it("renders the v2 Header on the /teams index (no team id) route", () => {
    mockPathname = "/teams";
    const { queryByTestId } = render(<PortalChromeGate color={null} />);
    expect(queryByTestId("v2-header")).toBeInTheDocument();
  });

  it("hides the v2 Header on a v3-active route (/teams/<id>/apps/<id>)", () => {
    mockPathname = "/teams/team_123/apps/app_00000000000000000000000000000000";
    const { queryByTestId } = render(<PortalChromeGate color={null} />);
    expect(queryByTestId("v2-header")).not.toBeInTheDocument();
  });

  it("hides the v2 Header on a v2-compat route (apps/<id>/actions)", () => {
    mockPathname =
      "/teams/team_123/apps/app_00000000000000000000000000000000/actions";
    const { queryByTestId } = render(<PortalChromeGate color={null} />);
    expect(queryByTestId("v2-header")).not.toBeInTheDocument();
  });
});
