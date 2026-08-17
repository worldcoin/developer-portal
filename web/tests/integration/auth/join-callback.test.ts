import { POST } from "@/api/join-callback";
import { Auth0User } from "@/lib/types";
import { auth0 } from "@/lib/auth0";
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
  sub: "oauth2|worldcoin|0x123", // NOTE: seeds are already created with nullifier in this format
  name: "Test World ID User",
  nickname: "test",
  picture: "https://example.com/test.png",
  updated_at: "2022-01-01T00:00:00.000Z",
  sid: "123",
} as Auth0User;

const TEAM_ONE = "team_d7cde14f17eda7e0ededba7ded6b4467";
const TEAM_TWO = "team_2222214f17eda7e0ededba7ded6b4222";

// Seeded: OWNER of TEAM_ONE, world_id_nullifier 0x123.
const SEEDED_OWNER_EMAIL = "test@world.org";
// Seeded: MEMBER of TEAM_TWO only, so it can be invited into TEAM_ONE.
const SEEDED_OTHER_TEAM_EMAIL = "test1-member@team2.example.com";

/**
 * The handler requires a same-origin request, so every mock has to carry the
 * header a browser would send on a `fetch()` from our own page. Tests that
 * exercise the guard itself pass their own headers.
 */
const makeRequest = (
  body: unknown,
  headers: Record<string, string> = { "sec-fetch-site": "same-origin" },
) =>
  ({
    json: () => Promise.resolve(body),
    headers: new Headers(headers),
  }) as unknown as NextRequest;

const insertInvite = async (
  team_id: string,
  email: string,
  expires_at = "2030-01-01 00:00:00+00",
) => {
  const { rows } = (await integrationDBExecuteQuery(
    `INSERT INTO public.invite (team_id, expires_at, email) VALUES ($1, $2, $3) RETURNING id`,
    [team_id, expires_at, email],
  )) as { rows: { id: string }[] };

  return rows[0].id;
};

const countInvites = async (invite_id: string) => {
  const { rowCount } = await integrationDBExecuteQuery(
    `SELECT id FROM public.invite WHERE id = $1`,
    [invite_id],
  );

  return rowCount;
};

const countMembershipsByEmail = async (team_id: string, email: string) => {
  const { rows } = (await integrationDBExecuteQuery(
    `SELECT count(*)::int AS count
       FROM public.membership m
       JOIN public."user" u ON u.id = m.user_id
      WHERE m.team_id = $1 AND u.email = $2`,
    [team_id, email],
  )) as { rows: { count: number }[] };

  return rows[0].count;
};

jest.mock("@/lib/auth0", () => ({
  auth0: {
    getSession: jest.fn(),
    updateSession: jest.fn(),
  },
  toSessionRequest: (req: unknown) => req,
}));

const getSession = auth0.getSession as jest.Mock;
const updateSession = auth0.updateSession as jest.Mock;

jest.mock("../../../lib/logger", () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

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

describe("test /join-callback", () => {
  beforeEach(() => {
    // Reset mocks before each test
    (getSession as jest.Mock).mockReset();
    (updateSession as jest.Mock).mockReset();
  });

  // #region Cross-site protection (HackerOne #3943242)
  // This endpoint is the only thing that consumes an invite, so it is the only
  // thing that has to prove the request came from our own UI. The session cookie
  // is SameSite=Lax and therefore not evidence of that.
  it.each([
    ["a cross-site request", { "sec-fetch-site": "cross-site" }],
    [
      "a same-site request from a sibling host",
      { "sec-fetch-site": "same-site" },
    ],
    ["a request carrying no origin signal at all", {}],
    ["a request from a foreign Origin", { origin: "https://evil.example.com" }],
  ])("rejects %s without consuming the invite", async (_label, headers) => {
    const invite_id = await insertInvite(TEAM_ONE, SEEDED_OTHER_TEAM_EMAIL);

    (getSession as jest.Mock).mockResolvedValue({
      user: { ...validSessionUser, email: SEEDED_OTHER_TEAM_EMAIL },
    });

    const response = await POST(makeRequest({ invite_id }, headers));

    expect(response.status).toEqual(403);
    expect(await response.json()).toEqual(
      expect.objectContaining({ code: "cross_origin_request" }),
    );

    expect(await countInvites(invite_id)).toBe(1);
    expect(
      await countMembershipsByEmail(TEAM_ONE, SEEDED_OTHER_TEAM_EMAIL),
    ).toBe(0);
    expect(updateSession).not.toHaveBeenCalled();
  });

  it("rejects a cross-site request before even reading the session", async () => {
    const response = await POST(
      makeRequest(
        { invite_id: "whatever" },
        { "sec-fetch-site": "cross-site" },
      ),
    );

    expect(response.status).toEqual(403);
    expect(getSession).not.toHaveBeenCalled();
  });
  // #endregion

  it("should return 401 if session is not found", async () => {
    const mockReq = makeRequest({ user: {} });

    (getSession as jest.Mock).mockResolvedValue(null);
    const response = await POST(mockReq);

    expect(getSession).toHaveReturned();
    expect(response.status).toEqual(401);
  });

  it("should return 400 if body is invalid", async () => {
    const mockReq = makeRequest({});

    (getSession as jest.Mock).mockResolvedValue({ user: validSessionUser });
    const response = await POST(mockReq);
    expect(response.status).toEqual(400);
  });

  it("should send acceptance if user does not exist", async () => {
    const email = "new-email-test@world.org";
    const invite_id = await insertInvite(TEAM_ONE, email);

    const mockReq = makeRequest({ invite_id });

    (getSession as jest.Mock).mockResolvedValue({
      user: {
        ...validSessionUser,
        email,
        sub: "email|new-email-test@world.org",
      },
    });

    const response = await POST(mockReq);
    const body = await response.json();

    expect(body).not.toEqual(
      expect.objectContaining({
        code: "server_error",
        detail: "Failed to send acceptance",
        attribute: null,
      }),
    );

    expect(response.status).toEqual(200);
  });

  it("should throw 400 if invite is expired", async () => {
    const email = "new-email-test@world.org";
    const invite_id = await insertInvite(
      TEAM_ONE,
      email,
      "2000-01-01 00:00:00+00",
    );

    const mockReq = makeRequest({ invite_id });

    (getSession as jest.Mock).mockResolvedValue({
      user: {
        ...validSessionUser,
        email,
        sub: "email|new-email-test@world.org",
      },
    });

    const response = await POST(mockReq);
    expect(response.status).toEqual(400);

    // An expired invite is rejected, not consumed.
    expect(await countInvites(invite_id)).toBe(1);
  });

  it("should throw 400 if there is no invite", async () => {
    const mockReq = makeRequest({ invite_id: "123" });

    (getSession as jest.Mock).mockResolvedValue({
      user: {
        ...validSessionUser,
        email: "new-email-test@world.org",
        sub: "email|new-email-test@world.org",
      },
    });

    const response = await POST(mockReq);
    expect(response.status).toEqual(400);
  });

  it("rejects an invite minted for a different email", async () => {
    const invite_id = await insertInvite(TEAM_ONE, "someone-else@world.org");

    (getSession as jest.Mock).mockResolvedValue({
      user: { ...validSessionUser, email: SEEDED_OTHER_TEAM_EMAIL },
    });

    const response = await POST(makeRequest({ invite_id }));

    expect(response.status).toEqual(403);
    expect(await response.json()).toEqual(
      expect.objectContaining({ code: "invite_email_mismatch" }),
    );
    expect(await countInvites(invite_id)).toBe(1);
  });

  it("matches the invite email case- and whitespace-insensitively", async () => {
    const invite_id = await insertInvite(
      TEAM_ONE,
      SEEDED_OTHER_TEAM_EMAIL.toUpperCase(),
    );

    (getSession as jest.Mock).mockResolvedValue({
      user: { ...validSessionUser, email: SEEDED_OTHER_TEAM_EMAIL },
    });

    const response = await POST(makeRequest({ invite_id }));

    expect(response.status).toEqual(200);
    expect(await countInvites(invite_id)).toBe(0);
  });

  it("should update session successfully", async () => {
    const email = "new-email-test2@world.org";
    const invite_id = await insertInvite(TEAM_ONE, email);

    const mockReq = makeRequest({ invite_id });

    (getSession as jest.Mock).mockResolvedValue({
      user: { ...validSessionUser, email },
    });

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
    expect(body).toEqual({ returnTo: `/teams/${TEAM_ONE}` });
    expect(fetchedUser.user[0]).toMatchObject({
      email,
      auth0Id: validSessionUser.sub,
      name: validSessionUser.name,
      memberships: [
        expect.objectContaining({
          role: "MEMBER",
          team: expect.objectContaining({ id: TEAM_ONE }),
        }),
      ],
    });

    expect(await countInvites(invite_id)).toBe(0);
  });

  // #region Already-onboarded users
  // login-callback no longer consumes invites, so this endpoint is now the accept
  // path for users who already have a Hasura row — it must add the membership
  // without trying to onboard them a second time.
  it("accepts an invite for an existing user without creating a second user row", async () => {
    const invite_id = await insertInvite(TEAM_ONE, SEEDED_OTHER_TEAM_EMAIL);

    (getSession as jest.Mock).mockResolvedValue({
      user: { ...validSessionUser, email: SEEDED_OTHER_TEAM_EMAIL },
    });

    const response = await POST(makeRequest({ invite_id }));

    expect(response.status).toEqual(200);
    expect(await response.json()).toEqual({ returnTo: `/teams/${TEAM_ONE}` });

    const { rows: userRows } = (await integrationDBExecuteQuery(
      `SELECT count(*)::int AS count FROM public."user" WHERE email = $1`,
      [SEEDED_OTHER_TEAM_EMAIL],
    )) as { rows: { count: number }[] };
    expect(userRows[0].count).toBe(1);

    expect(
      await countMembershipsByEmail(TEAM_ONE, SEEDED_OTHER_TEAM_EMAIL),
    ).toBe(1);
    expect(await countInvites(invite_id)).toBe(0);

    // The pre-existing membership in the other team survives.
    expect(
      await countMembershipsByEmail(TEAM_TWO, SEEDED_OTHER_TEAM_EMAIL),
    ).toBe(1);
  });

  it("accepts an invite for an existing World ID user with no email to match", async () => {
    const invite_id = await insertInvite(TEAM_TWO, "unrelated@example.com");

    (getSession as jest.Mock).mockResolvedValue({
      user: validNullifierSessionUser,
    });

    const response = await POST(makeRequest({ invite_id }));

    expect(response.status).toEqual(200);
    expect(await response.json()).toEqual({ returnTo: `/teams/${TEAM_TWO}` });

    const { rows: membershipRows } = (await integrationDBExecuteQuery(
      `SELECT count(*)::int AS count
         FROM public.membership m
         JOIN public."user" u ON u.id = m.user_id
        WHERE m.team_id = $1 AND u.world_id_nullifier = '0x123'`,
      [TEAM_TWO],
    )) as { rows: { count: number }[] };
    expect(membershipRows[0].count).toBe(1);

    expect(await countInvites(invite_id)).toBe(0);
  });

  // There is no UNIQUE(team_id, user_id) on membership, and
  // invite_team_members' "already in the team" guard compares the raw stored
  // email — so a differently-cased address (or a World-ID-only member whose
  // email is NULL) can still be handed an invite for a team they are already in.
  // accept_team_invite must return the existing membership rather than add a
  // second one.
  it("does not duplicate a membership when the user is already in the team", async () => {
    const invite_id = await insertInvite(TEAM_ONE, SEEDED_OWNER_EMAIL);

    (getSession as jest.Mock).mockResolvedValue({
      user: { ...validSessionUser, email: SEEDED_OWNER_EMAIL },
    });

    const response = await POST(makeRequest({ invite_id }));

    expect(response.status).toEqual(200);
    expect(await countMembershipsByEmail(TEAM_ONE, SEEDED_OWNER_EMAIL)).toBe(1);
    expect(await countInvites(invite_id)).toBe(0);

    // The seeded OWNER is not demoted to MEMBER by accepting the invite.
    const { rows: roleRows } = (await integrationDBExecuteQuery(
      `SELECT m.role
         FROM public.membership m
         JOIN public."user" u ON u.id = m.user_id
        WHERE m.team_id = $1 AND u.email = $2`,
      [TEAM_ONE, SEEDED_OWNER_EMAIL],
    )) as { rows: { role: string }[] };
    expect(roleRows[0].role).toBe("OWNER");
  });
  // #endregion

  // #region Single-use invite guarantees (HackerOne #3857870 / #3909762)
  // Regression test for HackerOne #3909762. The old mutation inserted a
  // membership before deleting the invite, so a null result from the losing
  // delete still committed a second membership. The DB function deletes first
  // and only the request that consumes the invite may insert a membership.
  it("creates only one membership when two new users accept the same invite concurrently", async () => {
    const firstAuth0Id = "oauth2|worldcoin|join-race-first";
    const secondAuth0Id = "oauth2|worldcoin|join-race-second";

    const invite_id = await insertInvite(TEAM_ONE, "join-race@example.com");

    const firstRequest = makeRequest({ invite_id });
    const secondRequest = makeRequest({ invite_id });

    const firstSession = {
      user: {
        ...validSessionUser,
        email: undefined,
        email_verified: false,
        sub: firstAuth0Id,
        name: "Race User One",
      },
    };
    const secondSession = {
      user: {
        ...validSessionUser,
        email: undefined,
        email_verified: false,
        sub: secondAuth0Id,
        name: "Race User Two",
      },
    };

    getSession
      .mockResolvedValueOnce(firstSession)
      .mockResolvedValueOnce(secondSession);

    const responses = await Promise.all([
      POST(firstRequest),
      POST(secondRequest),
    ]);
    const successResponse = responses.find(
      (response) => response.status === 200,
    );
    const rejectedResponse = responses.find(
      (response) => response.status === 400,
    );

    expect(responses.map((response) => response.status).sort()).toEqual([
      200, 400,
    ]);
    expect(await successResponse?.json()).toEqual({
      returnTo: `/teams/${TEAM_ONE}`,
    });
    expect(await rejectedResponse?.json()).toEqual(
      expect.objectContaining({ code: "invalid_invite" }),
    );

    const { rows: membershipRows } = (await integrationDBExecuteQuery(
      `SELECT m.role, u."auth0Id"
         FROM public.membership m
         JOIN public."user" u ON u.id = m.user_id
        WHERE m.team_id = $1 AND u."auth0Id" = ANY($2::text[])`,
      [TEAM_ONE, [firstAuth0Id, secondAuth0Id]],
    )) as { rows: { role: string; auth0Id: string }[] };

    expect(membershipRows).toHaveLength(1);
    expect(membershipRows[0]).toEqual({
      role: "MEMBER",
      auth0Id: expect.stringMatching(
        /^(oauth2\|worldcoin\|join-race-first|oauth2\|worldcoin\|join-race-second)$/,
      ),
    });

    expect(await countInvites(invite_id)).toBe(0);

    expect(updateSession).toHaveBeenCalledTimes(1);
    expect(updateSession.mock.calls[0][2]).toEqual(
      expect.objectContaining({
        user: expect.objectContaining({
          hasura: expect.objectContaining({
            auth0Id: membershipRows[0].auth0Id,
            memberships: expect.arrayContaining([
              expect.objectContaining({
                role: "MEMBER",
                team: expect.objectContaining({ id: TEAM_ONE }),
              }),
            ]),
          }),
        }),
      }),
    );
  });

  // Regression test for HackerOne #3857870, retargeted at this handler now that
  // it owns invite consumption: a burst from the same user (double-click, retry,
  // second tab) must still yield exactly one membership. The DELETE inside
  // accept_team_invite is the concurrency gate; losers observe the winner's
  // committed membership and succeed idempotently rather than erroring.
  it("consumes a single-use invite exactly once under a concurrent burst", async () => {
    const invite_id = await insertInvite(TEAM_ONE, SEEDED_OTHER_TEAM_EMAIL);

    (getSession as jest.Mock).mockResolvedValue({
      user: { ...validSessionUser, email: SEEDED_OTHER_TEAM_EMAIL },
    });

    const CONCURRENCY = 8;
    const responses = await Promise.all(
      Array.from({ length: CONCURRENCY }, () =>
        POST(makeRequest({ invite_id })),
      ),
    );

    expect(responses.every((response) => response.status === 200)).toBe(true);

    expect(
      await countMembershipsByEmail(TEAM_ONE, SEEDED_OTHER_TEAM_EMAIL),
    ).toBe(1);
    expect(await countInvites(invite_id)).toBe(0);
  });

  it("returns 400 when a different user replays an already-consumed invite", async () => {
    const invite_id = await insertInvite(TEAM_ONE, SEEDED_OTHER_TEAM_EMAIL);

    (getSession as jest.Mock).mockResolvedValue({
      user: { ...validSessionUser, email: SEEDED_OTHER_TEAM_EMAIL },
    });

    const first = await POST(makeRequest({ invite_id }));
    expect(first.status).toEqual(200);

    // A different World ID identity replaying the consumed invite gets nothing:
    // the invite row is gone and they hold no membership in that team.
    (getSession as jest.Mock).mockResolvedValue({
      user: validNullifierSessionUser,
    });

    const second = await POST(makeRequest({ invite_id }));
    expect(second.status).toEqual(400);

    expect(
      await countMembershipsByEmail(TEAM_ONE, SEEDED_OTHER_TEAM_EMAIL),
    ).toBe(1);
  });

  // Exercises the accept_team_invite DB function directly for the branches a
  // handler test can't force deterministically (a race between fetch and
  // consume): idempotent re-consume by the winner vs. an empty result for a
  // different user.
  it("accept_team_invite is idempotent for the winner and empty for others", async () => {
    const winner = "usr_a78f59e547fa5bd3d76bc1a1817c6d94"; // seeded in TEAM_TWO, not TEAM_ONE
    const loser = "usr_a78f59e547fa5bd3d76bc1a1817c6d93"; // seeded in TEAM_TWO, not TEAM_ONE

    const inviteId = await insertInvite(TEAM_ONE, "invite-fn@example.com");

    // First call consumes the invite and creates the membership.
    const first = await integrationDBExecuteQuery(
      `SELECT team_id, user_id, role FROM public.accept_team_invite($1, $2, $3)`,
      [inviteId, TEAM_ONE, winner],
    );
    expect(first.rows).toHaveLength(1);
    expect(first.rows[0]).toMatchObject({
      team_id: TEAM_ONE,
      user_id: winner,
      role: "MEMBER",
    });

    // Re-consuming the now-deleted invite as the same user is idempotent: it
    // returns the existing membership (not an empty result) and creates no
    // duplicate.
    const second = await integrationDBExecuteQuery(
      `SELECT team_id, user_id FROM public.accept_team_invite($1, $2, $3)`,
      [inviteId, TEAM_ONE, winner],
    );
    expect(second.rows).toHaveLength(1);
    expect(second.rows[0]).toMatchObject({
      team_id: TEAM_ONE,
      user_id: winner,
    });

    // A different user who never won the invite gets nothing.
    const other = await integrationDBExecuteQuery(
      `SELECT team_id, user_id FROM public.accept_team_invite($1, $2, $3)`,
      [inviteId, TEAM_ONE, loser],
    );
    expect(other.rows).toHaveLength(0);

    // Exactly one membership was created for the winner.
    const { rows: countRows } = (await integrationDBExecuteQuery(
      `SELECT count(*)::int AS count FROM public.membership WHERE team_id = $1 AND user_id = $2`,
      [TEAM_ONE, winner],
    )) as { rows: { count: number }[] };
    expect(countRows[0].count).toBe(1);
  });

  it("accept_team_invite consumes the invite but adds no row for an existing member", async () => {
    // usr_...d89 is the seeded OWNER of TEAM_ONE.
    const existingMember = "usr_a78f59e547fa5bd3d76bc1a1817c6d89";

    const inviteId = await insertInvite(TEAM_ONE, "already-member@example.com");

    const result = await integrationDBExecuteQuery(
      `SELECT team_id, user_id, role FROM public.accept_team_invite($1, $2, $3)`,
      [inviteId, TEAM_ONE, existingMember],
    );

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      team_id: TEAM_ONE,
      user_id: existingMember,
      role: "OWNER",
    });

    const { rows: countRows } = (await integrationDBExecuteQuery(
      `SELECT count(*)::int AS count FROM public.membership WHERE team_id = $1 AND user_id = $2`,
      [TEAM_ONE, existingMember],
    )) as { rows: { count: number }[] };
    expect(countRows[0].count).toBe(1);

    expect(await countInvites(inviteId)).toBe(0);
  });
  // #endregion
});
