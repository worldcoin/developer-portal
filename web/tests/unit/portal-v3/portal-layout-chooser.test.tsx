/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import React from "react";

// Flag ON for this suite.
process.env.LOCAL_DEV_PORTAL_V3_ENABLED = "true";

// flag.ts (reached transitively via the chooser) does `import "server-only"`,
// which throws in the jsdom environment — mock it at the boundary.
jest.mock("server-only", () => ({}));

let mockPathname = "/";
jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

// auth0.getSession is async; PortalLayoutV3 awaits it. Return no session so
// color falls back to undefined input (calculateColorFromString handles it).
jest.mock("@/lib/auth0", () => ({
  auth0: { getSession: jest.fn().mockResolvedValue(null) },
}));

jest.mock("@/scenes/Portal/layout/Header", () => ({
  Header: () => <div data-testid="v2-header">header</div>,
}));

import LayoutScene from "@/app/(portal)/layout";

const renderScene = async (children: React.ReactNode) => {
  // The scene returns props => <C .../>; the v3 layout is an async server
  // component, so await its element before rendering.
  const element = (LayoutScene as any)({ children });
  const resolved = await element.type(element.props);
  return render(resolved);
};

describe("(portal) layout chooser [flag on]", () => {
  it("keeps the v2 Header on a /kiosk route", async () => {
    mockPathname = "/kiosk/app_00000000000000000000000000000000/action_x";
    const { queryByTestId } = await renderScene(<div>child</div>);
    expect(queryByTestId("v2-header")).toBeInTheDocument();
  });

  it("has no (portal) Header on /teams/<id>/apps/<id>", async () => {
    mockPathname = "/teams/team_123/apps/app_00000000000000000000000000000000";
    const { queryByTestId } = await renderScene(<div>child</div>);
    expect(queryByTestId("v2-header")).not.toBeInTheDocument();
  });
});
