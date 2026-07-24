import { createGlobalSearchQuery } from "@/scenes/Admin/search/server/create-global-search-where";

describe("admin global search where clauses", () => {
  it("routes a complete app ID to an exact app-only search", () => {
    const query = "app_0123456789abcdef0123456789abcdef";

    expect(createGlobalSearchQuery(query)).toEqual({
      appsWhere: { id: { _eq: query } },
      rpsWhere: { rp_id: { _eq: "" } },
      targets: new Set(["apps"]),
      teamsWhere: { id: { _eq: "" } },
      usersWhere: { id: { _eq: "" } },
    });
  });

  it("routes a complete RP ID to an exact RP-only search", () => {
    const query = "rp_0123456789abcdef";

    expect(createGlobalSearchQuery(query)).toEqual({
      appsWhere: { id: { _eq: "" } },
      rpsWhere: { rp_id: { _eq: query } },
      targets: new Set(["rps"]),
      teamsWhere: { id: { _eq: "" } },
      usersWhere: { id: { _eq: "" } },
    });
  });

  it("routes an email search to users", () => {
    const query = createGlobalSearchQuery("admin@example.com");

    expect(query.targets).toEqual(new Set(["users"]));
    expect(query.usersWhere).toEqual({
      _or: [
        { email: { _ilike: "%admin@example.com%" } },
        { id: { _ilike: "%admin@example.com%" } },
        { name: { _ilike: "%admin@example.com%" } },
      ],
    });
    expect(query.appsWhere).toEqual({ id: { _eq: "" } });
    expect(query.rpsWhere).toEqual({ rp_id: { _eq: "" } });
    expect(query.teamsWhere).toEqual({ id: { _eq: "" } });
  });

  it("searches every entity type for a plain text query", () => {
    const query = createGlobalSearchQuery("wallet");

    expect(query.targets).toEqual(new Set(["apps", "rps", "teams", "users"]));
    expect(query.appsWhere).toEqual({
      _or: [
        { id: { _ilike: "%wallet%" } },
        { name: { _ilike: "%wallet%" } },
        { team_id: { _ilike: "%wallet%" } },
      ],
    });
    expect(query.rpsWhere).toEqual({
      _or: [
        { rp_id: { _ilike: "%wallet%" } },
        { app_id: { _ilike: "%wallet%" } },
      ],
    });
    expect(query.teamsWhere).toEqual({
      _or: [{ id: { _ilike: "%wallet%" } }, { name: { _ilike: "%wallet%" } }],
    });
    expect(query.usersWhere).toEqual({
      _or: [
        { email: { _ilike: "%wallet%" } },
        { id: { _ilike: "%wallet%" } },
        { name: { _ilike: "%wallet%" } },
      ],
    });
  });
});
