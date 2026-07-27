/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import { CreateTeamAccountMenu } from "@/scenes/Onboarding/CreateTeam/AccountMenu";

// #region Account menu scope
describe("CreateTeamAccountMenu", () => {
  it("uses a transparent trigger and exposes only logout", () => {
    render(<CreateTeamAccountMenu userInitial="K" />);

    const trigger = screen.getByRole("button", {
      name: "Open account menu",
    });
    expect(trigger).toHaveClass("bg-transparent");
    expect(trigger.className).not.toContain("border");
    expect(trigger.className).not.toContain("focus-visible:ring");
    expect(trigger).toHaveTextContent("K");

    fireEvent.keyDown(trigger, { key: "ArrowDown" });

    const menuItems = screen.getAllByRole("menuitem");

    expect(menuItems).toHaveLength(1);
    expect(menuItems[0]).toHaveTextContent("Log out");
    expect(menuItems[0]).toHaveAttribute(
      "href",
      expect.stringContaining("/api/auth/logout"),
    );
    expect(screen.queryByText("Profile")).not.toBeInTheDocument();
    expect(screen.queryByText("Switch team")).not.toBeInTheDocument();
  });
});
// #endregion
