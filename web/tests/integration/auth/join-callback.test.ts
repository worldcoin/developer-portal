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

  it("should return 401 if session is not found", async () => {
    const mockReq = {
      json: () => Promise.resolve({ user: {} }),
    } as unknown as NextRequest;

    (getSession as jest.Mock).mockResolvedValue(null);
    const response = await POST(mockReq);

    expect(getSession).toHaveReturned();
    expect(response.status).toEqual(401);
  });

  it("should return 400 if body is invalid", async () => {
    const mockReq = {
      json: () => Promise.resolve({}),
    } as unknown as NextRequest;

    const mockSession = {
      user: validSessionUser,
    };

    (getSession as jest.Mock).mockResolvedValue(mockSession);
    const response = await POST(mockReq);
    expect(response.status).toEqual(400);
  });

  it("should send acceptance if user does not exist", async () => {
    const email = "new-email-test@world.org";
    const team_id = "team_d7cde14f17eda7e0ededba7ded6b4467";

    const { rows: insertedInvite } = (await integrationDBExecuteQuery(
      `INSERT INTO public.invite (team_id, expires_at, email) VALUES ('${team_id}', '2030-01-01 00:00:00+00', '${email}') RETURNING  id, team_id, email`,
    )) as { rows: { id: string; team_id: string; email: string }[] };

    const mockReq = {
      json: () => Promise.resolve({ invite_id: insertedInvite[0].id }),
    } as unknown as NextRequest;

    const mockSession = {
      user: {
        ...validSessionUser,
        email: "new-email-test@world.org",
        sub: "email|new-email-test@world.org",
      },
    };

    (getSession as jest.Mock).mockResolvedValue(mockSession);
    const response = await POST(mockReq);
    expect(response.status).not.toEqual(500);
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
    const team_id = "team_d7cde14f17eda7e0ededba7ded6b4467";

    const { rows: insertedInvite } = (await integrationDBExecuteQuery(
      `INSERT INTO public.invite (team_id, expires_at, email) VALUES ('${team_id}', '2000-01-01 00:00:00+00', '${email}') RETURNING  id, team_id, email`,
    )) as { rows: { id: string; team_id: string; email: string }[] };

    const mockReq = {
      json: () => Promise.resolve({ invite_id: insertedInvite[0].id }),
    } as unknown as NextRequest;

    const mockSession = {
      user: {
        ...validSessionUser,
        email: "new-email-test@world.org",
        sub: "email|new-email-test@world.org",
      },
    };

    (getSession as jest.Mock).mockResolvedValue(mockSession);
    const response = await POST(mockReq);
    expect(response.status).toEqual(400);
  });

  it("should throw 400 if there is no invite", async () => {
    const mockReq = {
      json: () => Promise.resolve({ invite_id: "123" }),
    } as unknown as NextRequest;

    const mockSession = {
      user: {
        ...validSessionUser,
        email: "new-email-test@world.org",
        sub: "email|new-email-test@world.org",
      },
    };

    (getSession as jest.Mock).mockResolvedValue(mockSession);
    const response = await POST(mockReq);
    expect(response.status).toEqual(400);
  });

  it("should update session successfully", async () => {
    const email = "new-email-test2@world.org";
    const team_id = "team_d7cde14f17eda7e0ededba7ded6b4467";

    const { rows: insertedInvite } = (await integrationDBExecuteQuery(
      `INSERT INTO public.invite (team_id, expires_at, email) VALUES ('${team_id}', '2030-01-01 00:00:00+00', '${email}') RETURNING  id, team_id, email`,
    )) as { rows: { id: string; team_id: string; email: string }[] };

    const mockReq = {
      json: () => Promise.resolve({ invite_id: insertedInvite[0].id }),
    } as unknown as NextRequest;

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

  // Regression test for HackerOne #3909762. The old mutation inserted a
  // membership before deleting the invite, so a null result from the losing
  // delete still committed a second membership. The DB function deletes first
  // and only the request that consumes the invite may insert a membership.
  it("creates only one membership when two new users accept the same invite concurrently", async () => {
    const team_id = "team_d7cde14f17eda7e0ededba7ded6b4467";
    const firstAuth0Id = "oauth2|worldcoin|join-race-first";
    const secondAuth0Id = "oauth2|worldcoin|join-race-second";

    const { rows: insertedInvite } = (await integrationDBExecuteQuery(
      `INSERT INTO public.invite (team_id, expires_at, email)
       VALUES ($1, '2030-01-01 00:00:00+00', 'join-race@example.com')
       RETURNING id`,
      [team_id],
    )) as { rows: { id: string }[] };

    const firstRequest = {
      json: () => Promise.resolve({ invite_id: insertedInvite[0].id }),
    } as unknown as NextRequest;
    const secondRequest = {
      json: () => Promise.resolve({ invite_id: insertedInvite[0].id }),
    } as unknown as NextRequest;

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
      returnTo: `/teams/${team_id}`,
    });
    expect(await rejectedResponse?.json()).toEqual(
      expect.objectContaining({ code: "invalid_invite" }),
    );

    const { rows: membershipRows } = (await integrationDBExecuteQuery(
      `SELECT m.role, u."auth0Id"
         FROM public.membership m
         JOIN public."user" u ON u.id = m.user_id
        WHERE m.team_id = $1 AND u."auth0Id" = ANY($2::text[])`,
      [team_id, [firstAuth0Id, secondAuth0Id]],
    )) as { rows: { role: string; auth0Id: string }[] };

    expect(membershipRows).toHaveLength(1);
    expect(membershipRows[0]).toEqual({
      role: "MEMBER",
      auth0Id: expect.stringMatching(
        /^(oauth2\|worldcoin\|join-race-first|oauth2\|worldcoin\|join-race-second)$/,
      ),
    });

    const { rowCount: remainingInvites } = await integrationDBExecuteQuery(
      `SELECT id FROM public.invite WHERE id = $1`,
      [insertedInvite[0].id],
    );
    expect(remainingInvites).toBe(0);

    expect(updateSession).toHaveBeenCalledTimes(1);
    expect(updateSession.mock.calls[0][2]).toEqual(
      expect.objectContaining({
        user: expect.objectContaining({
          hasura: expect.objectContaining({
            auth0Id: membershipRows[0].auth0Id,
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
