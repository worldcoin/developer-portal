const getInternalDashboardGraphqlClient = jest.fn();
const FetchAdminUserMemberships = jest.fn();
const FetchAdminUsers = jest.fn();

jest.mock("server-only", () => ({}));

jest.mock("@/api/helpers/graphql", () => ({
  getInternalDashboardGraphqlClient: () => getInternalDashboardGraphqlClient(),
}));

jest.mock(
  "@/scenes/Admin/users/graphql/server/fetch-admin-users.generated",
  () => ({
    getSdk: () => ({ FetchAdminUserMemberships, FetchAdminUsers }),
  }),
);

jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn() },
}));

import { DEFAULT_USER_COLUMN_VISIBILITY } from "@/components/AdminDashboard/Users/column-visibility";
import { Order_By } from "@/graphql/graphql";
import {
  createUsersOrderBy,
  createUsersWhere,
  fetchAdminUsersPage,
} from "@/scenes/Admin/users/server/fetch-users";

const createUsersResponse = () => ({
  user: [
    {
      created_at: "2026-07-17T00:00:00.000Z",
      email: "first@example.com",
      id: "user_first",
      name: "First",
    },
    {
      created_at: "2026-07-16T00:00:00.000Z",
      email: "second@example.com",
      id: "user_second",
      name: "Second",
    },
  ],
  user_aggregate: { aggregate: { count: 2 } },
});

beforeEach(() => {
  jest.clearAllMocks();
  getInternalDashboardGraphqlClient.mockResolvedValue({});
});

describe("admin users query mapping", () => {
  it("searches plain terms across name and email", () => {
    expect(createUsersWhere("alice")).toEqual({
      _or: [{ name: { _ilike: "%alice%" } }, { email: { _ilike: "%alice%" } }],
    });
  });

  it("maps aggregate team filters", () => {
    expect(createUsersWhere("teams>=2")).toEqual({
      memberships_aggregate: {
        count: {
          predicate: {
            _gte: 2,
          },
        },
      },
    });
  });

  it("uses a unique final sort key for team counts", () => {
    expect(
      createUsersOrderBy({ field: "teamsCount", direction: "desc" }),
    ).toEqual([
      { memberships_aggregate: { count: Order_By.Desc } },
      { name: Order_By.Asc },
      { id: Order_By.Asc },
    ]);
  });

  it("returns no matches for an invalid date filter", () => {
    expect(createUsersWhere("created>=invalid")).toEqual({ id: { _in: [] } });
  });
});

describe("fetchAdminUsersPage", () => {
  it("batches visible team counts after selecting the users page", async () => {
    FetchAdminUsers.mockResolvedValue(createUsersResponse());
    FetchAdminUserMemberships.mockResolvedValue({
      membership: [
        { user_id: "user_first" },
        { user_id: "user_first" },
        { user_id: "user_second" },
      ],
    });

    const result = await fetchAdminUsersPage({
      columnVisibility: DEFAULT_USER_COLUMN_VISIBILITY,
      limit: 300,
      page: 1,
      searchQuery: "",
      sort: null,
    });

    expect(FetchAdminUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        includeCreatedAt: true,
        includeEmail: true,
        limit: 300,
      }),
    );
    expect(FetchAdminUserMemberships).toHaveBeenCalledWith({
      userIds: ["user_first", "user_second"],
    });
    expect(result.users).toEqual([
      expect.objectContaining({ id: "user_first", teamsCount: 2 }),
      expect.objectContaining({ id: "user_second", teamsCount: 1 }),
    ]);
  });

  it("does not load memberships when the teams column is hidden", async () => {
    FetchAdminUsers.mockResolvedValue(createUsersResponse());

    const result = await fetchAdminUsersPage({
      columnVisibility: {
        ...DEFAULT_USER_COLUMN_VISIBILITY,
        teamsCount: false,
      },
      limit: 300,
      page: 1,
      searchQuery: "",
      sort: null,
    });

    expect(FetchAdminUserMemberships).not.toHaveBeenCalled();
    expect(result.users[0]).toEqual(
      expect.objectContaining({ teamsCount: undefined }),
    );
  });
});
