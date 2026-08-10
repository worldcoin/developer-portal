/** @jest-environment jsdom */

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
  logger: { warn: jest.fn(), error: jest.fn() },
}));

const redirect = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirect(...args),
}));

jest.mock("@/scenes/Onboarding/Home/layout", () => ({
  HomeLayout: () => null,
}));
jest.mock("@/scenes/Onboarding/Home/page", () => ({
  HomePage: () => null,
}));
// #endregion

import { RootPage } from "@/scenes/Root/page";

beforeEach(() => {
  jest.clearAllMocks();
  getSession.mockResolvedValue({
    user: {
      email: "member@example.com",
      hasura: { id: "usr_1" },
    },
  });
});

describe("RootPage [authenticated routing]", () => {
  it("routes members through the canonical dashboard resolver", async () => {
    FetchMemberships.mockResolvedValue({
      membership: [{ team_id: "team_1" }],
    });

    await RootPage();

    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("routes users without a team to team creation", async () => {
    FetchMemberships.mockResolvedValue({ membership: [] });

    await RootPage();

    expect(redirect).toHaveBeenCalledWith("/create-team");
  });
});
