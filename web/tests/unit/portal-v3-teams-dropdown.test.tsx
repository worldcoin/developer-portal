/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

// #region Mocks
jest.mock("@/components/ui/popover", () => ({
  Popover: ({ children }: React.PropsWithChildren) => <>{children}</>,
  PopoverTrigger: ({ children }: React.PropsWithChildren) => <>{children}</>,
  PopoverContent: ({
    children,
    side,
  }: React.PropsWithChildren<{ side?: string }>) => (
    <div data-testid="team-popover" data-side={side}>
      {children}
    </div>
  ),
}));

jest.mock("@/components/ui/sidebar", () => ({
  SidebarMenu: ({ children }: React.PropsWithChildren) => <ul>{children}</ul>,
  SidebarMenuItem: ({ children }: React.PropsWithChildren) => (
    <li>{children}</li>
  ),
  SidebarMenuButton: ({
    children,
    ...props
  }: React.PropsWithChildren<React.ComponentProps<"button">>) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock("@/lib/utils", () => ({
  cn: (...inputs: unknown[]) => inputs.filter(Boolean).join(" "),
}));

const mockReplace = jest.fn();
let mockTeamId = "team_2";
jest.mock("next/navigation", () => ({
  useParams: () => ({ teamId: mockTeamId }),
  usePathname: () => `/teams/${mockTeamId}/apps`,
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams("view=all"),
}));
// #endregion

import { TeamsDropdown } from "@/scenes/PortalV3/layout/Shell/TeamsDropdown";

const teams = [
  { id: "team_1", name: "Alpha" },
  { id: "team_2", name: "Beta Team" },
  { id: "team_3", name: "Gamma" },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockTeamId = "team_2";
});

it("opens the searchable team switcher below the trigger", () => {
  render(<TeamsDropdown teams={teams} />);

  const trigger = screen.getByRole("button", { name: "Switch team" });
  expect(trigger).toHaveTextContent("Beta Team");
  expect(trigger).toHaveClass("h-9", "px-3", "text-13");
  expect(screen.getByTestId("team-popover")).toHaveAttribute(
    "data-side",
    "bottom",
  );
  expect(
    screen.getByRole("searchbox", { name: "Find a team" }),
  ).toHaveAttribute("placeholder", "Find a team...");
});

it("filters teams while keeping the create-team action visible", () => {
  render(<TeamsDropdown teams={teams} />);

  fireEvent.change(screen.getByRole("searchbox", { name: "Find a team" }), {
    target: { value: "BETA" },
  });

  expect(screen.getByRole("link", { name: "Beta Team" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(screen.queryByRole("link", { name: "Alpha" })).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Create new team" }),
  ).toBeInTheDocument();
});

it("opens subsequent team creation in place", () => {
  render(<TeamsDropdown teams={teams} />);

  fireEvent.click(screen.getByRole("button", { name: "Create new team" }));

  expect(mockReplace).toHaveBeenCalledWith(
    "/teams/team_2/apps?view=all&createTeam=true",
    { scroll: false },
  );
});

it("shows the scroll hint only while more teams remain", () => {
  render(
    <TeamsDropdown
      teams={Array.from({ length: 20 }, (_, index) => ({
        id: `team_${index}`,
        name: `Team ${index}`,
      }))}
    />,
  );

  const teamList = screen.getByTestId("team-switcher-list");
  const footer = screen.getByTestId("team-switcher-footer");
  const createAction = screen.getByRole("button", {
    name: "Create new team",
  });

  expect(teamList).toHaveClass("overflow-y-auto", "no-scrollbar");
  expect(teamList).not.toContainElement(createAction);
  expect(footer).toContainElement(createAction);

  Object.defineProperties(teamList, {
    clientHeight: { configurable: true, value: 420 },
    scrollHeight: { configurable: true, value: 800 },
    scrollTop: { configurable: true, value: 0, writable: true },
  });

  fireEvent.scroll(teamList);
  expect(footer.className).toContain("shadow-[");

  teamList.scrollTop = 380;
  fireEvent.scroll(teamList);
  expect(footer.className).not.toContain("shadow-[");
});
