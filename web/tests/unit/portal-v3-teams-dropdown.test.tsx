/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

// #region Mocks
jest.mock("@radix-ui/react-dropdown-menu", () => ({
  Root: ({ children }: React.PropsWithChildren) => <>{children}</>,
  Trigger: ({ children, ...props }: React.ComponentProps<"button">) => (
    <button {...props}>{children}</button>
  ),
  Portal: ({ children }: React.PropsWithChildren) => <>{children}</>,
  Content: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  Item: ({
    children,
    onSelect,
    ...props
  }: React.ComponentProps<"button"> & { onSelect?: () => void }) => (
    <button role="menuitem" onClick={onSelect} {...props}>
      {children}
    </button>
  ),
}));

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useParams: () => ({ teamId: "team_1" }),
  usePathname: () => "/teams/team_1/apps",
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => new URLSearchParams("view=all"),
}));
// #endregion

import { TeamsDropdown } from "@/scenes/PortalV3/layout/Shell/TeamsDropdown";

beforeEach(() => {
  jest.clearAllMocks();
});

// #region Team selection actions
describe("Portal V3 TeamsDropdown [actions]", () => {
  it("switches existing teams with normal portal navigation", () => {
    render(
      <TeamsDropdown
        teams={[
          { id: "team_1", name: "Current" },
          { id: "team_2", name: "Other" },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("menuitem", { name: /Other/ }));

    expect(mockPush).toHaveBeenCalledWith("/teams/team_2");
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("opens subsequent team creation in place", () => {
    render(<TeamsDropdown teams={[{ id: "team_1", name: "Current" }]} />);

    fireEvent.click(screen.getByRole("menuitem", { name: "Create new team" }));

    expect(mockReplace).toHaveBeenCalledWith(
      "/teams/team_1/apps?view=all&createTeam=true",
      { scroll: false },
    );
    expect(mockPush).not.toHaveBeenCalledWith("/create-team");
  });
});
// #endregion
