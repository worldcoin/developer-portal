import { Pool } from "pg";

const pool = new Pool();

afterAll(async () => {
  await pool.end();
});

describe("World ID analytics isolated fresh-stack harness", () => {
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

  it("provisions valid created_at indexes for both nullifier sources", async () => {
    // The migration deliberately builds neither index; the runner's
    // out-of-band create-nullifier-created-at-index.sql step must.
    const result = await pool.query<{
      index_name: string;
      indisready: boolean;
      indisvalid: boolean;
      source_table: string;
    }>(`
      SELECT
        index_relation.relname AS index_name,
        source_relation.relname AS source_table,
        definition.indisready,
        definition.indisvalid
      FROM pg_index AS definition
      JOIN pg_class AS index_relation
        ON index_relation.oid = definition.indexrelid
      JOIN pg_namespace AS index_schema
        ON index_schema.oid = index_relation.relnamespace
      JOIN pg_class AS source_relation
        ON source_relation.oid = definition.indrelid
      WHERE index_schema.nspname = 'public'
        AND index_relation.relname IN (
          'nullifier_created_at_idx',
          'nullifier_v4_created_at_idx'
        )
      ORDER BY index_relation.relname
    `);

    expect(result.rows).toEqual([
      {
        index_name: "nullifier_created_at_idx",
        source_table: "nullifier",
        indisready: true,
        indisvalid: true,
      },
      {
        index_name: "nullifier_v4_created_at_idx",
        source_table: "nullifier_v4",
        indisready: true,
        indisvalid: true,
      },
    ]);
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
