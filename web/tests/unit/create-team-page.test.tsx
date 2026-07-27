/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React, { ReactElement } from "react";

// #region Mocks
const mockGetSession = jest.fn();
jest.mock("@/lib/auth0", () => ({
  auth0: {
    getSession: (...args: unknown[]) => mockGetSession(...args),
  },
}));

const mockRedirect = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}));

jest.mock("@/scenes/Onboarding/CreateTeam/AccountMenu", () => ({
  CreateTeamAccountMenu: ({ userInitial }: { userInitial: string }) => (
    <div
      data-testid="create-team-account-menu"
      data-user-initial={userInitial}
    />
  ),
}));

jest.mock("@/scenes/Onboarding/CreateTeam/Form", () => ({
  CreateTeamForm: ({
    hasPortalUser,
    presentation,
  }: {
    hasPortalUser: boolean;
    presentation: string;
  }) => (
    <div
      data-testid="create-team-form"
      data-has-portal-user={String(hasPortalUser)}
      data-presentation={presentation}
    />
  ),
}));
// #endregion

import { CreateTeamPage } from "@/scenes/Onboarding/CreateTeam/page";

// #region Test Data
const session = (hasura?: {
  id: string;
  memberships: Array<{ team: { id: string }; role: string }>;
}) => ({
  user: {
    sub: "auth0|user_1",
    name: "Kartike",
    hasura,
  },
});
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
});

// #region Authentication and team-state routing
describe("CreateTeamPage [authentication and team state]", () => {
  it("redirects an unauthenticated visitor to logout", async () => {
    mockGetSession.mockResolvedValue(null);

    await CreateTeamPage();

    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining("logout"),
    );
  });

  it("renders first-team onboarding for a new user", async () => {
    mockGetSession.mockResolvedValue(session());

    const { container } = render((await CreateTeamPage()) as ReactElement);

    expect(
      screen.getByRole("heading", { name: "Create your team" }),
    ).toBeInTheDocument();
    expect(container.firstChild).toHaveClass(
      "h-dvh",
      "overflow-hidden",
      "overscroll-none",
    );
    expect(screen.getByText(/01\s*\/\s*01/)).toBeInTheDocument();
    expect(screen.getByTestId("create-team-account-menu")).toHaveAttribute(
      "data-user-initial",
      "K",
    );
    expect(screen.getByTestId("create-team-form")).toHaveAttribute(
      "data-has-portal-user",
      "false",
    );
    expect(screen.getByTestId("create-team-form")).toHaveAttribute(
      "data-presentation",
      "full-page",
    );
  });

  it("uses full-page onboarding for an existing user with zero memberships", async () => {
    mockGetSession.mockResolvedValue(session({ id: "usr_1", memberships: [] }));

    render((await CreateTeamPage()) as ReactElement);

    expect(screen.getByTestId("create-team-form")).toHaveAttribute(
      "data-has-portal-user",
      "true",
    );
    expect(
      screen.getByRole("heading", { name: "Create your team" }),
    ).toBeInTheDocument();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("redirects a member to an in-portal create-team dialog", async () => {
    mockGetSession.mockResolvedValue(
      session({
        id: "usr_1",
        memberships: [{ team: { id: "team_1" }, role: "OWNER" }],
      }),
    );

    await CreateTeamPage();

    expect(mockRedirect).toHaveBeenCalledWith("/profile/teams?createTeam=true");
  });
});
// #endregion
