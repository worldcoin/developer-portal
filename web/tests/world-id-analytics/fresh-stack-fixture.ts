import type { Pool, PoolClient } from "pg";

export const fixture = {
  teamId: "team_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  productionAppId: "app_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  stagingAppId: "app_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  v3OnlyAppId: "app_cccccccccccccccccccccccccccccccc",
  v4OnlyAppId: "app_dddddddddddddddddddddddddddddddd",
  productionRpId: "rp_aaaaaaaaaaaaaaaa",
  stagingRpId: "rp_bbbbbbbbbbbbbbbb",
  v4OnlyRpId: "rp_cccccccccccccccc",
  productionV3ActionId: "action_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  secondProductionV3ActionId: "action_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  stagingV3ActionId: "action_cccccccccccccccccccccccccccccccc",
  v3OnlyActionId: "action_dddddddddddddddddddddddddddddddd",
  productionV4ActionId: "action_v4_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  secondProductionV4ActionId: "action_v4_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  stagingV4ActionId: "action_v4_cccccccccccccccccccccccccccccccc",
  v4OnlyActionId: "action_v4_dddddddddddddddddddddddddddddddd",
  productionStagingV4ActionId: "action_v4_eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  stagingProductionV4ActionId: "action_v4_ffffffffffffffffffffffffffffffff",
} as const;

type Database = Pick<Pool, "query"> | Pick<PoolClient, "query">;

export const resetFixture = async (database: Database) => {
  await database.query("DELETE FROM public.team WHERE id = $1", [
    fixture.teamId,
  ]);
  await database.query(`
    TRUNCATE TABLE
      public.action_legacy_stats_daily,
      public.action_v4_stats_daily;
  `);
};

export const seedFixture = async (database: Database) => {
  await database.query(
    `INSERT INTO public.team (id, name)
     VALUES ($1, 'World ID analytics fresh-stack contract')`,
    [fixture.teamId],
  );

  const apps = [
    [
      fixture.productionAppId,
      "Production analytics app",
      false,
      "2026-01-01T10:00:00Z",
    ],
    [
      fixture.stagingAppId,
      "Staging analytics app",
      true,
      "2026-01-01T10:00:00Z",
    ],
    [
      fixture.v3OnlyAppId,
      "V3 only analytics app",
      false,
      "2026-01-01T10:00:00Z",
    ],
    [
      fixture.v4OnlyAppId,
      "V4 only analytics app",
      false,
      "2026-01-01T10:00:00Z",
    ],
  ] as const;
  for (const [id, name, isStaging, createdAt] of apps) {
    // trigger_insert_app_id regenerates app ids on insert, so write the
    // fixture id back to keep the suite's stable ids.
    const inserted = await database.query(
      `INSERT INTO public.app (
         team_id, name, is_staging, created_at
       ) VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [fixture.teamId, name, isStaging, createdAt],
    );
    await database.query(`UPDATE public.app SET id = $1 WHERE id = $2`, [
      id,
      (inserted.rows as Array<{ id: string }>)[0].id,
    ]);
  }

  for (const [rpId, appId] of [
    [fixture.productionRpId, fixture.productionAppId],
    [fixture.stagingRpId, fixture.stagingAppId],
    [fixture.v4OnlyRpId, fixture.v4OnlyAppId],
  ] as const) {
    await database.query(
      `INSERT INTO public.rp_registration (
         rp_id, app_id, mode, signer_address, status, created_at
       ) VALUES (
         $1, $2, 'managed',
         '0x0000000000000000000000000000000000000001',
         'registered', '2026-01-03T10:00:00Z'
       )`,
      [rpId, appId],
    );
  }

  for (const [id, appId, action] of [
    [
      fixture.productionV3ActionId,
      fixture.productionAppId,
      "production-v3-one",
    ],
    [
      fixture.secondProductionV3ActionId,
      fixture.productionAppId,
      "production-v3-two",
    ],
    [fixture.stagingV3ActionId, fixture.stagingAppId, "staging-v3"],
    [fixture.v3OnlyActionId, fixture.v3OnlyAppId, "v3-only"],
  ] as const) {
    await database.query(
      `INSERT INTO public.action (
         id, app_id, action, external_nullifier, created_at,
         max_verifications
       ) VALUES ($1, $2, $3, $4, '2026-01-02T10:00:00Z', 0)`,
      [id, appId, action, `external_${id}`],
    );
  }

  for (const [id, rpId, action, environment] of [
    [
      fixture.productionV4ActionId,
      fixture.productionRpId,
      "production-v4-one",
      "production",
    ],
    [
      fixture.secondProductionV4ActionId,
      fixture.productionRpId,
      "production-v4-two",
      "production",
    ],
    [fixture.stagingV4ActionId, fixture.stagingRpId, "staging-v4", "staging"],
    [fixture.v4OnlyActionId, fixture.v4OnlyRpId, "v4-only", "production"],
    [
      fixture.productionStagingV4ActionId,
      fixture.productionRpId,
      "production-app-staging-v4",
      "staging",
    ],
    [
      fixture.stagingProductionV4ActionId,
      fixture.stagingRpId,
      "staging-app-production-v4",
      "production",
    ],
  ] as const) {
    await database.query(
      `INSERT INTO public.action_v4 (
         id, rp_id, action, environment, created_at
       ) VALUES ($1, $2, $3, $4, '2026-01-04T10:00:00Z')`,
      [id, rpId, action, environment],
    );
  }
};

export const insertV3Nullifier = async (
  database: Database,
  input: {
    actionId?: string;
    createdAt: string;
    id: string;
    updatedAt?: string;
    uses?: number;
  },
) => {
  await database.query(
    `INSERT INTO public.nullifier (
       id, action_id, created_at, updated_at, nullifier_hash, uses
     ) VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      input.id,
      input.actionId ?? fixture.productionV3ActionId,
      input.createdAt,
      input.updatedAt ?? input.createdAt,
      `hash_${input.id}`,
      input.uses ?? 0,
    ],
  );
};

let v4Nullifier = 10_000n;

export const insertV4Nullifier = async (
  database: Database,
  input: { actionId?: string; createdAt: string; id: string },
) => {
  v4Nullifier += 1n;
  await database.query(
    `INSERT INTO public.nullifier_v4 (
       id, action_v4_id, created_at, nullifier
     ) VALUES ($1, $2, $3, $4)`,
    [
      input.id,
      input.actionId ?? fixture.productionV4ActionId,
      input.createdAt,
      v4Nullifier.toString(),
    ],
  );
};
