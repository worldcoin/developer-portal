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

jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({}),
}));

const mockFetchUser = jest.fn();
jest.mock(
  "@/scenes/Onboarding/CreateTeam/page/graphql/server/fetch-user.generated",
  () => ({
    getSdk: () => ({ FetchUser: mockFetchUser }),
  }),
);

jest.mock("@/scenes/Onboarding/CreateTeam/page/Form", () => ({
  Form: () => <div data-testid="create-team-form" />,
}));
// #endregion

import { CreateTeamPage } from "@/scenes/Onboarding/CreateTeam/page";

// #region Test Data
const session = (overrides?: { hasura?: { id: string }; email?: string }) => ({
  user: {
    sub: "auth0|user_1",
    name: "Kartike",
    email: overrides?.email,
    hasura: overrides?.hasura,
  },
});
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
});

// #region First-signup-only routing
describe("CreateTeamPage [routing]", () => {
  it("redirects an unauthenticated visitor to logout", async () => {
    mockGetSession.mockResolvedValue(null);

    await CreateTeamPage();

    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining("logout"),
    );
    expect(mockFetchUser).not.toHaveBeenCalled();
  });

  it("redirects an existing portal user to their profile", async () => {
    // Covers members and users who just deleted their last team alike: any
    // Hasura user row means the terms were already accepted at signup.
    mockGetSession.mockResolvedValue(session({ hasura: { id: "usr_1" } }));
    mockFetchUser.mockResolvedValue({ user_by_pk: { id: "usr_1" } });

    await CreateTeamPage();

    expect(mockRedirect).toHaveBeenCalledWith("/profile");
  });

  it("renders onboarding for a brand-new signup without querying Hasura", async () => {
    mockGetSession.mockResolvedValue(session({ email: "dev@example.com" }));

    render((await CreateTeamPage()) as ReactElement);

    expect(
      screen.getByRole("heading", { name: "Create your first team" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("create-team-form")).toBeInTheDocument();
    expect(screen.getByText("dev@example.com")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log out" })).toBeInTheDocument();
    expect(mockFetchUser).not.toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("treats a session user that is missing from Hasura as a first-time signup", async () => {
    mockGetSession.mockResolvedValue(session({ hasura: { id: "usr_stale" } }));
    mockFetchUser.mockResolvedValue({ user_by_pk: null });

    render((await CreateTeamPage()) as ReactElement);

    expect(
      screen.getByRole("heading", { name: "Create your first team" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("create-team-form")).toBeInTheDocument();
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
// #endregion
