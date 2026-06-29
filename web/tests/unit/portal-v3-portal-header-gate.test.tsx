/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { PortalHeaderGate } from "@/scenes/PortalV3/layout/PortalHeaderGate";

const Header = () => <div data-testid="v2-header">header</div>;

let pathname = "/teams/team_1/apps/app_1";
jest.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

describe("PortalHeaderGate", () => {
  it("hides the v2 header for v3 shell routes", () => {
    pathname = "/teams/team_1/apps/app_1";
    render(<PortalHeaderGate header={<Header />} />);
    expect(screen.queryByTestId("v2-header")).not.toBeInTheDocument();
  });

  it("keeps the v2 header for kiosk", () => {
    pathname = "/kiosk/app_1/action_1";
    render(<PortalHeaderGate header={<Header />} />);
    expect(screen.getByTestId("v2-header")).toBeInTheDocument();
  });

  it("keeps the v2 header for /teams resolver", () => {
    pathname = "/teams";
    render(<PortalHeaderGate header={<Header />} />);
    expect(screen.getByTestId("v2-header")).toBeInTheDocument();
  });
});
