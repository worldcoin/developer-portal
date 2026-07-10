/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

let pathname = "/teams/team_1/settings";
jest.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

import { ShellFrame } from "@/scenes/PortalV3/layout/Shell/ShellFrame";

const renderFrame = () =>
  render(
    <ShellFrame
      sidebar={<a href="/destination">Destination</a>}
      appSwitcher={<span>App switcher</span>}
    >
      Content
    </ShellFrame>,
  );

beforeEach(() => {
  pathname = "/teams/team_1/settings";
});

it("opens and closes the mobile sidebar", () => {
  renderFrame();

  const openButton = screen.getByRole("button", { name: "Open navigation" });
  const sidebar = document.getElementById("portal-sidebar");

  expect(sidebar).toHaveClass("-translate-x-full", "md:translate-x-0");
  fireEvent.click(openButton);
  expect(sidebar).toHaveClass("translate-x-0");
  expect(openButton).toHaveAttribute("aria-expanded", "true");

  fireEvent.click(
    screen.getAllByRole("button", { name: "Close navigation" })[0],
  );
  expect(sidebar).toHaveClass("-translate-x-full");
});

it("closes the drawer after navigation", () => {
  const view = renderFrame();
  const openButton = screen.getByRole("button", { name: "Open navigation" });

  fireEvent.click(openButton);
  pathname = "/destination";
  view.rerender(
    <ShellFrame
      sidebar={<a href="/destination">Destination</a>}
      appSwitcher={<span>App switcher</span>}
    >
      Content
    </ShellFrame>,
  );

  expect(openButton).toHaveAttribute("aria-expanded", "false");
});
