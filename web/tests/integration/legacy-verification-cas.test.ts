import { integrationDBClean, integrationDBExecuteQuery } from "./setup";
import { Pool } from "pg";

type MetadataVersion = {
  id: string;
  updated_at: string;
};

const query = async <T>(sql: string, values: unknown[] = []) =>
  (await integrationDBExecuteQuery(sql, values)) as { rows: T[] };

beforeEach(async () => {
  await integrationDBClean();
  await query("DELETE FROM public.legacy_app_verification_asset_settlement");
});

const prepareVersions = async () => {
  const { rows: apps } = await query<{ id: string }>(
    `SELECT id FROM public.app WHERE name = 'Sign In App' LIMIT 1`,
  );
  const appId = apps[0].id;
  const { rows: priorRows } = await query<MetadataVersion>(
    `UPDATE public.app_metadata
     SET app_mode = 'mini-app',
         logo_img_url = 'live_logo.png',
         verification_status = 'verified',
         is_developer_allow_listing = true,
         is_reviewer_world_app_approved = true,
         is_reviewer_app_store_approved = true,
         verified_at = now()
     WHERE app_id = $1
     RETURNING id, updated_at::text AS updated_at`,
    [appId],
  );
  const { rows: draftRows } = await query<MetadataVersion>(
    `INSERT INTO public.app_metadata (
       app_id,
       name,
       description,
       app_mode,
       integration_url,
       logo_img_url,
       verification_status,
       is_developer_allow_listing
     )
     VALUES (
       $1,
       'Legacy verification draft',
       'Legacy verification draft description',
       'mini-app',
       'https://review.example.com/app',
       'logo_img.png',
       'awaiting_review',
       false
     )
     RETURNING id, updated_at::text AS updated_at`,
    [appId],
  );
  return { appId, prior: priorRows[0], draft: draftRows[0] };
};

const legacyVerificationSql = `SELECT verified.id,
                                      verified.updated_at::text AS updated_at
                               FROM public.legacy_verify_app_metadata(
                                 $1::text,
                                 $2::text,
                                 $3::uuid,
                                 $4::timestamptz,
                                 $5::text,
                                 $6::timestamptz,
                                 $7::jsonb,
                                 $8::text,
                                 false,
                                 false,
                                 $9::jsonb,
                                 '{}'::jsonb
                               ) AS verified`;

const legacyVerificationValues = ({
  appId,
  draft,
  prior,
  operationId = "11111111-1111-4111-8111-111111111111",
}: {
  appId: string;
  draft: MetadataVersion;
  prior: MetadataVersion;
  operationId?: string;
}) => [
  appId,
  draft.id,
  operationId,
  draft.updated_at,
  prior.id,
  prior.updated_at,
  JSON.stringify({}),
  "Legacy Reviewer",
  JSON.stringify({
    logo_img_url: "prepared_logo.png",
    meta_tag_image_url: "",
    content_card_image_url: "",
    showcase_img_urls: null,
  }),
];

const registerExactAssets = async ({
  appId,
  draft,
  operationId = "11111111-1111-4111-8111-111111111111",
}: {
  appId: string;
  draft: MetadataVersion;
  operationId?: string;
}) =>
  query<{
    operation_id: string;
    outcome: string;
    delivery_status: string;
  }>(
    `SELECT operation_id::text, outcome, delivery_status
     FROM public.register_legacy_app_verification_asset_settlement(
       $1::uuid,
       $2::text,
       $3::text,
       $4::timestamptz,
       $5::jsonb,
       $6::jsonb
     )`,
    [
      operationId,
      appId,
      draft.id,
      draft.updated_at,
      JSON.stringify([`verified/${appId}/prepared_logo.png`]),
      JSON.stringify([`verified/${appId}/live_logo.png`]),
    ],
  );

const verifyExactVersion = async (fixture: {
  appId: string;
  draft: MetadataVersion;
  prior: MetadataVersion;
  operationId?: string;
}) =>
  query<MetadataVersion>(
    legacyVerificationSql,
    legacyVerificationValues(fixture),
  );

const waitForLock = async (pid: number) => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const { rows } = await query<{ wait_event_type: string | null }>(
      `SELECT wait_event_type
       FROM pg_stat_activity
       WHERE pid = $1`,
      [pid],
    );
    if (rows[0]?.wait_event_type === "Lock") return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error("Localization insert did not wait for the metadata lock.");
};

describe("legacy verification database compare-and-swap", () => {
  test("cannot promote a withdrawn and resubmitted draft using its stale version", async () => {
    const fixture = await prepareVersions();
    await registerExactAssets(fixture);

    await query(
      `UPDATE public.app_metadata
       SET verification_status = 'unverified'
       WHERE id = $1`,
      [fixture.draft.id],
    );
    const { rows: resubmittedRows } = await query<MetadataVersion>(
      `UPDATE public.app_metadata
       SET verification_status = 'awaiting_review'
       WHERE id = $1
       RETURNING id, updated_at::text AS updated_at`,
      [fixture.draft.id],
    );
    expect(resubmittedRows[0].updated_at).not.toBe(fixture.draft.updated_at);

    const staleResult = await verifyExactVersion(fixture);

    expect(staleResult.rows).toHaveLength(0);
    const { rows: versions } = await query<{
      id: string;
      verification_status: string;
      logo_img_url: string;
    }>(
      `SELECT id, verification_status, logo_img_url
       FROM public.app_metadata
       WHERE app_id = $1
       ORDER BY id`,
      [fixture.appId],
    );
    expect(versions).toEqual(
      expect.arrayContaining([
        {
          id: fixture.prior.id,
          verification_status: "verified",
          logo_img_url: "live_logo.png",
        },
        {
          id: fixture.draft.id,
          verification_status: "awaiting_review",
          logo_img_url: "logo_img.png",
        },
      ]),
    );
  });

  test("atomically replaces the exact prior version on a matching CAS", async () => {
    const fixture = await prepareVersions();
    await registerExactAssets(fixture);

    const result = await verifyExactVersion(fixture);

    expect(result.rows).toHaveLength(1);
    const { rows: versions } = await query<{
      id: string;
      verification_status: string;
      logo_img_url: string;
      is_reviewer_world_app_approved: boolean;
      is_reviewer_app_store_approved: boolean;
    }>(
      `SELECT
         id,
         verification_status,
         logo_img_url,
         is_reviewer_world_app_approved,
         is_reviewer_app_store_approved
       FROM public.app_metadata
       WHERE app_id = $1`,
      [fixture.appId],
    );
    expect(versions).toEqual([
      {
        id: fixture.draft.id,
        verification_status: "verified",
        logo_img_url: "prepared_logo.png",
        is_reviewer_world_app_approved: false,
        is_reviewer_app_store_approved: false,
      },
    ]);
    const { rows: settlements } = await query<{
      outcome: string;
      delivery_status: string;
    }>(
      `SELECT outcome, delivery_status
       FROM public.legacy_app_verification_asset_settlement
       WHERE operation_id = '11111111-1111-4111-8111-111111111111'`,
    );
    expect(settlements).toEqual([
      { outcome: "committed", delivery_status: "pending" },
    ]);
  });

  test("returns the exact committed operation on a lost-response retry", async () => {
    const fixture = await prepareVersions();
    const operationId = "22222222-2222-4222-8222-222222222222";
    await registerExactAssets({ ...fixture, operationId });

    const first = await verifyExactVersion({ ...fixture, operationId });
    const reconciled = await verifyExactVersion({ ...fixture, operationId });

    expect(first.rows).toHaveLength(1);
    expect(reconciled.rows).toEqual(first.rows);
    const { rows } = await query<{
      id: string;
      legacy_verification_operation_id: string;
    }>(
      `SELECT id, legacy_verification_operation_id::text
       FROM public.app_metadata
       WHERE app_id = $1`,
      [fixture.appId],
    );
    expect(rows).toEqual([
      {
        id: fixture.draft.id,
        legacy_verification_operation_id: operationId,
      },
    ]);
  });

  test("rejects a localization insert that waited behind draft promotion", async () => {
    const fixture = await prepareVersions();
    await registerExactAssets(fixture);
    const pool = new Pool();
    const verifier = await pool.connect();
    const localizationWriter = await pool.connect();
    let verifierTransactionOpen = false;

    try {
      await verifier.query("BEGIN");
      verifierTransactionOpen = true;
      const verified = await verifier.query<MetadataVersion>(
        legacyVerificationSql,
        legacyVerificationValues(fixture),
      );
      expect(verified.rows).toHaveLength(1);

      const { rows: writerRows } = await localizationWriter.query<{
        pid: number;
      }>("SELECT pg_backend_pid() AS pid");
      const insertOutcome = localizationWriter
        .query(
          `INSERT INTO public.localisations (app_metadata_id, locale)
           VALUES ($1, 'fr')`,
          [fixture.draft.id],
        )
        .then(
          () => ({ ok: true as const, error: null }),
          (error: unknown) => ({ ok: false as const, error }),
        );

      await waitForLock(writerRows[0].pid);
      await verifier.query("COMMIT");
      verifierTransactionOpen = false;

      const outcome = await insertOutcome;
      expect(outcome.ok).toBe(false);
      expect(String(outcome.error)).toMatch(
        /awaiting-review or verified app localizations/i,
      );
      const { rows: inserted } = await query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
         FROM public.localisations
         WHERE app_metadata_id = $1
           AND locale = 'fr'`,
        [fixture.draft.id],
      );
      expect(inserted).toEqual([{ count: "0" }]);
    } finally {
      if (verifierTransactionOpen) await verifier.query("ROLLBACK");
      verifier.release();
      localizationWriter.release();
      await pool.end();
    }
  });

  test("registers only exact-app keys and idempotently returns the same plan", async () => {
    const fixture = await prepareVersions();

    const first = await registerExactAssets(fixture);
    const retry = await registerExactAssets(fixture);
    const escaped = await query(
      `SELECT operation_id
       FROM public.register_legacy_app_verification_asset_settlement(
         '33333333-3333-4333-8333-333333333333'::uuid,
         $1::text,
         $2::text,
         $3::timestamptz,
         '["verified/another_app/prepared.png"]'::jsonb,
         '[]'::jsonb
       )`,
      [fixture.appId, fixture.draft.id, fixture.draft.updated_at],
    );

    expect(first.rows).toEqual(retry.rows);
    expect(first.rows).toEqual([
      {
        operation_id: "11111111-1111-4111-8111-111111111111",
        outcome: "pending",
        delivery_status: "pending",
      },
    ]);
    expect(escaped.rows).toHaveLength(0);
  });

  test("locks the exact metadata and claims an abandoned plan as aborted", async () => {
    const fixture = await prepareVersions();
    await registerExactAssets(fixture);
    await query(
      `UPDATE public.app_metadata
       SET verification_status = 'unverified'
       WHERE id = $1`,
      [fixture.draft.id],
    );
    await query(
      `UPDATE public.legacy_app_verification_asset_settlement
       SET next_attempt_at = now() - interval '1 minute'
       WHERE operation_id = '11111111-1111-4111-8111-111111111111'`,
    );

    const { rows: claimed } = await query<{
      operation_id: string;
      outcome: string;
      delivery_status: string;
      locked_by: string;
    }>(
      `SELECT operation_id::text, outcome, delivery_status, locked_by
       FROM public.reviewer_claim_legacy_app_verification_asset_settlements(
         'legacy-worker',
         10
       )`,
    );

    expect(claimed).toEqual([
      {
        operation_id: "11111111-1111-4111-8111-111111111111",
        outcome: "aborted",
        delivery_status: "processing",
        locked_by: "legacy-worker",
      },
    ]);
    const { rows: completed } = await query<{
      delivery_status: string;
    }>(
      `SELECT delivery_status
       FROM public.complete_legacy_app_verification_asset_settlement(
         '11111111-1111-4111-8111-111111111111'::uuid,
         'legacy-worker',
         'aborted',
         true,
         NULL
       )`,
    );
    expect(completed).toEqual([{ delivery_status: "delivered" }]);
  });
});
