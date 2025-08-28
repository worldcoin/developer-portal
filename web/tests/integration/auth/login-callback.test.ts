import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { loginCallback } from "@/api/login-callback";
import { Auth0User } from "@/lib/types";
import { gql } from "@apollo/client";
import { getSession, updateSession } from "@auth0/nextjs-auth0";
import { NextRequest } from "next/server";

import { integrationDBClean, integrationDBExecuteQuery } from "../setup";

// TODO: Consider moving this to a generalized jest environment
beforeEach(integrationDBClean);
const validEmailSessionUser = {
  email: "test@world.org",
  email_verified: true,
  sub: "email|1234567890",
  name: "Test User",
  nickname: "test",
  picture: "https://example.com/test.png",
  updated_at: "2022-01-01T00:00:00.000Z",
  sid: "1234567890",
} as Auth0User;

const validNullifierSessionUser = {
  sub: "oauth2|worldcoin|0x123", // NOTE: seeds are already created with nullifier in this format,
  name: "Test User",
  nickname: "test",
  picture: "https://example.com/test.png",
  updated_at: "2022-01-01T00:00:00.000Z",
  sid: "123",
} as Auth0User;

jest.mock("@auth0/nextjs-auth0", () => ({
  withApiAuthRequired: jest.fn((handler) => handler), // Accept and ignore the second argument
  getSession: jest.fn(() => ({
    user: {
      sub: "test",
    },
  })),
  updateSession: jest.fn(),
}));

describe("test /login-callback", () => {
  beforeEach(() => {
    // NOTE: Reset mocks before each test
    (getSession as jest.Mock).mockReset();
    (updateSession as jest.Mock).mockReset();
  });

  it("should redirect to /login if no session is found", async () => {
    const response = await loginCallback({} as unknown as NextRequest, {});
    expect(response.status).toEqual(307);
    expect(response.headers.get("location")?.endsWith("/login")).toBeTruthy();
  });

  it("should login email user successfully", async () => {
    const mockReq = {
      nextUrl: new URL("/login-callback", "http://localhost:3000"),
    } as unknown as NextRequest;

    const mockSession = {
      user: validEmailSessionUser,
    };

    (getSession as jest.Mock).mockResolvedValue(mockSession);
    const response = await loginCallback(mockReq, {});

    expect(getSession).toHaveReturned();
    expect(response.headers.get("location")?.endsWith("/apps")).toBeTruthy();
  });

  it("should login nullifier user successfully", async () => {
    const mockReq = {
      nextUrl: new URL("/login-callback", "http://localhost:3000"),
    } as unknown as NextRequest;

    const mockSession = {
      user: validNullifierSessionUser,
    };

    (getSession as jest.Mock).mockResolvedValue(mockSession);
    const response = await loginCallback(mockReq, {});

    expect(getSession).toHaveReturned();
    expect(response.headers.get("location")?.endsWith("/apps")).toBeTruthy();
  });

  it("should redirect to /create-team if no user is found", async () => {
    const mockReq = {
      nextUrl: new URL("/login-callback", "http://localhost:3000"),
    } as unknown as NextRequest;

    const mockSession = {
      user: {
        ...validEmailSessionUser,
        email: "wrong_email@test.test",
        sub: "email|wrong_sub",
      },
    };

    (getSession as jest.Mock).mockResolvedValue(mockSession);
    const response = await loginCallback(mockReq, {});
    expect(getSession).toHaveReturned();

    expect(
      response.headers.get("location")?.endsWith("/create-team"),
    ).toBeTruthy();
  });

  it("should redirect to /api/auth/logout if email is not verified", async () => {
    const mockReq = {
      nextUrl: new URL("/login-callback", "http://localhost:3000"),
    } as unknown as NextRequest;

    const mockSession = {
      user: {
        ...validEmailSessionUser,
        email_verified: false,
      },
    };

    (getSession as jest.Mock).mockResolvedValue(mockSession);
    const response = await loginCallback(mockReq, {});
    expect(getSession).toHaveReturned();

    expect(
      response.headers.get("location")?.endsWith("/api/auth/logout"),
    ).toBeTruthy();
  });

  it("updates session with user data", async () => {
    const mockReq = {
      nextUrl: new URL("/login-callback", "http://localhost:3000"),
    } as unknown as NextRequest;

    const mockSession = {
      user: validEmailSessionUser,
    };

    (getSession as jest.Mock).mockResolvedValue(mockSession);
    const response = await loginCallback(mockReq, {});

    const query = gql(`
      query FetchUserByEmail($email: String!) {
        user(where: { email: { _eq: $email } }) {
          id
          email
          name
          auth0Id
          posthog_id
          is_allow_tracking
          name
          memberships {
            team {
              id
              name
            }
            role
          }
        }
      }
    `);

    const client = await getAPIServiceGraphqlClient();

    const fetchUserRes = await client.request<{
      user: Array<Record<string, any>>;
    }>(query, { email: validEmailSessionUser.email });

    expect(getSession).toHaveReturned();

    expect(updateSession).toHaveBeenCalledWith(
      mockReq,
      expect.anything(),
      expect.objectContaining({
        user: {
          ...mockSession.user,
          hasura: {
            ...fetchUserRes.user[0],
          },
        },
      }),
    );

    expect(response.headers.get("location")?.endsWith("/apps")).toBeTruthy();
  });

  it("Should redirect new invited user to /join-callback", async () => {
    const team_id = "team_d7cde14f17eda7e0ededba7ded6b4467";
    const email = "new-test-email@world.org";

    const { rows: insertedInvite } = (await integrationDBExecuteQuery(
      `INSERT INTO public.invite (team_id, expires_at, email) VALUES ('${team_id}', '2030-01-01 00:00:00+00', '${email}') RETURNING  id, team_id, email`,
    )) as { rows: { id: string; team_id: string; email: string }[] };

    const url = new URL("/login-callback", "http://localhost:3000");
    url.searchParams.append("invite_id", insertedInvite[0].id);

    const mockReq = {
      nextUrl: url,
    } as unknown as NextRequest;

    const mockSession = {
      user: {
        ...validEmailSessionUser,
        email,
        sub: "email|new_sub",
      },
    };

    (getSession as jest.Mock).mockResolvedValue(mockSession);
    const response = await loginCallback(mockReq, {});

    expect(getSession).toHaveReturned();

    expect(
      response.headers
        .get("location")
        ?.endsWith(`/join-callback?invite_id=${insertedInvite[0].id}`),
    ).toBeTruthy();
  });

  it("Should add membership for the invited existing user", async () => {
    const email = "test1-member@team2.example.com";
    const team_id = "team_d7cde14f17eda7e0ededba7ded6b4467";

    const { rows: insertedInvite } = (await integrationDBExecuteQuery(
      `INSERT INTO public.invite (team_id, expires_at, email) VALUES ('${team_id}', '2030-01-01 00:00:00+00', '${email}') RETURNING  id, team_id, email`,
    )) as { rows: { id: string; team_id: string; email: string }[] };

    const url = new URL("/login-callback", "http://localhost:3000");
    url.searchParams.append("invite_id", insertedInvite[0].id);

    const mockReq = {
      nextUrl: url,
    } as unknown as NextRequest;

    const mockSession = {
      user: {
        ...validEmailSessionUser,
        email,
      },
    };

    (getSession as jest.Mock).mockResolvedValue(mockSession);
    const response = await loginCallback(mockReq, {});

    const userQuery = gql`
      query FetchUserByEmail($email: String!) {
        user(where: { email: { _eq: $email } }) {
          id
          email
          name
          auth0Id
          posthog_id
          is_allow_tracking
          name
          memberships {
            team {
              id
              name
            }
            role
          }
        }
      }
    `;

    const client = await getAPIServiceGraphqlClient();

    const fetchUserRes = await client.request<{
      user: Array<{
        id: string;
        email: string;
        auth0Id: string;
        posthog_id: string;
        is_allow_tracking: boolean;
        name: string;
        memberships: Array<{
          team: {
            id: string;
            name: string;
          };
          role: string;
        }>;
      }>;
    }>(userQuery, { email });

    expect(
      fetchUserRes.user[0].memberships.some((m) => m.team.id === team_id),
    ).toBeTruthy();

    expect(getSession).toHaveReturned();
    expect(response.headers.get("location")?.endsWith("/apps")).toBeTruthy();
  });
});
