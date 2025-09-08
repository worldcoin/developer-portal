import { deleteAccount } from "@/api/delete-account";
import { Auth0User } from "@/lib/types";
import { urls } from "@/lib/urls";
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

jest.mock("auth0", () => ({
  ManagementClient: jest.fn().mockImplementation(() => ({
    users: {
      delete: jest.fn(() => Promise.resolve()),
    },
  })),
}));

describe("test /delete-account", () => {
  beforeEach(() => {
    // Reset mocks before each test
    (getSession as jest.Mock).mockReset();
    (updateSession as jest.Mock).mockReset();
  });

  it("should return 401 if session user id is not found", async () => {
    const mockReq = {} as unknown as NextRequest;
    (getSession as jest.Mock).mockResolvedValue(null);
    const response = await deleteAccount(mockReq, {});
    const body = await response.json();
    expect(getSession).toHaveReturned();
    expect(response.status).toEqual(401);
    expect(body.code).toEqual("unauthorized");
  });

  it("Should successfully delete account", async () => {
    const mockReq = {
      json: () => Promise.resolve(),
    } as unknown as NextRequest;

    (getSession as jest.Mock).mockResolvedValue({ user: validSessionUser });
    const response = await deleteAccount(mockReq, {});
    expect(getSession).toHaveReturned();
    expect(response.status).toEqual(307);
    console.log(response.headers.get("location"));
    expect(response.headers.get("location")).toEqual(
      new URL(urls.logout(), process.env.NEXT_PUBLIC_APP_URL).toString(),
    );
  });
});
