/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("next/navigation", () => ({
  useParams: () => ({ teamId: "team_1", appId: "app_1" }),
  usePathname: () => "/teams/team_1/apps/app_1/world-id-4-0",
}));

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/common/SectionSubTabs",
  () => ({
    SectionSubTabs: (props: {
      items: Array<{ label: string; href: string }>;
    }) => (
      <nav>
        {props.items.map((item) => (
          <a key={item.href} href={item.href}>
            {item.label}
          </a>
        ))}
      </nav>
    ),
  }),
);

import { WorldIdSubTabs } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/SubTabs";

it("keeps legacy actions linked when the app has them", () => {
  render(<WorldIdSubTabs hasLegacyActions />);

  expect(
    screen.getByRole("link", { name: "World ID 3.0 Legacy" }),
  ).toHaveAttribute("href", "/teams/team_1/apps/app_1/actions");
});

it("hides the legacy link when the app has no legacy actions", () => {
  render(<WorldIdSubTabs hasLegacyActions={false} />);

  expect(
    screen.queryByRole("link", { name: "World ID 3.0 Legacy" }),
  ).not.toBeInTheDocument();
});
