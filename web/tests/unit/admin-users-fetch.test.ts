jest.mock("server-only", () => ({}));

jest.mock("@/api/helpers/graphql", () => ({
  getInternalDashboardGraphqlClient: jest.fn(),
}));

jest.mock(
  "@/scenes/Admin/users/graphql/server/fetch-admin-users.generated",
  () => ({
    getSdk: jest.fn(),
  }),
);

import {
  createUsersOrderBy,
  createUsersWhere,
} from "@/scenes/Admin/users/server/fetch-users";
import { Order_By } from "@/graphql/graphql";

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

  it("uses a stable secondary name sort for team counts", () => {
    expect(
      createUsersOrderBy({ field: "teamsCount", direction: "desc" }),
    ).toEqual([
      { memberships_aggregate: { count: Order_By.Desc } },
      { name: Order_By.Asc },
    ]);
  });
});
