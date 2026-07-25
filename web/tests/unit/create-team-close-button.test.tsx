/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

// #region Mocks
const back = jest.fn();
const push = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ back, push }),
}));

const useUser = jest.fn();
jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => useUser(),
}));
// #endregion

import { CloseButton } from "@/scenes/Onboarding/CreateTeam/layout/CloseButton";

// #region Test Data
const sessionState = (
  memberships: { team: { id: string } }[],
  isLoading = false,
) => ({
  user: {
    hasura: { id: "usr_1", memberships },
  },
  isLoading,
});
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
});

// #region CloseButton branches
describe("CloseButton", () => {
  it("renders nothing when the user has no teams", () => {
    useUser.mockReturnValue(sessionState([]));

    const { container } = render(<CloseButton />);

    expect(container).toBeEmptyDOMElement();
  });

  it("stays hidden when a team appears mid-visit (create-team submit)", () => {
    // The post-create session refresh must not flash the X back in while navigation is pending.
    useUser.mockReturnValue(sessionState([]));

    const { container, rerender } = render(<CloseButton />);

    useUser.mockReturnValue(sessionState([{ team: { id: "team_new" } }]));
    rerender(<CloseButton />);

    expect(container).toBeEmptyDOMElement();
  });

  it("does not latch hidden while the session is still loading", () => {
    // The pre-hydration frame (no user yet) must not trip the latch for users who do have teams.
    useUser.mockReturnValue({ user: undefined, isLoading: true });

    const { container, rerender } = render(<CloseButton />);
    expect(container).toBeEmptyDOMElement();

    useUser.mockReturnValue(sessionState([{ team: { id: "team_1" } }]));
    rerender(<CloseButton />);

    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("does not latch hidden when the profile fetch fails", () => {
    // useUser reports `user: null, isLoading: false` on any failed /api/auth/profile
    // fetch, and SWR keeps that state across its retry backoff.
    useUser.mockReturnValue({
      user: null,
      isLoading: false,
      error: new Error("Unauthorized"),
    });

    const { container, rerender } = render(<CloseButton />);
    expect(container).toBeEmptyDOMElement();

    useUser.mockReturnValue(sessionState([{ team: { id: "team_1" } }]));
    rerender(<CloseButton />);

    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders the X and divider for a user with teams and navigates back", () => {
    useUser.mockReturnValue(sessionState([{ team: { id: "team_1" } }]));

    render(<CloseButton />);

    expect(screen.getByText("|")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button"));

    expect(back).toHaveBeenCalledTimes(1);
    expect(push).not.toHaveBeenCalled();
  });

  it("prefers an explicit href over history back", () => {
    useUser.mockReturnValue(sessionState([{ team: { id: "team_1" } }]));

    render(<CloseButton href="/profile/teams" />);

    fireEvent.click(screen.getByRole("button"));

    expect(push).toHaveBeenCalledWith("/profile/teams");
    expect(back).not.toHaveBeenCalled();
  });
});
// #endregion
