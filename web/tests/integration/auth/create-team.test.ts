import { POST } from "@/api/create-team";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { Auth0User } from "@/lib/types";
import { gql } from "@apollo/client";
import { auth0 } from "@/lib/auth0";
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

  it("Should create team for a user that exists", async () => {
    const mockReq = {
      json: () => Promise.resolve({ team_name: "Test Team" }),
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
    const response = await POST(mockReq);
    const body = await response.json();
    expect(body).toHaveProperty("returnTo");
    expect(response.status).toEqual(200);
  });

  it("should reject team creation for a user without a portal record", async () => {
    const mockReq = {
      json: () => Promise.resolve({ team_name: "Test Team" }),
    } as unknown as NextRequest;

    const mockSession = {
      user: {
        ...validSessionUser,
        email: "new-test-email2@world.org",
        sub: "email|new-test-email2",
      },
    };

    (getSession as jest.Mock).mockResolvedValue(mockSession);
    const response = await POST(mockReq);

    expect(response.status).toEqual(403);
  });

  it("should update session successfully", async () => {
    const mockUser = {
      id: "usr_a78f59e547fa5bd3d76bc1a1817c6d89",
      name: "Test User",
    };

    const mockReq = {
      json: () => Promise.resolve({ team_name: "Test Team" }),
    } as unknown as NextRequest;

    const mockSession = {
      user: {
        ...validSessionUser,
        hasura: { id: "usr_a78f59e547fa5bd3d76bc1a1817c6d89" },
      },
    };

    (getSession as jest.Mock).mockResolvedValue(mockSession);
    const response = await POST(mockReq);
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
