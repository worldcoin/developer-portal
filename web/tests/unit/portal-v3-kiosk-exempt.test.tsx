/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

describe("PortalV3 kiosk exemption", () => {
  it("kiosk path is public-exempt and never renders the v3 shell/page", async () => {
    const { getPortalV3RouteMode, shouldRenderPortalV3Shell } = await import(
      "@/lib/feature-flags/portal-v3/route-mode"
    );
    const path = "/kiosk/app_1234/action_5678";
    expect(getPortalV3RouteMode(path)).toBe("public-exempt");
    expect(shouldRenderPortalV3Shell(path)).toBe(false);
  });

  it("PortalChromeGate keeps the v2 Header and does NOT render portal-v3-shell on kiosk", async () => {
    jest.resetModules();
    process.env.LOCAL_DEV_PORTAL_V3_ENABLED = "true";
    jest.doMock("next/navigation", () => ({
      usePathname: () => "/kiosk/app_1234/action_5678",
    }));
    // Stub the v2 Header so we don't pull its full dependency tree.
    jest.doMock("@/scenes/Portal/layout/Header", () => ({
      Header: () => <header data-testid="v2-header">v2 header</header>,
    }));
    const { PortalChromeGate } = await import(
      "@/scenes/PortalV3/layout/PortalChromeGate"
    );
    render(<PortalChromeGate color={null} />);
    expect(screen.getByTestId("v2-header")).toBeInTheDocument();
    expect(screen.queryByTestId("portal-v3-shell")).not.toBeInTheDocument();
  });
});
