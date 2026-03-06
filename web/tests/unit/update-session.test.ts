import { POST } from "@/api/update-session";
import { getSession, updateSession } from "@auth0/nextjs-auth0";
import { NextRequest } from "next/server";

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
    const response = await POST(mockReq, {});

    // Check that we have correctly called getSession and updateSession, use any response
    expect(getSession).toHaveBeenCalledWith(mockReq, expect.anything());
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
    const response = await POST(mockReq, {});

    expect(getSession).toHaveBeenCalledWith(mockReq, expect.anything());
    expect(response.status).toEqual(401);
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
    await POST(mockReq, {});

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
        },
      },
    };

    (getSession as jest.Mock).mockResolvedValue(mockSession);
    await POST(mockReq, {});

    const calledSession = (updateSession as jest.Mock).mock.calls[0][2];
    expect(calledSession.user.hasura.email).toBe("existing@example.com");
    expect(calledSession.user.hasura.memberships).toEqual([{ team: "eng" }]);
    expect(calledSession.user.hasura.name).toBe("Updated Name");
  });

  it("should return 500 if session is not found", async () => {
    const mockReq = {
      json: () => Promise.resolve({ user: {} }),
    } as unknown as NextRequest;

    (getSession as jest.Mock).mockResolvedValue(null);
    const response = await POST(mockReq, {});

    expect(getSession).toHaveBeenCalledWith(mockReq, expect.anything());
    expect(response.status).toEqual(500);
  });
});
