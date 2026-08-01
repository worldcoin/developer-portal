import { Pool } from "pg";

const pool = new Pool();
const describeFreshStack =
  process.env.WIA_FRESH_STACK === "true" ? describe : describe.skip;

describeFreshStack("World ID analytics isolated fresh-stack harness", () => {
  afterAll(async () => {
    await pool.end();
  });

  it("runs only when the isolated harness supplied its connection", () => {
    expect(process.env.WIA_FRESH_STACK).toBe("true");
    expect(process.env.WIA_MIGRATIONS_PROVEN).toBe("true");
    expect(process.env.PGHOST).toBe("127.0.0.1");
    expect(process.env.NEXT_PUBLIC_GRAPHQL_API_URL).toMatch(
      /^http:\/\/127\.0\.0\.1:\d+\/v1\/graphql$/,
    );
  });

  it("exposes migrated schema from the beginning through the latest domain", async () => {
    const result = await pool.query<{ relation: string | null }>(
      `SELECT to_regclass(name)::text AS relation
         FROM unnest(ARRAY[
           'public.team',
           'public.app',
           'public.action',
           'public.nullifier',
           'public.rp_registration',
           'public.action_v4',
           'public.nullifier_v4',
           'public.app_reviews'
         ]) AS name`,
    );

    expect(result.rows.every((row) => row.relation !== null)).toBe(true);
    await expect(
      pool.query("SELECT id FROM public.app LIMIT 0"),
    ).resolves.toEqual(
      expect.objectContaining({ command: "SELECT", rowCount: 0 }),
    );
    await expect(
      pool.query(
        "SELECT can_import_all_contacts FROM public.app_metadata LIMIT 0",
      ),
    ).resolves.toEqual(
      expect.objectContaining({ command: "SELECT", rowCount: 0 }),
    );
  });

  it("applies consistent metadata that answers a real GraphQL query", async () => {
    const metadataResponse = await fetch(
      process.env.WIA_HASURA_METADATA_URL as string,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-hasura-admin-secret": process.env
            .HASURA_GRAPHQL_ADMIN_SECRET as string,
        },
        body: JSON.stringify({
          type: "get_inconsistent_metadata",
          args: {},
        }),
      },
    );
    expect(metadataResponse.status).toBe(200);
    expect(await metadataResponse.json()).toEqual({
      is_consistent: true,
      inconsistent_objects: [],
    });

    const graphResponse = await fetch(
      process.env.NEXT_PUBLIC_GRAPHQL_API_URL as string,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-hasura-admin-secret": process.env
            .HASURA_GRAPHQL_ADMIN_SECRET as string,
        },
        body: JSON.stringify({
          query: "query StackProof { app(limit: 0) { id } }",
        }),
      },
    );
    expect(graphResponse.status).toBe(200);
    expect(await graphResponse.json()).toEqual({ data: { app: [] } });
  });
});
