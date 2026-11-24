/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { ReactElement, ReactNode } from "react";

// #region Mocks
const getSession = jest.fn();
jest.mock("@/lib/auth0", () => ({
  auth0: { getSession: (...args: unknown[]) => getSession(...args) },
}));

const FetchMemberships = jest.fn();
jest.mock(
  "@/scenes/Root/page/graphql/server/fetch-memberships.generated",
  () => ({
    getSdk: () => ({ FetchMemberships }),
  }),
);

jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({}),
}));

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const redirect = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirect(...args),
}));

jest.mock("@/scenes/Onboarding/Home/layout", () => ({
  HomeLayout: ({ children }: { children: ReactNode }) => (
    <div data-testid="home-layout">{children}</div>
  ),
}));
jest.mock("@/scenes/Onboarding/Home/page", () => ({
  HomePage: () => <div data-testid="home-page" />,
}));
// #endregion

import { logger } from "@/lib/logger";
import { RootPage } from "@/scenes/Root/page";

// #region Test Data
const APP_URL = "https://developer.example.com";
const LOGOUT_URL = `/api/auth/logout?returnTo=${encodeURIComponent(APP_URL)}`;
const USER_ID = "usr_0123456789abcdef0123456789abcdef";

const sessionFor = (hasura?: { id?: string }) => ({
  user: { sub: "auth0|member", email: "member@example.com", hasura },
});
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  process.env.NEXT_PUBLIC_APP_URL = APP_URL;
  getSession.mockResolvedValue(sessionFor({ id: USER_ID }));
});

// #region Signed-out visitors
describe("RootPage [signed out]", () => {
  it("renders the public home page without querying memberships", async () => {
    getSession.mockResolvedValue(null);

    const page = await RootPage();
    render(page as ReactElement);

    expect(screen.getByTestId("home-layout")).toContainElement(
      screen.getByTestId("home-page"),
    );
    expect(FetchMemberships).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });
});
// #endregion

// #region Signed-in routing
describe("RootPage [signed in]", () => {
  it("routes members to the dashboard", async () => {
    FetchMemberships.mockResolvedValue({
      membership: [{ team_id: "team_0123456789abcdef0123456789abcdef" }],
    });

    await RootPage();

    expect(FetchMemberships).toHaveBeenCalledWith({ userId: USER_ID });
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("routes users without a team to team creation", async () => {
    FetchMemberships.mockResolvedValue({ membership: [] });

    await RootPage();

    expect(redirect).toHaveBeenCalledWith("/create-team");
  });
});
// #endregion

// #region Broken sessions and dependency failures
describe("RootPage [re-authentication]", () => {
  it("logs out a session that is missing the Hasura user id", async () => {
    getSession.mockResolvedValue(sessionFor(undefined));

    await RootPage();

    expect(FetchMemberships).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith(LOGOUT_URL);
  });

  it("logs out and reports the error when memberships cannot be fetched", async () => {
    const error = new Error("hasura unavailable");
    FetchMemberships.mockRejectedValue(error);

    await RootPage();

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("memberships"),
      { error },
    );
    expect(redirect).toHaveBeenCalledWith(LOGOUT_URL);
    expect(redirect).not.toHaveBeenCalledWith("/dashboard");
  });
});
// #endregion
