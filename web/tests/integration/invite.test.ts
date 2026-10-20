import { integrationDBClean, integrationDBExecuteQuery } from "./setup";

beforeEach(integrationDBClean);

// #region Invite ID generation
describe("public.invite [ID generation]", () => {
  it("generates distinct URL-safe IDs containing 32 random bytes", async () => {
    const { rows } = await integrationDBExecuteQuery(
      `INSERT INTO public.invite (team_id, email)
       SELECT $1, 'invite-' || n || '@example.com'
       FROM generate_series(1, 16) AS n
       RETURNING id`,
      ["team_d7cde14f17eda7e0ededba7ded6b4467"],
    );

    expect(rows).toHaveLength(16);
    expect(new Set(rows.map(({ id }) => id)).size).toBe(16);

    for (const { id } of rows) {
      expect(id).toMatch(/^inv_[A-Za-z0-9_-]{43}$/);
      expect(Buffer.from(id.slice(4), "base64url")).toHaveLength(32);
    }
  });
});
// #endregion
