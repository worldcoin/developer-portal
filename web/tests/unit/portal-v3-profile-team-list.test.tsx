/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

// #region Mocks
jest.mock("@/scenes/PortalV3/Profile/Teams/page/LeaveTeamDialog", () => ({
  LeaveTeamDialog: () => null,
}));
jest.mock("@/scenes/PortalV3/Profile/Teams/page/TransferTeamDialog", () => ({
  TransferTeamDialog: () => null,
}));
jest.mock("@/scenes/PortalV3/common/DeleteTeamDialog", () => ({
  DeleteTeamDialog: () => null,
}));
// #endregion

import { Role_Enum } from "@/graphql/graphql";
import { List } from "@/scenes/PortalV3/Profile/Teams/page/List";

// #region Test Data
const memberships = [
  {
    role: Role_Enum.Owner,
    team: { id: "team_123", name: "Analytical Engines" },
  },
  {
    role: Role_Enum.Member,
    team: { id: "team_456", name: "Difference Society" },
  },
] as React.ComponentProps<typeof List>["memberships"];
// #endregion

// #region Team list states
describe("PortalV3 profile team list", () => {
  it("renders each membership as a two-line team row", () => {
    render(<List memberships={memberships} loading={false} />);

    expect(screen.getByRole("heading", { name: "Your teams" })).toBeVisible();
    expect(screen.getByRole("link", { name: "New team" })).toHaveClass(
      "rounded-8",
    );
    expect(screen.getByText("Analytical Engines")).toBeVisible();
    expect(screen.getByText("Difference Society")).toBeVisible();
    expect(screen.getByText("Owner")).toBeVisible();
    expect(screen.getByText("Member")).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: "Open actions for Analytical Engines",
      }),
    ).toBeVisible();
  });

  it("renders two structural rows while memberships load", () => {
    const { container } = render(<List memberships={undefined} loading />);

    expect(container.querySelectorAll(".react-loading-skeleton")).toHaveLength(
      8,
    );
    expect(screen.queryByText("You don't belong to any teams yet.")).toBeNull();
  });

  it("renders an explicit empty state after loading", () => {
    render(<List memberships={[]} loading={false} />);

    expect(
      screen.getByText("You don't belong to any teams yet."),
    ).toBeVisible();
  });
});
// #endregion
