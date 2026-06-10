import { POST } from "@/api/update-session";
import { auth0 } from "@/lib/auth0";
import { NextRequest } from "next/server";

// Mock the Auth0 client (v4): the handler reads/writes the session via
// `auth0.getSession` / `auth0.updateSession`.
jest.mock("@/lib/auth0", () => ({
  auth0: {
    getSession: jest.fn(),
    updateSession: jest.fn(),
  },
}));

const getSession = auth0.getSession as jest.Mock;
const updateSession = auth0.updateSession as jest.Mock;

describe("test update-session", () => {
  beforeEach(() => {
    // Reset mocks before each test
    (getSession as jest.Mock).mockReset();
    (updateSession as jest.Mock).mockReset();
  });

  it("should update session successfully", async () => {
    const mockUser = { id: "123", name: "Test User" };
    const mockReq = {
      json: () => Promise.resolve({ user: mockUser }),
    } as unknown as NextRequest;
    const mockSession = { user: { hasura: { id: "123" } } };

    (getSession as jest.Mock).mockResolvedValue(mockSession);
    const response = await POST(mockReq);

    // Check that we have correctly called getSession and updateSession, use any response
    expect(getSession).toHaveBeenCalledWith(mockReq);
    expect(updateSession).toHaveBeenCalledWith(
      mockReq,
      expect.anything(),
      expect.objectContaining({
        user: expect.objectContaining({
          hasura: mockUser,
        }),
      }),
    );
    expect(response.status).toEqual(200);
  });

  it("should return 401 if user IDs do not match", async () => {
    const mockUser = { id: "wrong_id", name: "Test User" };
    const mockReq = {
      json: () => Promise.resolve({ user: mockUser }),
    } as unknown as NextRequest;

    const mockSession = { user: { hasura: { id: "123" } } };

    (getSession as jest.Mock).mockResolvedValue(mockSession);
    const response = await POST(mockReq);

    expect(getSession).toHaveBeenCalledWith(mockReq);
    expect(response.status).toEqual(401);
  });

  it("should return 400 when user payload is missing", async () => {
    const mockReq = {
      json: () => Promise.resolve({}),
    } as unknown as NextRequest;
    const mockSession = { user: { hasura: { id: "123" } } };

    (getSession as jest.Mock).mockResolvedValue(mockSession);
    const response = await POST(mockReq);

    expect(response.status).toEqual(400);
    expect(updateSession).not.toHaveBeenCalled();
  });

  it("should return 400 when user payload is not an object", async () => {
    const mockReq = {
      json: () => Promise.resolve({ user: "123" }),
    } as unknown as NextRequest;
    const mockSession = { user: { hasura: { id: "123" } } };

    (getSession as jest.Mock).mockResolvedValue(mockSession);
    const response = await POST(mockReq);

    expect(response.status).toEqual(400);
    expect(updateSession).not.toHaveBeenCalled();
  });

  it("should strip unknown fields and only write allowlisted fields to session", async () => {
    const mockUser = {
      id: "123",
      name: "Test User",
      email: "test@example.com",
      world_id_nullifier: "0xabc",
      posthog_id: "ph_123",
      is_allow_tracking: true,
      memberships: [],
      injected_key: "pwned",
    };
    const mockReq = {
      json: () => Promise.resolve({ user: mockUser }),
    } as unknown as NextRequest;
    const mockSession = { user: { hasura: { id: "123" } } };

    (getSession as jest.Mock).mockResolvedValue(mockSession);
    await POST(mockReq);

    const calledSession = (updateSession as jest.Mock).mock.calls[0][2];
    expect(calledSession.user.hasura).not.toHaveProperty("injected_key");
  });

  it("should preserve existing session fields not present in the request payload", async () => {
    const mockUser = { id: "123", name: "Updated Name" };
    const mockReq = {
      json: () => Promise.resolve({ user: mockUser }),
    } as unknown as NextRequest;
    const mockSession = {
      user: {
        hasura: {
          id: "123",
          name: "Old Name",
          email: "existing@example.com",
          memberships: [{ team: "eng" }],
          injected_key: "stale",
        },
      },
    };

    (getSession as jest.Mock).mockResolvedValue(mockSession);
    await POST(mockReq);

    const calledSession = (updateSession as jest.Mock).mock.calls[0][2];
    expect(calledSession.user.hasura.email).toBe("existing@example.com");
    expect(calledSession.user.hasura.memberships).toEqual([{ team: "eng" }]);
    expect(calledSession.user.hasura.name).toBe("Updated Name");
    expect(calledSession.user.hasura).not.toHaveProperty("injected_key");
  });

  it("should remove stale unknown fields already present in session.hasura", async () => {
    const mockUser = { id: "123" };
    const mockReq = {
      json: () => Promise.resolve({ user: mockUser }),
    } as unknown as NextRequest;
    const mockSession = {
      user: {
        hasura: {
          id: "123",
          email: "existing@example.com",
          injected_key: "stale",
        },
      },
    };

    (getSession as jest.Mock).mockResolvedValue(mockSession);
    await POST(mockReq);

    const calledSession = (updateSession as jest.Mock).mock.calls[0][2];
    expect(calledSession.user.hasura).toEqual({
      id: "123",
      email: "existing@example.com",
    });
    expect(calledSession.user.hasura).not.toHaveProperty("injected_key");
  });

  it("should allow explicit null for allowlisted fields", async () => {
    const mockUser = { id: "123", posthog_id: null };
    const mockReq = {
      json: () => Promise.resolve({ user: mockUser }),
    } as unknown as NextRequest;
    const mockSession = {
      user: {
        hasura: {
          id: "123",
          posthog_id: "ph_existing",
        },
      },
    };

    (getSession as jest.Mock).mockResolvedValue(mockSession);
    await POST(mockReq);

    const calledSession = (updateSession as jest.Mock).mock.calls[0][2];
    expect(calledSession.user.hasura.posthog_id).toBeNull();
  });

  it("should return 500 if session is not found", async () => {
    const mockReq = {
      json: () => Promise.resolve({ user: {} }),
    } as unknown as NextRequest;

    (getSession as jest.Mock).mockResolvedValue(null);
    const response = await POST(mockReq);

    expect(getSession).toHaveBeenCalledWith(mockReq);
    expect(response.status).toEqual(500);
  });
});
