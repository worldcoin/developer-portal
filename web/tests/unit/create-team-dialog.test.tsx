/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

// #region Mocks
const mockReplace = jest.fn();
let mockSearchParams = new URLSearchParams();
jest.mock("next/navigation", () => ({
  usePathname: () => "/profile/teams",
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => mockSearchParams,
}));

jest.mock("@/scenes/Onboarding/CreateTeam/Form", () => ({
  CreateTeamForm: () => <div data-testid="create-team-form" />,
}));

jest.mock("@/components/DialogOverlay", () => ({
  DialogOverlay: () => <div data-testid="dialog-overlay" />,
}));

jest.mock("@/components/Dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div role="dialog">{children}</div> : null,
}));

jest.mock("@/components/DialogPanel", () => ({
  DialogPanel: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("@headlessui/react", () => ({
  DialogTitle: ({ children, ...props }: React.ComponentProps<"h2">) => (
    <h2 {...props}>{children}</h2>
  ),
}));
// #endregion

import { CreateTeamDialog } from "@/scenes/Onboarding/CreateTeam/Dialog";
import { getCreateTeamDialogStateUrl } from "@/scenes/Onboarding/CreateTeam/dialogRouting";

beforeEach(() => {
  jest.clearAllMocks();
  mockSearchParams = new URLSearchParams();
});

// #region URL-backed dialog state
describe("CreateTeamDialog [URL state]", () => {
  it("preserves unrelated query parameters when opening and closing", () => {
    const params = new URLSearchParams("tab=members");

    expect(getCreateTeamDialogStateUrl("/profile/teams", params, true)).toBe(
      "/profile/teams?tab=members&createTeam=true",
    );

    params.set("createTeam", "true");
    expect(getCreateTeamDialogStateUrl("/profile/teams", params, false)).toBe(
      "/profile/teams?tab=members",
    );
  });

  it("does not render modal content without the create-team parameter", () => {
    render(<CreateTeamDialog />);

    expect(
      screen.queryByRole("heading", { name: "Create a new team" }),
    ).not.toBeInTheDocument();
  });

  it("renders the modal and removes only its parameter when dismissed", () => {
    mockSearchParams = new URLSearchParams("tab=members&createTeam=true");

    render(<CreateTeamDialog />);
    expect(
      screen.getByRole("heading", { name: "Create a new team" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("create-team-form")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Close create team dialog" }),
    );

    expect(mockReplace).toHaveBeenCalledWith("/profile/teams?tab=members", {
      scroll: false,
    });
  });
});
// #endregion
