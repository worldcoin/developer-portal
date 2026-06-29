/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import React from "react";

// Stub V3Shell so we assert TeamIdLayoutV3 wiring, not shell internals.
jest.mock("@/scenes/PortalV3/Shell", () => ({
  V3Shell: (props: { teamId?: string; children: React.ReactNode }) => (
    <div data-testid="v3-shell" data-team-id={props.teamId}>
      {props.children}
    </div>
  ),
}));

import { TeamIdLayoutV3 } from "@/scenes/PortalV3/Teams/TeamId/layout";

describe("TeamIdLayoutV3", () => {
  it("awaits params and mounts V3Shell with the resolved teamId", async () => {
    const element = await TeamIdLayoutV3({
      params: Promise.resolve({ teamId: "team_123" }),
      children: <div data-testid="page-body">body</div>,
    });
    const { getByTestId } = render(element);
    const shell = getByTestId("v3-shell");
    expect(shell).toHaveAttribute("data-team-id", "team_123");
    expect(getByTestId("page-body")).toBeInTheDocument();
  });
});
