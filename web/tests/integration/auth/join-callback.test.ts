import { POST } from "@/api/join-callback";
import { Auth0User } from "@/lib/types";
import { auth0 } from "@/lib/auth0";
import { IroncladActivityApi } from "@/lib/ironclad-activity-api";
import { NextRequest } from "next/server";

import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { gql } from "@apollo/client";
import { integrationDBClean, integrationDBExecuteQuery } from "../setup";

// TODO: Consider moving this to a generalized jest environment
beforeEach(integrationDBClean);
const validSessionUser = {
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
  sub: "oauth2|worldcoin|0x123",
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
  toSessionRequest: (req: unknown) => req,
}));

const getSession = auth0.getSession as jest.Mock;
const updateSession = auth0.updateSession as jest.Mock;

jest.mock("../../../lib/ironclad-activity-api", () => ({
  IroncladActivityApi: jest.fn().mockImplementation(() => ({
    sendAcceptance: jest.fn(() => Promise.resolve()),
  })),
}));

jest.mock("next/headers", () => ({
  headers: () => {
    return {
      [Symbol.iterator]: function* () {
        yield* [[]];
      },

      forEach: jest.fn(),
      get: jest.fn(),
    };
  },
}));

const APP_ORIGIN = "http://localhost:3000";

const createMockRequest = (
  body: Record<string, unknown>,
  headers: Record<string, string> = { "sec-fetch-site": "same-origin" },
) =>
  new NextRequest(`${APP_ORIGIN}/api/join-callback`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });

describe("test /join-callback", () => {
  beforeEach(() => {
    (getSession as jest.Mock).mockReset();
    (updateSession as jest.Mock).mockReset();
    (IroncladActivityApi as unknown as jest.Mock).mockClear();
  });

  it("rejects a request the browser reports as cross-site", async () => {
    const team_id = "team_d7cde14f17eda7e0ededba7ded6b4467";
    const email = "csrf-join@world.org";

    const { rows: insertedInvite } = (await integrationDBExecuteQuery(
      `INSERT INTO public.invite (team_id, expires_at, email) VALUES ('${team_id}', '2030-01-01 00:00:00+00', '${email}') RETURNING id`,
    )) as { rows: { id: string }[] };

    (getSession as jest.Mock).mockResolvedValue({
      user: { ...validSessionUser, email, sub: "email|csrf-join" },
    });

    const response = await POST(
      createMockRequest(
        { invite_id: insertedInvite[0].id },
        { "sec-fetch-site": "cross-site" },
      ),
    );

    expect(response.status).toEqual(403);
    expect((await response.json()).code).toEqual("cross_origin_request");

    const { rowCount: remainingInvites } = await integrationDBExecuteQuery(
      `SELECT id FROM public.invite WHERE id = $1`,
      [insertedInvite[0].id],
    );
    expect(remainingInvites).toBe(1);
    expect(updateSession).not.toHaveBeenCalled();
  });

  it("rejects a same-site request from a sibling subdomain", async () => {
    (getSession as jest.Mock).mockResolvedValue({ user: validSessionUser });

    const response = await POST(
      createMockRequest(
        { invite_id: "inv_same_site" },
        { "sec-fetch-site": "same-site" },
      ),
    );

    expect(response.status).toEqual(403);
    expect((await response.json()).code).toEqual("cross_origin_request");
    expect(updateSession).not.toHaveBeenCalled();
  });

  it("rejects a user-initiated top-level navigation", async () => {
    (getSession as jest.Mock).mockResolvedValue({ user: validSessionUser });

    const response = await POST(
      createMockRequest(
        { invite_id: "inv_none" },
        { "sec-fetch-site": "none" },
      ),
    );

    expect(response.status).toEqual(403);
    expect((await response.json()).code).toEqual("cross_origin_request");
    expect(updateSession).not.toHaveBeenCalled();
  });

  it("fails closed when the request carries no origin metadata", async () => {
    (getSession as jest.Mock).mockResolvedValue({ user: validSessionUser });

    const response = await POST(
      createMockRequest({ invite_id: "inv_missing_origin" }, {}),
    );

    expect(response.status).toEqual(403);
    expect((await response.json()).code).toEqual("cross_origin_request");
    expect(updateSession).not.toHaveBeenCalled();
  });

  it("should return 401 if session is not found", async () => {
    (getSession as jest.Mock).mockResolvedValue(null);
    const response = await POST(createMockRequest({ user: {} }));

    expect(getSession).toHaveReturned();
    expect(response.status).toEqual(401);
  });

  it("should return 400 if body is invalid", async () => {
    (getSession as jest.Mock).mockResolvedValue({ user: validSessionUser });
    const response = await POST(createMockRequest({}));
    expect(response.status).toEqual(400);
  });

  it("should send acceptance if user does not exist", async () => {
    const email = "new-email-test@world.org";
    const team_id = "team_d7cde14f17eda7e0ededba7ded6b4467";

    const { rows: insertedInvite } = (await integrationDBExecuteQuery(
      `INSERT INTO public.invite (team_id, expires_at, email) VALUES ('${team_id}', '2030-01-01 00:00:00+00', '${email}') RETURNING  id, team_id, email`,
    )) as { rows: { id: string; team_id: string; email: string }[] };

    const mockSession = {
      user: {
        ...validSessionUser,
        email: "new-email-test@world.org",
        sub: "email|new-email-test@world.org",
      },
    };

    (getSession as jest.Mock).mockResolvedValue(mockSession);
    const response = await POST(
      createMockRequest({ invite_id: insertedInvite[0].id }),
    );
    expect({ status: response.status, body: await response.json() }).toEqual({
      status: 200,
      body: { returnTo: `/teams/${team_id}` },
    });
  });

  it("should throw 400 if invite is expired", async () => {
    const email = "new-email-test@world.org";
    const team_id = "team_d7cde14f17eda7e0ededba7ded6b4467";

    const { rows: insertedInvite } = (await integrationDBExecuteQuery(
      `INSERT INTO public.invite (team_id, expires_at, email) VALUES ('${team_id}', '2000-01-01 00:00:00+00', '${email}') RETURNING  id, team_id, email`,
    )) as { rows: { id: string; team_id: string; email: string }[] };

    const mockSession = {
      user: {
        ...validSessionUser,
        email: "new-email-test@world.org",
        sub: "email|new-email-test@world.org",
      },
    };

    (getSession as jest.Mock).mockResolvedValue(mockSession);
    const response = await POST(
      createMockRequest({ invite_id: insertedInvite[0].id }),
    );
    expect(response.status).toEqual(400);
    expect(await response.json()).toEqual(
      expect.objectContaining({ code: "invalid_invite" }),
    );
  });

  it("should throw 400 if there is no invite", async () => {
    const mockSession = {
      user: {
        ...validSessionUser,
        email: "new-email-test@world.org",
        sub: "email|new-email-test@world.org",
      },
    };

    (getSession as jest.Mock).mockResolvedValue(mockSession);
    const response = await POST(createMockRequest({ invite_id: "123" }));
    expect(response.status).toEqual(400);
    expect(await response.json()).toEqual(
      expect.objectContaining({ code: "invalid_invite" }),
    );
  });

  it("should update session successfully", async () => {
    const email = "new-email-test2@world.org";
    const team_id = "team_d7cde14f17eda7e0ededba7ded6b4467";

    const { rows: insertedInvite } = (await integrationDBExecuteQuery(
      `INSERT INTO public.invite (team_id, expires_at, email) VALUES ('${team_id}', '2030-01-01 00:00:00+00', '${email}') RETURNING  id, team_id, email`,
    )) as { rows: { id: string; team_id: string; email: string }[] };

    const mockReq = createMockRequest({ invite_id: insertedInvite[0].id });

    const mockSession = {
      user: {
        ...validSessionUser,
        email,
      },
    };

    (getSession as jest.Mock).mockResolvedValue(mockSession);
    const response = await POST(mockReq);
    const body = await response.json();
    expect(getSession).toHaveBeenCalledWith();

    const userQuery = gql`
      query FetchUser($email: String!) {
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

    const fetchedUser = await client.request<{
      user: Array<{
        id: string;
        email: string;
        name: string;
        auth0Id: string;
        posthog_id: string;
        is_allow_tracking: boolean;
        memberships: {
          team: {
            id: string;
            name: string;
          };
          role: string;
        }[];
      }>;
    }>(userQuery, {
      email,
    });

    expect(updateSession).toHaveBeenCalledWith(
      mockReq,
      expect.anything(),
      expect.objectContaining({
        user: expect.objectContaining({
          hasura: fetchedUser.user[0],
        }),
      }),
    );
    expect(updateSession).toHaveBeenCalledTimes(1);

    expect(response.status).toEqual(200);
    expect(body).toEqual({ returnTo: `/teams/${team_id}` });
    expect(fetchedUser.user[0]).toMatchObject({
      email,
      auth0Id: validSessionUser.sub,
      name: validSessionUser.name,
      memberships: [
        expect.objectContaining({
          role: "MEMBER",
          team: expect.objectContaining({ id: team_id }),
        }),
      ],
    });

    const { rowCount: remainingInvites } = await integrationDBExecuteQuery(
      `SELECT id FROM public.invite WHERE id = $1`,
      [insertedInvite[0].id],
    );
    expect(remainingInvites).toBe(0);
  });

  it("adds membership for an existing email user without creating a new user", async () => {
    const email = "test1-member@team2.example.com";
    const team_id = "team_d7cde14f17eda7e0ededba7ded6b4467";

    const { rows: insertedInvite } = (await integrationDBExecuteQuery(
      `INSERT INTO public.invite (team_id, expires_at, email) VALUES ('${team_id}', '2030-01-01 00:00:00+00', '${email}') RETURNING id`,
    )) as { rows: { id: string }[] };

    const { rows: usersBefore } = (await integrationDBExecuteQuery(
      `SELECT count(*)::int AS count FROM public."user" WHERE email = $1`,
      [email],
    )) as { rows: { count: number }[] };
    expect(usersBefore[0].count).toBe(1);

    (getSession as jest.Mock).mockResolvedValue({
      user: { ...validSessionUser, email },
    });

    const response = await POST(
      createMockRequest({ invite_id: insertedInvite[0].id }),
    );

    expect(response.status).toEqual(200);
    expect(await response.json()).toEqual({ returnTo: `/teams/${team_id}` });
    expect(IroncladActivityApi).not.toHaveBeenCalled();

    const { rows: membershipRows } = (await integrationDBExecuteQuery(
      `SELECT m.role
         FROM public.membership m
         JOIN public."user" u ON u.id = m.user_id
        WHERE m.team_id = $1 AND u.email = $2`,
      [team_id, email],
    )) as { rows: { role: string }[] };
    expect(membershipRows).toEqual([{ role: "MEMBER" }]);

    const { rows: usersAfter } = (await integrationDBExecuteQuery(
      `SELECT count(*)::int AS count FROM public."user" WHERE email = $1`,
      [email],
    )) as { rows: { count: number }[] };
    expect(usersAfter[0].count).toBe(1);
  });

  it("looks up an existing invitee by email ignoring case when auth0Id does not match", async () => {
    const storedEmail = "Test1-Member@Team2.Example.com";
    const auth0Email = "  TEST1-MEMBER@TEAM2.EXAMPLE.COM  ";
    const team_id = "team_d7cde14f17eda7e0ededba7ded6b4467";
    const oldAuth0Id = "email|old-casing-sub";
    const newAuth0Id = "email|new-casing-sub";

    const { rows: existingUsers } = (await integrationDBExecuteQuery(
      `UPDATE public."user"
          SET email = $1, "auth0Id" = $2
        WHERE email = $3
        RETURNING id`,
      [storedEmail, oldAuth0Id, "test1-member@team2.example.com"],
    )) as { rows: { id: string }[] };
    expect(existingUsers).toHaveLength(1);

    const { rows: insertedInvite } = (await integrationDBExecuteQuery(
      `INSERT INTO public.invite (team_id, expires_at, email)
       VALUES ($1, '2030-01-01 00:00:00+00', $2)
       RETURNING id`,
      [team_id, "test1-member@team2.example.com"],
    )) as { rows: { id: string }[] };

    (getSession as jest.Mock).mockResolvedValue({
      user: {
        ...validSessionUser,
        email: auth0Email,
        sub: newAuth0Id,
      },
    });

    const response = await POST(
      createMockRequest({ invite_id: insertedInvite[0].id }),
    );

    expect(response.status).toEqual(200);
    expect(await response.json()).toEqual({ returnTo: `/teams/${team_id}` });
    expect(IroncladActivityApi).not.toHaveBeenCalled();

    const { rows: usersAfter } = (await integrationDBExecuteQuery(
      `SELECT id, email, "auth0Id"
         FROM public."user"
        WHERE lower(email) = lower($1)`,
      [storedEmail],
    )) as { rows: { id: string; email: string; auth0Id: string }[] };
    expect(usersAfter).toEqual([
      {
        id: existingUsers[0].id,
        email: storedEmail,
        auth0Id: oldAuth0Id,
      },
    ]);

    const { rows: membershipRows } = (await integrationDBExecuteQuery(
      `SELECT m.role
         FROM public.membership m
        WHERE m.team_id = $1 AND m.user_id = $2`,
      [team_id, existingUsers[0].id],
    )) as { rows: { role: string }[] };
    expect(membershipRows).toEqual([{ role: "MEMBER" }]);
  });

  // Regression test for HackerOne #3967911. A Sign-in-with-World-ID session
  // carries no email claim, so it can never demonstrate control of the address
  // an invite names. It used to skip the ownership check altogether, letting any
  // holder of an invite_id join an arbitrary team from an unrelated wallet
  // account. The invite must survive the refusal so the rightful invitee can
  // still use it.
  it("refuses a World ID session, which has no email to match the invite", async () => {
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

    (getSession as jest.Mock).mockResolvedValue({
      user: validNullifierSessionUser,
    });

    const response = await POST(
      createMockRequest({ invite_id: insertedInvite[0].id }),
    );

    expect(response.status).toEqual(403);
    expect(await response.json()).toEqual(
      expect.objectContaining({ code: "invite_requires_verified_email" }),
    );
    expect(updateSession).not.toHaveBeenCalled();

    const { rows: membershipRows } = (await integrationDBExecuteQuery(
      `SELECT m.role
         FROM public.membership m
         JOIN public."user" u ON u.id = m.user_id
        WHERE m.team_id = $1 AND u.world_id_nullifier = '0x123'`,
      [team_id],
    )) as { rows: { role: string }[] };
    expect(membershipRows).toEqual([]);

    const { rowCount: remainingInvites } = await integrationDBExecuteQuery(
      `SELECT id FROM public.invite WHERE id = $1`,
      [insertedInvite[0].id],
    );
    expect(remainingInvites).toBe(1);
  });

  it("rejects when invite email does not match the logged-in email user", async () => {
    const team_id = "team_d7cde14f17eda7e0ededba7ded6b4467";

    const { rows: insertedInvite } = (await integrationDBExecuteQuery(
      `INSERT INTO public.invite (team_id, expires_at, email) VALUES ('${team_id}', '2030-01-01 00:00:00+00', 'other@example.com') RETURNING id`,
    )) as { rows: { id: string }[] };

    (getSession as jest.Mock).mockResolvedValue({
      user: {
        ...validSessionUser,
        email: "test1-member@team2.example.com",
      },
    });

    const response = await POST(
      createMockRequest({ invite_id: insertedInvite[0].id }),
    );

    expect(response.status).toEqual(403);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        code: "invite_email_mismatch",
        detail: "Invite email does not match logged in email.",
      }),
    );
    expect(updateSession).not.toHaveBeenCalled();

    const { rowCount: remainingInvites } = await integrationDBExecuteQuery(
      `SELECT id FROM public.invite WHERE id = $1`,
      [insertedInvite[0].id],
    );
    expect(remainingInvites).toBe(1);
  });

  // Regression test for HackerOne #3909762. The old mutation inserted a
  // membership before deleting the invite, so a null result from the losing
  // delete still committed a second membership. The DB function deletes first
  // and only the request that consumes the invite may insert a membership.
  //
  // The racers are now necessarily the same person: since #3967911 an invite can
  // only be accepted by a session holding the verified address it names, and
  // `user.email` is UNIQUE, so two distinct accounts can no longer contend for
  // one invite at all. What is left to prove is that a double submit (two tabs,
  // a retried request) still yields exactly one membership. The loser blocks on
  // the winner's row lock, then finds the invite gone and returns the membership
  // the winner just created rather than inserting a second one.
  it("creates only one membership when the same invitee accepts twice concurrently", async () => {
    const team_id = "team_d7cde14f17eda7e0ededba7ded6b4467";
    const email = "test1-member@team2.example.com";

    const { rows: insertedInvite } = (await integrationDBExecuteQuery(
      `INSERT INTO public.invite (team_id, expires_at, email)
       VALUES ($1, '2030-01-01 00:00:00+00', $2)
       RETURNING id`,
      [team_id, email],
    )) as { rows: { id: string }[] };

    const firstRequest = createMockRequest({
      invite_id: insertedInvite[0].id,
    });
    const secondRequest = createMockRequest({
      invite_id: insertedInvite[0].id,
    });

    getSession.mockResolvedValue({
      user: { ...validSessionUser, email, sub: "email|join-race" },
    });

    const responses = await Promise.all([
      POST(firstRequest),
      POST(secondRequest),
    ]);

    expect(responses.map((response) => response.status)).toEqual([200, 200]);
    expect(await responses[0].json()).toEqual({
      returnTo: `/teams/${team_id}`,
    });

    const { rows: membershipRows } = (await integrationDBExecuteQuery(
      `SELECT m.role
         FROM public.membership m
         JOIN public."user" u ON u.id = m.user_id
        WHERE m.team_id = $1 AND u.email = $2`,
      [team_id, email],
    )) as { rows: { role: string }[] };

    expect(membershipRows).toEqual([{ role: "MEMBER" }]);

    const { rowCount: remainingInvites } = await integrationDBExecuteQuery(
      `SELECT id FROM public.invite WHERE id = $1`,
      [insertedInvite[0].id],
    );
    expect(remainingInvites).toBe(0);

    expect(updateSession.mock.calls[0][2]).toEqual(
      expect.objectContaining({
        user: expect.objectContaining({
          hasura: expect.objectContaining({
            memberships: expect.arrayContaining([
              expect.objectContaining({
                role: "MEMBER",
                team: expect.objectContaining({ id: team_id }),
              }),
            ]),
          }),
        }),
      }),
    );
  });
});
