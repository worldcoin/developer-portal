import { POST } from "@/api/create-team";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { Auth0User } from "@/lib/types";
import { gql } from "@apollo/client";
import { getSession, updateSession } from "@auth0/nextjs-auth0";
import { NextRequest } from "next/server";

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

// Mock the necessary imports
jest.mock("@auth0/nextjs-auth0", () => ({
  withApiAuthRequired: jest.fn((handler) => handler), // Accept and ignore the second argument
  getSession: jest.fn(() => ({
    user: {
      sub: "test",
    },
  })),
  updateSession: jest.fn(),
}));

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

describe("test /create-team", () => {
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
    const response = await POST(mockReq, {});

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
    const response = await POST(mockReq, {});
    expect(response.status).toEqual(400);
  });

  it("Should send acceptance if user does not exist", async () => {
    const mockReq = {
      json: () => Promise.resolve({ team_name: "Test Team 2", hasUser: false }),
    } as unknown as NextRequest;

    const mockSession = {
      user: {
        ...validSessionUser,
        email: "new-test-email1@world.org",
        sub: "email|new-test-email1",
      },
    };

    (getSession as jest.Mock).mockResolvedValue(mockSession);
    const response = await POST(mockReq, {});
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

  it("Should create team for a user that exists", async () => {
    const mockReq = {
      json: () => Promise.resolve({ team_name: "Test Team", hasUser: true }),
    } as unknown as NextRequest;

    const mockSession = {
      user: {
        ...validSessionUser,
        hasura: {
          id: "usr_a78f59e547fa5bd3d76bc1a1817c6d89",
        },
      },
    };

    (getSession as jest.Mock).mockResolvedValue(mockSession);
    const response = await POST(mockReq, {});
    const body = await response.json();
    expect(body).toHaveProperty("returnTo");
    expect(response.status).toEqual(200);
  });

  it("Should create team for a new user", async () => {
    const mockReq = {
      json: () => Promise.resolve({ team_name: "Test Team", hasUser: false }),
    } as unknown as NextRequest;

    const mockSession = {
      user: {
        ...validSessionUser,
        email: "new-test-email2@world.org",
        sub: "email|new-test-email2",
      },
    };

    (getSession as jest.Mock).mockResolvedValue(mockSession);
    const response = await POST(mockReq, {});
    const body = await response.json();
    expect(body).toHaveProperty("returnTo");
    expect(response.status).toEqual(200);
  });

  it("should update session successfully", async () => {
    const mockUser = {
      id: "usr_a78f59e547fa5bd3d76bc1a1817c6d89",
      name: "Test User",
    };

    const mockReq = {
      json: () => Promise.resolve({ team_name: "Test Team", hasUser: true }),
    } as unknown as NextRequest;

    const mockSession = {
      user: {
        ...validSessionUser,
        hasura: { id: "usr_a78f59e547fa5bd3d76bc1a1817c6d89" },
      },
    };

    (getSession as jest.Mock).mockResolvedValue(mockSession);
    const response = await POST(mockReq, {});
    expect(getSession).toHaveBeenCalledWith();

    const userQuery = gql`
      query FetchUser($id: String!) {
        user_by_pk(id: $id) {
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
      user_by_pk: {
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
      };
    }>(userQuery, {
      id: "usr_a78f59e547fa5bd3d76bc1a1817c6d89",
    });

    expect(updateSession).toHaveBeenCalledWith(
      mockReq,
      expect.anything(),
      expect.objectContaining({
        user: expect.objectContaining({
          hasura: fetchedUser.user_by_pk,
        }),
      }),
    );

    expect(response.status).toEqual(200);
  });
});
