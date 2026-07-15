const mockAuthenticateAdminRequest = jest.fn();
const mockFetchAdminGlobalSearch = jest.fn();

jest.mock("@/lib/admin-auth", () => ({
  authenticateAdminRequest: (...args: unknown[]) =>
    mockAuthenticateAdminRequest(...args),
}));

jest.mock("@/scenes/Admin/search/server/fetch-global-search", () => ({
  fetchAdminGlobalSearch: (...args: unknown[]) =>
    mockFetchAdminGlobalSearch(...args),
}));

import { GET } from "@/api/admin/search";
import { NextRequest } from "next/server";

const user = {
  email: "admin@example.com",
  role: "internal_dashboard_readonly",
  subject: "admin-subject",
};

const createRequest = (query = "") =>
  new NextRequest(`http://localhost/api/admin/search?q=${query}`);

beforeEach(() => {
  jest.clearAllMocks();
});

describe("/api/admin/search", () => {
  it("returns 401 when the request is unauthenticated", async () => {
    mockAuthenticateAdminRequest.mockResolvedValue(null);

    const response = await GET(createRequest("wallet"));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
    expect(mockFetchAdminGlobalSearch).not.toHaveBeenCalled();
  });

  it("rejects a query outside the accepted length range", async () => {
    mockAuthenticateAdminRequest.mockResolvedValue(user);

    const response = await GET(createRequest("a"));

    expect(response.status).toBe(400);
    expect(mockFetchAdminGlobalSearch).not.toHaveBeenCalled();
  });

  it("returns grouped search results for an authenticated admin", async () => {
    mockAuthenticateAdminRequest.mockResolvedValue(user);
    mockFetchAdminGlobalSearch.mockResolvedValue({
      apps: [
        { id: "app_current", name: "Current app", teamId: "team_current" },
      ],
      query: "current",
      teams: [],
      totals: { apps: 1, teams: 0, users: 0 },
      users: [],
    });

    const response = await GET(createRequest("current"));

    expect(response.status).toBe(200);
    expect(mockFetchAdminGlobalSearch).toHaveBeenCalledWith("current", user);
    expect(await response.json()).toEqual({
      apps: [
        { id: "app_current", name: "Current app", teamId: "team_current" },
      ],
      query: "current",
      teams: [],
      totals: { apps: 1, teams: 0, users: 0 },
      users: [],
    });
  });

  it("returns 503 when the search data fetch fails", async () => {
    mockAuthenticateAdminRequest.mockResolvedValue(user);
    mockFetchAdminGlobalSearch.mockRejectedValue(new Error("GraphQL failed"));

    const response = await GET(createRequest("current"));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Search is temporarily unavailable",
    });
  });
});
