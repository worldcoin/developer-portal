/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

// #region Mocks
jest.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}));

jest.mock("@/lib/utils", () => ({
  cn: (...inputs: unknown[]) => inputs.filter(Boolean).join(" "),
}));

jest.mock("@/scenes/PortalV3/layout/Shell/AppsDropdown", () => ({
  AppsDropdown: () => <div>apps-dropdown</div>,
}));

jest.mock("@/scenes/PortalV3/layout/Shell/SidebarNav", () => ({
  SidebarNav: () => <nav>sidebar-navigation</nav>,
}));

jest.mock("@/scenes/PortalV3/layout/Shell/TeamsDropdown", () => ({
  TeamsDropdown: () => <div>teams-dropdown</div>,
}));

jest.mock("@/scenes/PortalV3/layout/Shell/UserPopup", () => ({
  UserPopup: () => <div>user-popup</div>,
}));
// #endregion

import { PortalShell } from "@/scenes/PortalV3/layout/Shell";

it("fully closes the desktop sidebar and exposes only the header reopen control", () => {
  const { container } = render(
    <PortalShell user={{ name: "Ada" }}>
      <div>page-content</div>
    </PortalShell>,
  );

  const sidebar = container.querySelector('[data-slot="sidebar"]');
  const sidebarHeader = container.querySelector('[data-slot="sidebar-header"]');
  const sidebarGap = container.querySelector('[data-slot="sidebar-gap"]');
  const openTrigger = screen.getByRole("button", { name: "Open sidebar" });
  const collapseRail = screen.getByRole("button", {
    name: "Collapse sidebar",
  });

  expect(sidebar).toHaveAttribute("data-state", "expanded");
  expect(sidebar).toHaveAttribute("data-collapsible", "");
  expect(sidebarHeader).toHaveClass(
    "h-(--portal-header-height)",
    "border-b",
    "border-portal-border",
  );
  expect(openTrigger).toHaveAttribute("data-state", "expanded");
  expect(openTrigger).toHaveClass("md:data-[state=expanded]:hidden");
  expect(openTrigger).toHaveClass("cursor-pointer");
  expect(collapseRail).toHaveClass("cursor-pointer!");
  expect(collapseRail.querySelector("span")).toHaveClass(
    "cursor-pointer",
    "hover:border-grey-300",
    "hover:bg-grey-100",
  );
  expect(collapseRail).toContainElement(
    collapseRail.querySelector("svg") as SVGSVGElement,
  );

  fireEvent.click(collapseRail);

  expect(sidebar).toHaveAttribute("data-state", "collapsed");
  expect(sidebar).toHaveAttribute("data-collapsible", "offcanvas");
  expect(sidebarGap).toHaveClass("group-data-[collapsible=offcanvas]:w-0");
  expect(openTrigger).toHaveAttribute("data-state", "collapsed");
  expect(collapseRail).toHaveClass(
    "group-data-[collapsible=offcanvas]:hidden!",
  );

  fireEvent.click(openTrigger);

  expect(sidebar).toHaveAttribute("data-state", "expanded");
  expect(sidebar).toHaveAttribute("data-collapsible", "");
  expect(openTrigger).toHaveAttribute("data-state", "expanded");
});
