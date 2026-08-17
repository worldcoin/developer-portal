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
    expect(
      response.headers.get("location")?.endsWith("/dashboard"),
    ).toBeTruthy();
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
    expect(
      response.headers.get("location")?.endsWith("/dashboard"),
    ).toBeTruthy();
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

    expect(
      response.headers.get("location")?.endsWith("/dashboard"),
    ).toBeTruthy();
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
    expect(
      response.headers.get("location")?.endsWith("/dashboard"),
    ).toBeTruthy();
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
    expect(
      response.headers.get("location")?.endsWith("/dashboard"),
    ).toBeTruthy();
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
    expect(
      response.headers.get("location")?.endsWith("/dashboard"),
    ).toBeTruthy();
  });

  // Regression test for HackerOne #3943242. This handler is a GET reached as the
  // tail of the Auth0 redirect chain, so it cannot demand
  // `Sec-Fetch-Site: same-origin` and any cross-site top-level navigation can
  // drive it with the SameSite=Lax session cookie attached. It therefore must not
  // consume the invite: it only forwards it to the consent screen, where an
  // explicit POST claims it.
  it("routes an invited existing user to consent without consuming the invite", async () => {
    const email = "test1-member@team2.example.com";
    const team_id = "team_d7cde14f17eda7e0ededba7ded6b4467";

    const { rows: insertedInvite } = (await integrationDBExecuteQuery(
      `INSERT INTO public.invite (team_id, expires_at, email) VALUES ($1, '2030-01-01 00:00:00+00', $2) RETURNING id`,
      [team_id, email],
    )) as { rows: { id: string }[] };

    const url = new URL("/login-callback", "http://localhost:3000");
    url.searchParams.append("invite_id", insertedInvite[0].id);

    const mockReq = {
      nextUrl: url,
    } as unknown as NextRequest;

    (getSession as jest.Mock).mockResolvedValue({
      user: { ...validEmailSessionUser, email },
    });

    const response = await loginCallback(mockReq);

    expect(getSession).toHaveReturned();
    expect(
      response.headers
        .get("location")
        ?.endsWith(`/join-callback?invite_id=${insertedInvite[0].id}`),
    ).toBeTruthy();

    // The single-use invite is untouched...
    const { rowCount: remainingInvites } = await integrationDBExecuteQuery(
      `SELECT id FROM public.invite WHERE id = $1`,
      [insertedInvite[0].id],
    );
    expect(remainingInvites).toBe(1);

    // ...and no membership was created.
    const { rows: membershipRows } = (await integrationDBExecuteQuery(
      `SELECT count(*)::int AS count
         FROM public.membership m
         JOIN public."user" u ON u.id = m.user_id
        WHERE m.team_id = $1 AND u.email = $2`,
      [team_id, email],
    )) as { rows: { count: number }[] };
    expect(membershipRows[0].count).toBe(0);
  });

  // The email-match guard never applied to Sign-in-with-World-ID sessions (they
  // carry no email), so before #3943242 was fixed an attacker needed to know
  // nothing at all about a World ID victim. Non-consumption is the only thing
  // standing between a cross-site link and a forced join here.
  it("routes an invited World ID user to consent without consuming the invite", async () => {
    const inviteEmail = "invited-world-user@example.com";
    const team_id = "team_2222214f17eda7e0ededba7ded6b4222";

    await integrationDBExecuteQuery(
      `UPDATE public."user" SET "auth0Id" = $1, name = $2 WHERE world_id_nullifier = '0x123'`,
      [validNullifierSessionUser.sub, validNullifierSessionUser.name],
    );

    const { rows: insertedInvite } = (await integrationDBExecuteQuery(
      `INSERT INTO public.invite (team_id, expires_at, email) VALUES ($1, '2030-01-01 00:00:00+00', $2) RETURNING id`,
      [team_id, inviteEmail],
    )) as { rows: { id: string }[] };

    const url = new URL("/login-callback", "http://localhost:3000");
    url.searchParams.append("invite_id", insertedInvite[0].id);

    const mockReq = {
      nextUrl: url,
    } as unknown as NextRequest;

    (getSession as jest.Mock).mockResolvedValue({
      user: validNullifierSessionUser,
    });

    const response = await loginCallback(mockReq);

    expect(getSession).toHaveReturned();
    expect(
      response.headers
        .get("location")
        ?.endsWith(`/join-callback?invite_id=${insertedInvite[0].id}`),
    ).toBeTruthy();

    const { rowCount: remainingInvites } = await integrationDBExecuteQuery(
      `SELECT id FROM public.invite WHERE id = $1`,
      [insertedInvite[0].id],
    );
    expect(remainingInvites).toBe(1);

    const { rows: membershipRows } = (await integrationDBExecuteQuery(
      `SELECT count(*)::int AS count
         FROM public.membership m
         JOIN public."user" u ON u.id = m.user_id
        WHERE m.team_id = $1 AND u.world_id_nullifier = '0x123'`,
      [team_id],
    )) as { rows: { count: number }[] };
    expect(membershipRows[0].count).toBe(0);
  });

  // A bogus invite_id used to redirect to /api/auth/logout, so any cross-site
  // link force-logged-out any authenticated developer with no attacker account
  // required. The invite is no longer read here at all, so there is nothing to
  // fail on: the visitor is handed to the consent screen, which reports the bad
  // invite without ending their session.
  it("does not log the user out for an unknown invite_id", async () => {
    const url = new URL("/login-callback", "http://localhost:3000");
    url.searchParams.append("invite_id", "no_such_invite");

    const mockReq = { nextUrl: url } as unknown as NextRequest;

    (getSession as jest.Mock).mockResolvedValue({
      user: validEmailSessionUser,
    });

    const response = await loginCallback(mockReq);

    expect(response.headers.get("location")).not.toContain("/api/auth/logout");
    expect(
      response.headers
        .get("location")
        ?.endsWith("/join-callback?invite_id=no_such_invite"),
    ).toBeTruthy();
  });
});
