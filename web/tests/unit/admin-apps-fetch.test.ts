jest.mock("server-only", () => ({}));

jest.mock("@/api/helpers/graphql", () => ({
  getInternalDashboardGraphqlClient: jest.fn(),
}));

jest.mock(
  "@/scenes/Admin/apps/graphql/server/fetch-admin-apps.generated",
  () => ({
    getSdk: jest.fn(),
  }),
);

import {
  createAppsOrderBy,
  createAppsWhere,
} from "@/scenes/Admin/apps/server/fetch-apps";
import { getAppsSearchVisualSegments } from "@/components/AdminDashboard/Apps/search";
import { Order_By } from "@/graphql/graphql";

describe("admin apps query mapping", () => {
  it("searches plain terms across app identity fields", () => {
    expect(createAppsWhere("world")).toEqual({
      _or: [
        { id: { _ilike: "%world%" } },
        { name: { _ilike: "%world%" } },
        { team_id: { _ilike: "%world%" } },
      ],
    });
  });

  it("filters draft metadata separately from verified metadata", () => {
    expect(createAppsWhere("draft:sample")).toEqual({
      app_metadata: {
        _and: [
          { name: { _ilike: "%sample%" } },
          { verification_status: { _neq: "verified" } },
        ],
      },
    });
    expect(createAppsWhere("verified:sample")).toEqual({
      app_metadata: {
        _and: [
          { name: { _ilike: "%sample%" } },
          { verification_status: { _eq: "verified" } },
        ],
      },
    });
  });

  it("uses a unique final sort key for creation date", () => {
    expect(
      createAppsOrderBy({ field: "createdAt", direction: "desc" }),
    ).toEqual([
      { created_at: Order_By.Desc },
      { name: Order_By.Asc },
      { id: Order_By.Asc },
    ]);
  });

  it("returns no matches for an invalid date filter", () => {
    expect(createAppsWhere("created>=invalid")).toEqual({ id: { _in: [] } });
  });

  it("preserves text before, between, and after field chips", () => {
    expect(
      getAppsSearchVisualSegments("test name:wallet team:world trailing"),
    ).toEqual([
      { type: "text", value: "test " },
      { type: "chip", value: "name:wallet" },
      { type: "text", value: " " },
      { type: "chip", value: "team:world" },
      { type: "text", value: " trailing" },
    ]);
  });
});
