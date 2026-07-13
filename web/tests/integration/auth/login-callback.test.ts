import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { loginCallback } from "@/api/login-callback";
import { Auth0User } from "@/lib/types";
import { gql } from "@apollo/client";
import { auth0 } from "@/lib/auth0";
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

jest.mock("@/lib/auth0", () => ({
  auth0: {
    getSession: jest.fn(),
    updateSession: jest.fn(),
  },
}));

const getSession = auth0.getSession as jest.Mock;
const updateSession = auth0.updateSession as jest.Mock;

describe("test /login-callback", () => {
  beforeEach(() => {
    // NOTE: Reset mocks before each test
    (getSession as jest.Mock).mockReset();
    (updateSession as jest.Mock).mockReset();
  });

  it("should redirect to /login if no session is found", async () => {
    const response = await loginCallback({} as unknown as NextRequest);
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
    const response = await loginCallback(mockReq);

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
    const response = await loginCallback(mockReq);

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
    const response = await loginCallback(mockReq);
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
    const response = await loginCallback(mockReq);
    expect(getSession).toHaveReturned();

    expect(
      response.headers.get("location")?.includes("/api/auth/logout"),
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
    const response = await loginCallback(mockReq);

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
    const response = await loginCallback(mockReq);

    expect(getSession).toHaveReturned();

    expect(
      response.headers
        .get("location")
        ?.endsWith(`/join-callback?invite_id=${insertedInvite[0].id}`),
    ).toBeTruthy();
  });

  it("should redirect to a valid relative returnTo path", async () => {
    const url = new URL(
      "/login-callback?returnTo=/some-page",
      "http://localhost:3000",
    );
    const mockReq = { nextUrl: url } as unknown as NextRequest;
    const mockSession = { user: validEmailSessionUser };

    (getSession as jest.Mock).mockResolvedValue(mockSession);
    const response = await loginCallback(mockReq);

    expect(
      response.headers.get("location")?.endsWith("/some-page"),
    ).toBeTruthy();
  });

  it("should ignore an absolute URL returnTo and use default redirect", async () => {
    const url = new URL(
      "/login-callback?returnTo=https://evil.com",
      "http://localhost:3000",
    );
    const mockReq = { nextUrl: url } as unknown as NextRequest;
    const mockSession = { user: validEmailSessionUser };

    (getSession as jest.Mock).mockResolvedValue(mockSession);
    const response = await loginCallback(mockReq);

    expect(response.headers.get("location")).not.toContain("evil.com");
    expect(response.headers.get("location")?.endsWith("/apps")).toBeTruthy();
  });

  it("should ignore a protocol-relative URL returnTo and use default redirect", async () => {
    const url = new URL(
      "/login-callback?returnTo=%2F%2Fevil.com",
      "http://localhost:3000",
    );
    const mockReq = { nextUrl: url } as unknown as NextRequest;
    const mockSession = { user: validEmailSessionUser };

    (getSession as jest.Mock).mockResolvedValue(mockSession);
    const response = await loginCallback(mockReq);

    expect(response.headers.get("location")).not.toContain("evil.com");
    expect(response.headers.get("location")?.endsWith("/apps")).toBeTruthy();
  });

  it("should ignore a backslash-prefixed returnTo that resolves off-site", async () => {
    const url = new URL(
      "/login-callback?returnTo=%2F%5Cevil.com",
      "http://localhost:3000",
    );
    const mockReq = { nextUrl: url } as unknown as NextRequest;
    const mockSession = { user: validEmailSessionUser };

    (getSession as jest.Mock).mockResolvedValue(mockSession);
    const response = await loginCallback(mockReq);

    expect(response.headers.get("location")).not.toContain("evil.com");
    expect(response.headers.get("location")?.endsWith("/apps")).toBeTruthy();
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
    const response = await loginCallback(mockReq);

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

  it("Should add membership for the invited existing World ID user", async () => {
    const inviteEmail = "invited-world-user@example.com";
    const team_id = "team_2222214f17eda7e0ededba7ded6b4222";

    await integrationDBExecuteQuery(
      `UPDATE public."user" SET "auth0Id" = '${validNullifierSessionUser.sub}', name = '${validNullifierSessionUser.name}' WHERE world_id_nullifier = '0x123'`,
    );

    const { rows: insertedInvite } = (await integrationDBExecuteQuery(
      `INSERT INTO public.invite (team_id, expires_at, email) VALUES ('${team_id}', '2030-01-01 00:00:00+00', '${inviteEmail}') RETURNING  id, team_id, email`,
    )) as { rows: { id: string; team_id: string; email: string }[] };

    const url = new URL("/login-callback", "http://localhost:3000");
    url.searchParams.append("invite_id", insertedInvite[0].id);

    const mockReq = {
      nextUrl: url,
    } as unknown as NextRequest;

    const mockSession = {
      user: validNullifierSessionUser,
    };

    (getSession as jest.Mock).mockResolvedValue(mockSession);
    const response = await loginCallback(mockReq);

    const userQuery = gql`
      query FetchUserByNullifier($world_id_nullifier: String!) {
        user(where: { world_id_nullifier: { _eq: $world_id_nullifier } }) {
          memberships {
            team {
              id
            }
          }
        }
      }
    `;

    const client = await getAPIServiceGraphqlClient();

    const fetchUserRes = await client.request<{
      user: Array<{
        memberships: Array<{
          team: {
            id: string;
          };
        }>;
      }>;
    }>(userQuery, { world_id_nullifier: "0x123" });

    expect(
      fetchUserRes.user[0].memberships.some((m) => m.team.id === team_id),
    ).toBeTruthy();

    expect(getSession).toHaveReturned();
    expect(
      updateSession.mock.calls[0][2].user.hasura.memberships.some(
        (m: { team: { id: string } }) => m.team.id === team_id,
      ),
    ).toBeTruthy();
    expect(response.headers.get("location")).not.toContain("/unauthorized");
  });

  // Regression test for HackerOne #3857870. A single-use invite must yield at
  // most one membership even when /login-callback is hit concurrently with the
  // same invite_id. The previous flow inserted the membership and deleted the
  // invite in two separate, un-transactioned mutations with no unique
  // constraint on (team_id, user_id), so a concurrent burst produced multiple
  // memberships from one invite. The accept_team_invite function now consumes
  // the invite (DELETE) and creates the membership in one transaction, so the
  // delete is the concurrency gate.
  it("consumes a single-use invite exactly once under a concurrent burst", async () => {
    // usr_...d94: seeded into team_2222..., NOT into the team below.
    const email = "test1-member@team2.example.com";
    const team_id = "team_d7cde14f17eda7e0ededba7ded6b4467";

    const { rows: insertedInvite } = (await integrationDBExecuteQuery(
      `INSERT INTO public.invite (team_id, expires_at, email) VALUES ('${team_id}', '2030-01-01 00:00:00+00', '${email}') RETURNING id`,
    )) as { rows: { id: string }[] };

    const url = new URL("/login-callback", "http://localhost:3000");
    url.searchParams.append("invite_id", insertedInvite[0].id);
    const mockReq = { nextUrl: url } as unknown as NextRequest;

    (getSession as jest.Mock).mockResolvedValue({
      user: { ...validEmailSessionUser, email },
    });

    const CONCURRENCY = 8;
    await Promise.all(
      Array.from({ length: CONCURRENCY }, () => loginCallback(mockReq)),
    );

    // Exactly one membership created for this user in the invited team...
    const { rows: membershipRows } = (await integrationDBExecuteQuery(
      `SELECT count(*)::int AS count
         FROM public.membership m
         JOIN public."user" u ON u.id = m.user_id
        WHERE m.team_id = '${team_id}' AND u.email = '${email}'`,
    )) as { rows: { count: number }[] };
    expect(membershipRows[0].count).toBe(1);

    // ...and the single-use invite is consumed exactly once.
    const { rowCount: remainingInvites } = await integrationDBExecuteQuery(
      `SELECT id FROM public.invite WHERE id = '${insertedInvite[0].id}'`,
    );
    expect(remainingInvites).toBe(0);
  });

  it("does not re-add a member when the invite was already consumed", async () => {
    const email = "test1-member@team2.example.com";
    const team_id = "team_d7cde14f17eda7e0ededba7ded6b4467";

    const { rows: insertedInvite } = (await integrationDBExecuteQuery(
      `INSERT INTO public.invite (team_id, expires_at, email) VALUES ('${team_id}', '2030-01-01 00:00:00+00', '${email}') RETURNING id`,
    )) as { rows: { id: string }[] };

    const url = new URL("/login-callback", "http://localhost:3000");
    url.searchParams.append("invite_id", insertedInvite[0].id);
    const mockReq = { nextUrl: url } as unknown as NextRequest;

    (getSession as jest.Mock).mockResolvedValue({
      user: { ...validEmailSessionUser, email },
    });

    // First acceptance succeeds and consumes the invite.
    const first = await loginCallback(mockReq);
    expect(first.headers.get("location")?.endsWith("/apps")).toBeTruthy();

    // Second attempt with the same (now-consumed) invite must not create a
    // second membership; it falls through to the logout redirect.
    const second = await loginCallback(mockReq);
    expect(
      second.headers.get("location")?.includes("/api/auth/logout"),
    ).toBeTruthy();

    const { rows: membershipRows } = (await integrationDBExecuteQuery(
      `SELECT count(*)::int AS count
         FROM public.membership m
         JOIN public."user" u ON u.id = m.user_id
        WHERE m.team_id = '${team_id}' AND u.email = '${email}'`,
    )) as { rows: { count: number }[] };
    expect(membershipRows[0].count).toBe(1);
  });
});
