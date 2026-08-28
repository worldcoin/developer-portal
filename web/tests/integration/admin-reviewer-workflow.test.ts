import { Pool, PoolClient, QueryResult } from "pg";

import { fetchReviewerLiveMetadata } from "@/api/helpers/reviewer-live-metadata";
import { integrationDBClean, integrationDBExecuteQuery } from "./setup";

const REVIEWER = {
  subject: "reviewer-okta-subject",
  email: "reviewer@world.org",
};

type AppMode = "mini-app" | "external";

type ReviewSubmission = {
  id: string;
  app_id: string;
  app_metadata_id: string;
  attempt: number;
  status: string;
  review_version: number;
  claim_token: string | null;
  claim_expires_at: string | null;
  metadata_updated_at: string;
};

type MetadataVersion = {
  id: string;
  updated_at: string;
};

type ReviewFixture = {
  appId: string;
  draft: MetadataVersion;
  priorVerified: MetadataVersion | null;
};

beforeEach(integrationDBClean);

const query = async <T>(sql: string, values: unknown[] = []) => {
  return (await integrationDBExecuteQuery(sql, values)) as { rows: T[] };
};

const waitForDatabaseLock = async (
  observer: PoolClient,
  applicationName: string,
) => {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const { rows } = await observer.query<{ waiting: boolean }>(
      `SELECT EXISTS (
         SELECT 1
         FROM pg_catalog.pg_stat_activity
         WHERE application_name = $1
           AND state = 'active'
           AND wait_event_type = 'Lock'
       ) AS waiting`,
      [applicationName],
    );
    if (rows[0].waiting) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`${applicationName} did not reach the expected lock wait.`);
};

const forceLegacyDatabaseState = async (
  sql: string,
  values: unknown[] = [],
) => {
  const pool = new Pool();
  const client = await pool.connect();
  let transactionOpen = false;
  try {
    await client.query("BEGIN");
    transactionOpen = true;
    await client.query("SET LOCAL session_replication_role = replica");
    await client.query(sql, values);
    await client.query("COMMIT");
    transactionOpen = false;
  } finally {
    if (transactionOpen) await client.query("ROLLBACK");
    client.release();
    await pool.end();
  }
};

const prepareDraft = async ({
  mode = "mini-app",
  withPriorVerified = false,
}: {
  mode?: AppMode;
  withPriorVerified?: boolean;
} = {}): Promise<ReviewFixture> => {
  const { rows: apps } = await query<{ id: string }>(
    `SELECT id FROM public.app WHERE name = 'Sign In App' LIMIT 1`,
  );
  const appId = apps[0].id;

  if (!withPriorVerified) {
    const { rows } = await query<MetadataVersion>(
      `UPDATE public.app_metadata
       SET app_mode = $2,
           integration_url = 'https://review.example.com/app',
           logo_img_url = 'logo_img.png',
           verification_status = 'unverified',
           is_developer_allow_listing = false,
           review_message = '',
           reviewed_by = ''
       WHERE app_id = $1
       RETURNING id, updated_at::text AS updated_at`,
      [appId, mode],
    );

    return { appId, draft: rows[0], priorVerified: null };
  }

  const { rows: verifiedRows } = await query<MetadataVersion>(
    `UPDATE public.app_metadata
     SET app_mode = $2,
         integration_url = 'https://live.example.com/app',
         verification_status = 'verified',
         logo_img_url = 'logo_img.png',
         is_developer_allow_listing = true,
         is_reviewer_world_app_approved = true,
         is_reviewer_app_store_approved = ($2 = 'mini-app'),
         reviewed_by = 'previous-reviewer@world.org',
         verified_at = now()
     WHERE app_id = $1
     RETURNING id, updated_at::text AS updated_at`,
    [appId, mode],
  );

  const { rows: draftRows } = await query<MetadataVersion>(
    `INSERT INTO public.app_metadata (
       app_id,
       name,
       description,
       app_mode,
       integration_url,
       logo_img_url,
       verification_status
     )
     VALUES (
       $1,
       'Submitted review draft',
       'Submitted review description',
       $2,
       'https://review.example.com/app',
       'logo_img.png',
       'unverified'
     )
     RETURNING id, updated_at::text AS updated_at`,
    [appId, mode],
  );

  return {
    appId,
    draft: draftRows[0],
    priorVerified: verifiedRows[0],
  };
};

const captureSubmission = async (
  fixture: ReviewFixture,
): Promise<ReviewSubmission> => {
  const assetSnapshot = {
    version: 1,
    prefix: `review-submissions/${fixture.appId}/${fixture.draft.id}/${"a".repeat(32)}/`,
    objects: {
      [`unverified/${fixture.appId}/logo_img.png`]: `review-submissions/${fixture.appId}/${fixture.draft.id}/${"a".repeat(32)}/logo_img.png`,
    },
  };
  const { rows } = await query<ReviewSubmission>(
    `SELECT captured.*, captured.metadata_updated_at::text AS metadata_updated_at
     FROM public.capture_listing_review_submission(
       $1::text,
       $2::text,
       $3::text,
       $4::text,
       true,
       $5::timestamptz,
       $6::jsonb,
       $7::jsonb
     ) AS captured`,
    [
      fixture.draft.id,
      "Ready for listing review",
      "developer-auth0-subject",
      "developer@example.com",
      fixture.draft.updated_at,
      JSON.stringify([]),
      JSON.stringify(assetSnapshot),
    ],
  );

  expect(rows).toHaveLength(1);
  return rows[0];
};

const claimSubmission = async (
  submission: ReviewSubmission,
): Promise<ReviewSubmission> => {
  const { rows } = await query<ReviewSubmission>(
    `SELECT claimed.*, claimed.metadata_updated_at::text AS metadata_updated_at
     FROM public.reviewer_claim_app_review_submission(
       $1::uuid,
       $2::integer,
       $3::text,
       $4::text
     ) AS claimed`,
    [
      submission.id,
      submission.review_version,
      REVIEWER.subject,
      REVIEWER.email,
    ],
  );

  expect(rows).toHaveLength(1);
  return rows[0];
};

const saveChecklist = async (
  submission: ReviewSubmission,
): Promise<ReviewSubmission> => {
  const checklist = {
    definitionSnapshot: {
      version: "2026-08-28",
      checks: [],
    },
    responses: {},
  };
  const { rows } = await query<ReviewSubmission>(
    `SELECT saved.*, saved.metadata_updated_at::text AS metadata_updated_at
     FROM public.reviewer_save_app_review_checklist(
       $1::uuid,
       $2::uuid,
       $3::integer,
       $4::text,
       $5::jsonb,
       $6::text,
       $7::text
     ) AS saved`,
    [
      submission.id,
      submission.claim_token,
      submission.review_version,
      "2026-08-28",
      JSON.stringify(checklist),
      REVIEWER.subject,
      REVIEWER.email,
    ],
  );

  expect(rows).toHaveLength(1);
  return rows[0];
};

type DecisionInput = {
  fixture: ReviewFixture;
  submission: ReviewSubmission;
  decision: "approved" | "changes_requested";
  fingerprint: string;
  expectedMetadataUpdatedAt?: string | Date;
  expectedReviewVersion?: number;
};

const decisionStatement = ({
  fixture,
  submission,
  decision,
  fingerprint,
  expectedMetadataUpdatedAt = submission.metadata_updated_at,
  expectedReviewVersion = submission.review_version,
}: DecisionInput) => {
  const operationId = fingerprint.slice(0, 16);
  const logoFilename = `review_${fixture.draft.id}_${operationId}_logo.png`;
  const developerMessage =
    decision === "approved"
      ? "Approved for publication"
      : "Please resolve the failed metadata check.";
  return {
    sql: `SELECT decided.*, decided.metadata_updated_at::text AS metadata_updated_at
     FROM public.reviewer_decide_app_review_submission(
       $1::uuid,
       $2::uuid,
       $3::integer,
       $4::text,
       $5::timestamptz,
       $6::text,
       $7::text,
       $8::text,
       $9::text,
       $10::text,
       $11::timestamptz,
       $12::jsonb,
       $13::jsonb,
       $14::jsonb,
       $15::jsonb,
       $16::jsonb,
       $17::jsonb,
       $18::text,
       $19::text
     ) AS decided`,
    values: [
      submission.id,
      submission.claim_token,
      expectedReviewVersion,
      fixture.draft.id,
      expectedMetadataUpdatedAt,
      decision,
      developerMessage,
      null,
      fingerprint,
      fixture.priorVerified?.id ?? null,
      fixture.priorVerified?.updated_at ?? null,
      JSON.stringify([]),
      JSON.stringify(
        decision === "approved"
          ? {
              logoImgUrl: logoFilename,
              metaTagImageUrl: "",
              contentCardImageUrl: "",
              showcaseImgUrls: null,
            }
          : {},
      ),
      JSON.stringify({}),
      JSON.stringify(
        decision === "approved"
          ? [`verified/${fixture.appId}/${logoFilename}`]
          : [],
      ),
      JSON.stringify(
        decision === "approved" && fixture.priorVerified
          ? [`verified/${fixture.appId}/logo_img.png`]
          : [],
      ),
      JSON.stringify(
        decision === "changes_requested"
          ? [{ id: "accurate_metadata", note: "Metadata is inaccurate" }]
          : [],
      ),
      REVIEWER.subject,
      REVIEWER.email,
    ],
  };
};

const decideSubmission = async (
  input: DecisionInput,
): Promise<ReviewSubmission[]> => {
  const statement = decisionStatement(input);
  const { rows } = await query<ReviewSubmission>(
    statement.sql,
    statement.values,
  );

  return rows;
};

describe("reviewer workflow database invariants", () => {
  test("loads the current published version through the service-role projection", async () => {
    const fixture = await prepareDraft({ withPriorVerified: true });

    await expect(
      fetchReviewerLiveMetadata(fixture.appId),
    ).resolves.toMatchObject({
      id: fixture.priorVerified!.id,
      verification_status: "verified",
      is_reviewer_world_app_approved: true,
    });
  });

  test("rejects credential-bearing HTTPS integration URLs at capture", async () => {
    const fixture = await prepareDraft({ mode: "external" });
    const pool = new Pool();
    const client = await pool.connect();
    let transactionOpen = false;

    try {
      await client.query("BEGIN");
      transactionOpen = true;
      // Simulate a legacy row that predates the table-level URL trigger so the
      // capture function's own transactional validation is exercised.
      await client.query("SET LOCAL session_replication_role = replica");
      const { rows } = await client.query<MetadataVersion>(
        `UPDATE public.app_metadata
         SET integration_url = 'https://reviewer:secret@review.example.com/app'
         WHERE id = $1
         RETURNING id, updated_at::text AS updated_at`,
        [fixture.draft.id],
      );
      await client.query("COMMIT");
      transactionOpen = false;
      const assetSnapshot = {
        version: 1,
        prefix: `review-submissions/${fixture.appId}/${fixture.draft.id}/${"a".repeat(32)}/`,
        objects: {
          [`unverified/${fixture.appId}/logo_img.png`]: `review-submissions/${fixture.appId}/${fixture.draft.id}/${"a".repeat(32)}/logo_img.png`,
        },
      };

      await expect(
        query<ReviewSubmission>(
          `SELECT *
           FROM public.capture_listing_review_submission(
             $1::text,
             $2::text,
             $3::text,
             $4::text,
             true,
             $5::timestamptz,
             $6::jsonb,
             $7::jsonb
           )`,
          [
            fixture.draft.id,
            "Ready for listing review",
            "developer-auth0-subject",
            "developer@example.com",
            rows[0].updated_at,
            JSON.stringify([]),
            JSON.stringify(assetSnapshot),
          ],
        ),
      ).rejects.toThrow(/integration url must not include credentials/i);
    } finally {
      if (transactionOpen) await client.query("ROLLBACK");
      client.release();
      await pool.end();
    }
  });

  test("rejects approval when a legacy review contains a malformed integration URL", async () => {
    const fixture = await prepareDraft({ mode: "external" });
    const captured = await captureSubmission(fixture);
    const reviewed = await saveChecklist(await claimSubmission(captured));

    await forceLegacyDatabaseState(
      `UPDATE public.app_metadata
       SET integration_url = 'https://%'
       WHERE id = $1`,
      [fixture.draft.id],
    );
    await forceLegacyDatabaseState(
      `UPDATE public.app_review_submission
       SET metadata_snapshot = jsonb_set(
         metadata_snapshot,
         '{integration_url}',
         to_jsonb('https://%'::text)
       )
       WHERE id = $1`,
      [reviewed.id],
    );

    await expect(
      decideSubmission({
        fixture,
        submission: reviewed,
        decision: "approved",
        fingerprint: "8".repeat(64),
      }),
    ).rejects.toThrow(/invalid url|cannot be approved/i);

    const { rows } = await query<{
      review_status: string;
      metadata_status: string;
    }>(
      `SELECT
         submission.status AS review_status,
         metadata.verification_status AS metadata_status
       FROM public.app_review_submission AS submission
       INNER JOIN public.app_metadata AS metadata
         ON metadata.id = submission.app_metadata_id
       WHERE submission.id = $1`,
      [reviewed.id],
    );
    expect(rows).toEqual([
      { review_status: "in_review", metadata_status: "awaiting_review" },
    ]);
  });

  test.each([
    ["inactive", `UPDATE public.app SET status = 'inactive' WHERE id = $1`],
    ["archived", `UPDATE public.app SET is_archived = true WHERE id = $1`],
  ])("rejects capture for an %s app", async (_label, transition) => {
    const fixture = await prepareDraft();
    await query(transition, [fixture.appId]);

    await expect(captureSubmission(fixture)).rejects.toMatchObject({
      code: "55000",
    });
  });

  test.each([
    ["deactivate", `UPDATE public.app SET status = 'inactive' WHERE id = $1`],
    ["archive", `UPDATE public.app SET is_archived = true WHERE id = $1`],
  ])(
    "requires withdrawal before an owner can %s an app in review",
    async (_label, transition) => {
      const fixture = await prepareDraft();
      const submission = await captureSubmission(fixture);

      await expect(query(transition, [fixture.appId])).rejects.toMatchObject({
        code: "55000",
      });

      const { rows } = await query<{
        app_status: string;
        is_archived: boolean;
        review_status: string;
      }>(
        `SELECT app.status AS app_status,
                app.is_archived,
                submission.status AS review_status
         FROM public.app
         INNER JOIN public.app_review_submission AS submission
           ON submission.app_id = app.id
         WHERE submission.id = $1`,
        [submission.id],
      );
      expect(rows).toEqual([
        { app_status: "active", is_archived: false, review_status: "pending" },
      ]);
    },
  );

  test("revalidates app availability inside the approval transaction", async () => {
    const fixture = await prepareDraft();
    const reviewed = await saveChecklist(
      await claimSubmission(await captureSubmission(fixture)),
    );

    await forceLegacyDatabaseState(
      `UPDATE public.app SET status = 'inactive' WHERE id = $1`,
      [fixture.appId],
    );

    await expect(
      decideSubmission({
        fixture,
        submission: reviewed,
        decision: "approved",
        fingerprint: "6".repeat(64),
      }),
    ).resolves.toEqual([]);

    const { rows } = await query<{
      metadata_status: string;
      review_status: string;
    }>(
      `SELECT metadata.verification_status AS metadata_status,
              submission.status AS review_status
       FROM public.app_review_submission AS submission
       INNER JOIN public.app_metadata AS metadata
         ON metadata.id = submission.app_metadata_id
       WHERE submission.id = $1`,
      [reviewed.id],
    );
    expect(rows).toEqual([
      { metadata_status: "awaiting_review", review_status: "in_review" },
    ]);
  });

  test("prepared cleanup waits for a decision begun before lease expiry", async () => {
    const fixture = await prepareDraft();
    const reviewed = await saveChecklist(
      await claimSubmission(await captureSubmission(fixture)),
    );
    const fingerprint = "7".repeat(64);
    const operationId = fingerprint.slice(0, 16);
    const assetKeys = [
      `verified/${fixture.appId}/review_${fixture.draft.id}_${operationId}_logo.png`,
    ];
    const { rows: expiringRows } = await query<ReviewSubmission>(
      `UPDATE public.app_review_submission
         SET claim_expires_at = clock_timestamp() + interval '2 seconds'
         WHERE id = $1
         RETURNING *, metadata_updated_at::text AS metadata_updated_at`,
      [reviewed.id],
    );
    const expiring = expiringRows[0];
    const { rows: cleanupRows } = await query<{ id: string }>(
      `SELECT queued.id
         FROM public.reviewer_enqueue_app_review_asset_cleanup(
           $1::uuid,
           $2::text,
           $3::text,
           $4::integer,
           $5::text,
           $6::jsonb,
           $7::text,
           $8::text
         ) AS queued`,
      [
        expiring.id,
        fingerprint,
        operationId,
        expiring.review_version,
        fixture.draft.id,
        JSON.stringify(assetKeys),
        REVIEWER.subject,
        REVIEWER.email,
      ],
    );
    expect(cleanupRows).toHaveLength(1);

    const pool = new Pool({ max: 4 });
    const blocker = await pool.connect();
    const decisionClient = await pool.connect();
    const reconciliationClient = await pool.connect();
    const observer = await pool.connect();
    let blockerTransactionOpen = false;
    let decisionTransactionOpen = false;
    let decisionPromise: Promise<QueryResult<ReviewSubmission>> | undefined;
    let reconciliationPromise:
      | Promise<QueryResult<{ id: string; payload: Record<string, unknown> }>>
      | undefined;

    try {
      await blocker.query("BEGIN");
      blockerTransactionOpen = true;
      await blocker.query(
        `SELECT id
           FROM public.app_review_submission
           WHERE id = $1
           FOR UPDATE`,
        [expiring.id],
      );

      await decisionClient.query(
        "SET application_name = 'reviewer_delayed_asset_decision'",
      );
      await decisionClient.query("BEGIN");
      decisionTransactionOpen = true;
      const { rows: transactionTimes } = await decisionClient.query<{
        started_at: string;
        expires_at: string;
      }>(
        `SELECT now()::text AS started_at,
                  claim_expires_at::text AS expires_at
           FROM public.app_review_submission
           WHERE id = $1`,
        [expiring.id],
      );
      expect(new Date(transactionTimes[0].started_at).getTime()).toBeLessThan(
        new Date(transactionTimes[0].expires_at).getTime(),
      );

      const statement = decisionStatement({
        fixture,
        submission: expiring,
        decision: "approved",
        fingerprint,
      });
      decisionPromise = decisionClient.query<ReviewSubmission>(
        statement.sql,
        statement.values,
      );

      let decisionBlocked = false;
      for (let attempt = 0; attempt < 200; attempt += 1) {
        const { rows } = await observer.query<{ waiting: boolean }>(
          `SELECT EXISTS (
               SELECT 1
               FROM pg_catalog.pg_stat_activity
               WHERE application_name = 'reviewer_delayed_asset_decision'
                 AND state = 'active'
                 AND wait_event_type = 'Lock'
             ) AS waiting`,
        );
        decisionBlocked = rows[0].waiting;
        if (decisionBlocked) break;
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      expect(decisionBlocked).toBe(true);

      let leaseExpired = false;
      for (let attempt = 0; attempt < 400; attempt += 1) {
        const { rows } = await observer.query<{ expired: boolean }>(
          `SELECT clock_timestamp() >= claim_expires_at AS expired
             FROM public.app_review_submission
             WHERE id = $1`,
          [expiring.id],
        );
        leaseExpired = rows[0].expired;
        if (leaseExpired) break;
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      expect(leaseExpired).toBe(true);

      await observer.query(
        `UPDATE public.app_review_notification
           SET status = 'processing',
               attempt_count = attempt_count + 1,
               locked_at = clock_timestamp(),
               locked_by = 'worker-delayed-decision',
               last_attempt_at = clock_timestamp()
           WHERE id = $1`,
        [cleanupRows[0].id],
      );

      await reconciliationClient.query(
        "SET application_name = 'reviewer_asset_cleanup_reconciliation_race'",
      );
      reconciliationPromise = reconciliationClient.query<{
        id: string;
        payload: Record<string, unknown>;
      }>(
        `SELECT reconciled.id, reconciled.payload
           FROM public.reviewer_reconcile_app_review_asset_cleanup(
             $1::uuid,
             $2::uuid,
             $3::text,
             $4::text,
             $5::integer,
             $6::text,
             $7::jsonb,
             $8::text
           ) AS reconciled`,
        [
          cleanupRows[0].id,
          expiring.id,
          fingerprint,
          operationId,
          expiring.review_version,
          fixture.draft.id,
          JSON.stringify(assetKeys),
          "worker-delayed-decision",
        ],
      );

      let reconciliationBlocked = false;
      for (let attempt = 0; attempt < 200; attempt += 1) {
        const { rows } = await observer.query<{ waiting: boolean }>(
          `SELECT EXISTS (
               SELECT 1
               FROM pg_catalog.pg_stat_activity
               WHERE application_name =
                 'reviewer_asset_cleanup_reconciliation_race'
                 AND state = 'active'
                 AND wait_event_type = 'Lock'
             ) AS waiting`,
        );
        reconciliationBlocked = rows[0].waiting;
        if (reconciliationBlocked) break;
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      expect(reconciliationBlocked).toBe(true);

      await blocker.query("COMMIT");
      blockerTransactionOpen = false;
      const decided = await decisionPromise;
      expect(decided.rows).toEqual([
        expect.objectContaining({ status: "approved" }),
      ]);
      await decisionClient.query("COMMIT");
      decisionTransactionOpen = false;

      const reconciled = await reconciliationPromise;
      expect(reconciled.rows).toEqual([
        expect.objectContaining({
          id: cleanupRows[0].id,
          payload: expect.objectContaining({
            settlement_state: "committed",
          }),
        }),
      ]);

      const { rows: finalState } = await observer.query<{
        submission_status: string;
        settlement_state: string;
      }>(
        `SELECT submission.status AS submission_status,
                  notification.payload ->> 'settlement_state' AS settlement_state
           FROM public.app_review_submission AS submission
           INNER JOIN public.app_review_notification AS notification
             ON notification.submission_id = submission.id
           WHERE submission.id = $1
             AND notification.id = $2`,
        [expiring.id, cleanupRows[0].id],
      );
      expect(finalState).toEqual([
        { submission_status: "approved", settlement_state: "committed" },
      ]);
    } finally {
      if (blockerTransactionOpen) await blocker.query("ROLLBACK");
      await Promise.allSettled(decisionPromise ? [decisionPromise] : []);
      if (decisionTransactionOpen) await decisionClient.query("ROLLBACK");
      await Promise.allSettled(
        reconciliationPromise ? [reconciliationPromise] : [],
      );
      blocker.release();
      decisionClient.release();
      reconciliationClient.release();
      observer.release();
      await pool.end();
    }
  }, 15_000);

  test("bridges one direct legacy listing transition into the queue and Slack outbox", async () => {
    const fixture = await prepareDraft({ mode: "external" });

    await query(
      `UPDATE public.app_metadata
       SET verification_status = 'awaiting_review',
           is_developer_allow_listing = true,
           changelog = 'Submitted through the legacy path'
       WHERE id = $1`,
      [fixture.draft.id],
    );

    const { rows } = await query<{
      status: string;
      app_mode: string;
      listing_target: string;
      listing_consent: boolean;
      changelog: string;
      submitted_by_subject: string | null;
      submitted_by_email: string | null;
      metadata_status: string;
      metadata_consent: string;
      localizations_snapshot: unknown[];
      asset_snapshot_is_null: boolean;
      submitted_event_count: string;
      event_actor_subject: string | null;
      slack_outbox_count: string;
    }>(
      `SELECT
         submission.status,
         submission.app_mode,
         submission.listing_target,
         submission.listing_consent,
         submission.changelog,
         submission.submitted_by_subject,
         submission.submitted_by_email,
         submission.metadata_snapshot ->> 'verification_status' AS metadata_status,
         submission.metadata_snapshot ->> 'is_developer_allow_listing' AS metadata_consent,
         submission.localizations_snapshot,
         submission.asset_snapshot IS NULL AS asset_snapshot_is_null,
         (
           SELECT count(*)::text
           FROM public.app_review_event AS event
           WHERE event.submission_id = submission.id
             AND event.event_type = 'submitted'
         ) AS submitted_event_count,
         (
           SELECT event.actor_subject
           FROM public.app_review_event AS event
           WHERE event.submission_id = submission.id
             AND event.event_type = 'submitted'
         ) AS event_actor_subject,
         (
           SELECT count(*)::text
           FROM public.app_review_notification AS notification
           WHERE notification.submission_id = submission.id
             AND notification.notification_type = 'submission_received'
             AND notification.channel = 'slack'
         ) AS slack_outbox_count
       FROM public.app_review_submission AS submission
       WHERE submission.app_metadata_id = $1`,
      [fixture.draft.id],
    );

    expect(rows).toEqual([
      {
        status: "pending",
        app_mode: "external",
        listing_target: "world_ecosystem",
        listing_consent: true,
        changelog: "Submitted through the legacy path",
        submitted_by_subject: "system:legacy-listing-bridge",
        submitted_by_email: null,
        metadata_status: "awaiting_review",
        metadata_consent: "true",
        localizations_snapshot: [],
        asset_snapshot_is_null: true,
        submitted_event_count: "1",
        event_actor_subject: "system:legacy-listing-bridge",
        slack_outbox_count: "1",
      },
    ]);
  });

  test("adds a missing Slack outbox row without replacing a backfilled submitted event", async () => {
    const fixture = await prepareDraft();
    const captured = await captureSubmission(fixture);

    await forceLegacyDatabaseState(
      `UPDATE public.app_review_submission
       SET submitted_by_subject = NULL,
           submitted_by_email = NULL,
           asset_snapshot = NULL
       WHERE id = $1`,
      [captured.id],
    );
    await forceLegacyDatabaseState(
      `UPDATE public.app_review_event
       SET actor_subject = NULL,
           actor_email = NULL,
           payload = jsonb_build_object('backfilled', true)
       WHERE submission_id = $1
         AND event_type = 'submitted'`,
      [captured.id],
    );
    await query(
      `DELETE FROM public.app_review_notification
       WHERE submission_id = $1
         AND notification_type = 'submission_received'`,
      [captured.id],
    );

    const first = await query<{ submission_id: string }>(
      `SELECT public.reconcile_uncaptured_listing_review_submission($1) AS submission_id`,
      [fixture.draft.id],
    );
    const retry = await query<{ submission_id: string }>(
      `SELECT public.reconcile_uncaptured_listing_review_submission($1) AS submission_id`,
      [fixture.draft.id],
    );

    expect(first.rows).toEqual([{ submission_id: captured.id }]);
    expect(retry.rows).toEqual(first.rows);

    const { rows } = await query<{
      submitted_event_count: string;
      actor_subject: string | null;
      event_payload: Record<string, unknown>;
      slack_outbox_count: string;
    }>(
      `SELECT
         (
           SELECT count(*)::text
           FROM public.app_review_event
           WHERE submission_id = $1
             AND event_type = 'submitted'
         ) AS submitted_event_count,
         (
           SELECT actor_subject
           FROM public.app_review_event
           WHERE submission_id = $1
             AND event_type = 'submitted'
         ) AS actor_subject,
         (
           SELECT payload
           FROM public.app_review_event
           WHERE submission_id = $1
             AND event_type = 'submitted'
         ) AS event_payload,
         (
           SELECT count(*)::text
           FROM public.app_review_notification
           WHERE submission_id = $1
             AND notification_type = 'submission_received'
             AND channel = 'slack'
         ) AS slack_outbox_count`,
      [captured.id],
    );

    expect(rows).toEqual([
      {
        submitted_event_count: "1",
        actor_subject: null,
        event_payload: { backfilled: true },
        slack_outbox_count: "1",
      },
    ]);
  });

  test.each([
    [
      "verification-only transitions",
      async (fixture: ReviewFixture) => {
        await query(
          `UPDATE public.app_metadata
           SET verification_status = 'awaiting_review',
               is_developer_allow_listing = false,
               app_mode = 'mini-app'
           WHERE id = $1`,
          [fixture.draft.id],
        );
      },
    ],
    [
      "native transitions",
      async (fixture: ReviewFixture) => {
        await query(
          `UPDATE public.app_metadata
           SET verification_status = 'awaiting_review',
               is_developer_allow_listing = true,
               app_mode = 'native'
           WHERE id = $1`,
          [fixture.draft.id],
        );
      },
    ],
    [
      "non-HTTPS integration URLs",
      async (fixture: ReviewFixture) => {
        await forceLegacyDatabaseState(
          `UPDATE public.app_metadata
           SET verification_status = 'awaiting_review',
               is_developer_allow_listing = true,
               integration_url = 'http://review.example.com/app'
           WHERE id = $1`,
          [fixture.draft.id],
        );
      },
    ],
    [
      "credential-bearing integration URLs",
      async (fixture: ReviewFixture) => {
        await forceLegacyDatabaseState(
          `UPDATE public.app_metadata
           SET verification_status = 'awaiting_review',
               is_developer_allow_listing = true,
               integration_url = 'https://reviewer:secret@review.example.com/app'
           WHERE id = $1`,
          [fixture.draft.id],
        );
      },
    ],
    [
      "malformed HTTPS integration URLs",
      async (fixture: ReviewFixture) => {
        await forceLegacyDatabaseState(
          `UPDATE public.app_metadata
           SET verification_status = 'awaiting_review',
               is_developer_allow_listing = true,
               integration_url = 'https://%'
           WHERE id = $1`,
          [fixture.draft.id],
        );
      },
    ],
    [
      "staging apps",
      async (fixture: ReviewFixture) => {
        await query(`UPDATE public.app SET is_staging = true WHERE id = $1`, [
          fixture.appId,
        ]);
        await query(
          `UPDATE public.app_metadata
           SET verification_status = 'awaiting_review',
               is_developer_allow_listing = true
           WHERE id = $1`,
          [fixture.draft.id],
        );
      },
    ],
    [
      "inactive apps",
      async (fixture: ReviewFixture) => {
        await query(`UPDATE public.app SET status = 'inactive' WHERE id = $1`, [
          fixture.appId,
        ]);
        await query(
          `UPDATE public.app_metadata
           SET verification_status = 'awaiting_review',
               is_developer_allow_listing = true
           WHERE id = $1`,
          [fixture.draft.id],
        );
      },
    ],
    [
      "archived apps",
      async (fixture: ReviewFixture) => {
        await query(`UPDATE public.app SET is_archived = true WHERE id = $1`, [
          fixture.appId,
        ]);
        await query(
          `UPDATE public.app_metadata
           SET verification_status = 'awaiting_review',
               is_developer_allow_listing = true
           WHERE id = $1`,
          [fixture.draft.id],
        );
      },
    ],
    [
      "deleted apps",
      async (fixture: ReviewFixture) => {
        await query(`UPDATE public.app SET deleted_at = now() WHERE id = $1`, [
          fixture.appId,
        ]);
        await query(
          `UPDATE public.app_metadata
           SET verification_status = 'awaiting_review',
               is_developer_allow_listing = true
           WHERE id = $1`,
          [fixture.draft.id],
        );
      },
    ],
    [
      "deleted teams",
      async (fixture: ReviewFixture) => {
        await query(
          `UPDATE public.team AS team
           SET deleted_at = now()
           FROM public.app AS app
           WHERE app.id = $1
             AND team.id = app.team_id`,
          [fixture.appId],
        );
        await query(
          `UPDATE public.app_metadata
           SET verification_status = 'awaiting_review',
               is_developer_allow_listing = true
           WHERE id = $1`,
          [fixture.draft.id],
        );
      },
    ],
  ] as const)("does not bridge %s", async (_label, transition) => {
    const fixture = await prepareDraft();

    await transition(fixture);
    await query(
      `SELECT public.reconcile_uncaptured_listing_review_submission($1)`,
      [fixture.draft.id],
    );

    const { rows } = await query<{
      submission_count: string;
      event_count: string;
      outbox_count: string;
    }>(
      `SELECT
         (
           SELECT count(*)::text
           FROM public.app_review_submission
           WHERE app_metadata_id = $1
         ) AS submission_count,
         (
           SELECT count(*)::text
           FROM public.app_review_event AS event
           INNER JOIN public.app_review_submission AS submission
             ON submission.id = event.submission_id
           WHERE submission.app_metadata_id = $1
         ) AS event_count,
         (
           SELECT count(*)::text
           FROM public.app_review_notification AS notification
           INNER JOIN public.app_review_submission AS submission
             ON submission.id = notification.submission_id
           WHERE submission.app_metadata_id = $1
         ) AS outbox_count`,
      [fixture.draft.id],
    );

    expect(rows).toEqual([
      { submission_count: "0", event_count: "0", outbox_count: "0" },
    ]);
  });

  test("does not duplicate submissions when the authoritative capture operation runs", async () => {
    const fixture = await prepareDraft();
    const captured = await captureSubmission(fixture);

    const { rows } = await query<{
      submission_count: string;
      submitted_event_count: string;
      slack_outbox_count: string;
      submitted_by_subject: string | null;
    }>(
      `SELECT
         count(*)::text AS submission_count,
         count(*) FILTER (
           WHERE EXISTS (
             SELECT 1
             FROM public.app_review_event AS event
             WHERE event.submission_id = submission.id
               AND event.event_type = 'submitted'
           )
         )::text AS submitted_event_count,
         count(*) FILTER (
           WHERE EXISTS (
             SELECT 1
             FROM public.app_review_notification AS notification
             WHERE notification.submission_id = submission.id
               AND notification.notification_type = 'submission_received'
               AND notification.channel = 'slack'
           )
         )::text AS slack_outbox_count,
         min(submission.submitted_by_subject) AS submitted_by_subject
       FROM public.app_review_submission AS submission
       WHERE submission.app_metadata_id = $1`,
      [fixture.draft.id],
    );

    expect(rows).toEqual([
      {
        submission_count: "1",
        submitted_event_count: "1",
        slack_outbox_count: "1",
        submitted_by_subject: "developer-auth0-subject",
      },
    ]);
    expect(captured.attempt).toBe(1);
  });

  test("prevents two active attempts for the same metadata version", async () => {
    const fixture = await prepareDraft();
    const submission = await captureSubmission(fixture);
    const pool = new Pool();

    try {
      await expect(
        pool.query(
          `INSERT INTO public.app_review_submission (
             app_metadata_id,
             app_id,
             team_id,
             attempt,
             status,
             app_mode,
             listing_target,
             listing_consent,
             metadata_updated_at,
             metadata_snapshot,
             localizations_snapshot
           )
           SELECT
             app_metadata_id,
             app_id,
             team_id,
             attempt + 1,
             'pending',
             app_mode,
             listing_target,
             listing_consent,
             metadata_updated_at,
             metadata_snapshot,
             localizations_snapshot
           FROM public.app_review_submission
           WHERE id = $1`,
          [submission.id],
        ),
      ).rejects.toMatchObject({
        code: "23505",
        constraint: "app_review_submission_one_active_metadata",
      });
    } finally {
      await pool.end();
    }
  });

  test("soft-deleting an app withdraws its active review atomically", async () => {
    const fixture = await prepareDraft();
    const claimed = await claimSubmission(await captureSubmission(fixture));

    await query(
      `UPDATE public.app
       SET deleted_at = now()
       WHERE id = $1`,
      [fixture.appId],
    );

    const { rows: submissions } = await query<{
      status: string;
      review_version: number;
      claim_token: string | null;
    }>(
      `SELECT status, review_version, claim_token
       FROM public.app_review_submission
       WHERE id = $1`,
      [claimed.id],
    );
    expect(submissions).toEqual([
      {
        status: "withdrawn",
        review_version: claimed.review_version + 1,
        claim_token: null,
      },
    ]);

    const { rows: metadata } = await query<{ verification_status: string }>(
      `SELECT verification_status
       FROM public.app_metadata
       WHERE id = $1`,
      [fixture.draft.id],
    );
    expect(metadata).toEqual([{ verification_status: "unverified" }]);

    const { rows: events } = await query<{
      actor_subject: string | null;
      event_type: string;
      payload: Record<string, unknown>;
    }>(
      `SELECT actor_subject, event_type, payload
       FROM public.app_review_event
       WHERE submission_id = $1
         AND event_type IN ('withdrawn', 'notification_dead_lettered')
       ORDER BY event_sequence`,
      [claimed.id],
    );
    expect(events).toEqual([
      {
        actor_subject: "system:app-deletion",
        event_type: "withdrawn",
        payload: expect.objectContaining({ reason: "app_deleted" }),
      },
      {
        actor_subject: "system:app-deletion",
        event_type: "notification_dead_lettered",
        payload: expect.objectContaining({ reason: "app_deleted" }),
      },
    ]);

    const { rows: notifications } = await query<{
      status: string;
      manual_retry_blocked: boolean;
      locked_at: string | null;
      locked_by: string | null;
    }>(
      `SELECT status, manual_retry_blocked, locked_at, locked_by
       FROM public.app_review_notification
       WHERE submission_id = $1
         AND notification_type = 'submission_received'`,
      [claimed.id],
    );
    expect(notifications).toEqual([
      {
        status: "dead_letter",
        manual_retry_blocked: true,
        locked_at: null,
        locked_by: null,
      },
    ]);
  });

  test("soft-deleting a team withdraws its active reviews atomically", async () => {
    const fixture = await prepareDraft();
    const claimed = await claimSubmission(await captureSubmission(fixture));
    const { rows: apps } = await query<{ team_id: string }>(
      `SELECT team_id FROM public.app WHERE id = $1`,
      [fixture.appId],
    );

    await query(
      `UPDATE public.team
       SET deleted_at = now()
       WHERE id = $1`,
      [apps[0].team_id],
    );

    const { rows: submissions } = await query<{
      status: string;
      review_version: number;
      claim_token: string | null;
    }>(
      `SELECT status, review_version, claim_token
       FROM public.app_review_submission
       WHERE id = $1`,
      [claimed.id],
    );
    expect(submissions).toEqual([
      {
        status: "withdrawn",
        review_version: claimed.review_version + 1,
        claim_token: null,
      },
    ]);

    const { rows: metadata } = await query<{ verification_status: string }>(
      `SELECT verification_status
       FROM public.app_metadata
       WHERE id = $1`,
      [fixture.draft.id],
    );
    expect(metadata).toEqual([{ verification_status: "unverified" }]);

    const { rows: events } = await query<{
      actor_subject: string | null;
      event_type: string;
      payload: Record<string, unknown>;
    }>(
      `SELECT actor_subject, event_type, payload
       FROM public.app_review_event
       WHERE submission_id = $1
         AND event_type IN ('withdrawn', 'notification_dead_lettered')
       ORDER BY event_sequence`,
      [claimed.id],
    );
    expect(events).toEqual([
      {
        actor_subject: "system:team-deletion",
        event_type: "withdrawn",
        payload: expect.objectContaining({ reason: "team_deleted" }),
      },
      {
        actor_subject: "system:team-deletion",
        event_type: "notification_dead_lettered",
        payload: expect.objectContaining({ reason: "team_deleted" }),
      },
    ]);

    const { rows: notifications } = await query<{
      status: string;
      manual_retry_blocked: boolean;
    }>(
      `SELECT status, manual_retry_blocked
       FROM public.app_review_notification
       WHERE submission_id = $1
         AND notification_type = 'submission_received'`,
      [claimed.id],
    );
    expect(notifications).toEqual([
      { status: "dead_letter", manual_retry_blocked: true },
    ]);
  });

  test("banning an app withdraws its active review and cancels delivery", async () => {
    const fixture = await prepareDraft();
    const claimed = await claimSubmission(await captureSubmission(fixture));

    await query(`UPDATE public.app SET is_banned = true WHERE id = $1`, [
      fixture.appId,
    ]);

    const { rows: state } = await query<{
      status: string;
      review_version: number;
      claim_token: string | null;
      verification_status: string;
    }>(
      `SELECT
         submission.status,
         submission.review_version,
         submission.claim_token,
         metadata.verification_status
       FROM public.app_review_submission AS submission
       INNER JOIN public.app_metadata AS metadata
         ON metadata.id = submission.app_metadata_id
       WHERE submission.id = $1`,
      [claimed.id],
    );
    expect(state).toEqual([
      {
        status: "withdrawn",
        review_version: claimed.review_version + 1,
        claim_token: null,
        verification_status: "unverified",
      },
    ]);

    const { rows: events } = await query<{
      actor_subject: string | null;
      event_type: string;
      payload: Record<string, unknown>;
    }>(
      `SELECT actor_subject, event_type, payload
       FROM public.app_review_event
       WHERE submission_id = $1
         AND event_type IN ('withdrawn', 'notification_dead_lettered')
       ORDER BY event_sequence`,
      [claimed.id],
    );
    expect(events).toEqual([
      {
        actor_subject: "system:app-ban",
        event_type: "withdrawn",
        payload: expect.objectContaining({ reason: "app_banned" }),
      },
      {
        actor_subject: "system:app-ban",
        event_type: "notification_dead_lettered",
        payload: expect.objectContaining({ reason: "app_banned" }),
      },
    ]);

    const { rows: notifications } = await query<{ status: string }>(
      `SELECT status
       FROM public.app_review_notification
       WHERE submission_id = $1
         AND notification_type = 'submission_received'`,
      [claimed.id],
    );
    expect(notifications).toEqual([{ status: "dead_letter" }]);
  });

  test("reconciles legacy withdrawn Slack work once and leaves completed decisions deliverable", async () => {
    const withdrawnFixture = await prepareDraft();
    const withdrawn = await captureSubmission(withdrawnFixture);
    await forceLegacyDatabaseState(
      `UPDATE public.app_review_submission
       SET status = 'withdrawn',
           completed_at = now(),
           review_version = review_version + 1
       WHERE id = $1`,
      [withdrawn.id],
    );
    await forceLegacyDatabaseState(
      `UPDATE public.app_metadata
       SET verification_status = 'unverified'
       WHERE id = $1`,
      [withdrawnFixture.draft.id],
    );

    const first = await query<{ reconciled: number }>(
      `SELECT public.reconcile_terminal_app_review_submission_notifications(50) AS reconciled`,
    );
    const retry = await query<{ reconciled: number }>(
      `SELECT public.reconcile_terminal_app_review_submission_notifications(50) AS reconciled`,
    );
    expect(first.rows).toEqual([{ reconciled: 1 }]);
    expect(retry.rows).toEqual([{ reconciled: 0 }]);

    const { rows: cancelled } = await query<{
      status: string;
      manual_retry_blocked: boolean;
      cancellation_reason: string;
      cancellation_events: string;
    }>(
      `SELECT
         notification.status,
         notification.manual_retry_blocked,
         notification.payload ->> 'cancellation_reason' AS cancellation_reason,
         (
           SELECT count(*)::text
           FROM public.app_review_event AS event
           WHERE event.submission_id = notification.submission_id
             AND event.event_type = 'notification_dead_lettered'
             AND event.payload ->> 'notification_id' = notification.id::text
         ) AS cancellation_events
       FROM public.app_review_notification AS notification
       WHERE notification.submission_id = $1
         AND notification.notification_type = 'submission_received'`,
      [withdrawn.id],
    );
    expect(cancelled).toEqual([
      {
        status: "dead_letter",
        manual_retry_blocked: true,
        cancellation_reason: "submission_withdrawn",
        cancellation_events: "1",
      },
    ]);

    for (const decisionStatus of ["approved", "changes_requested"]) {
      await integrationDBClean();
      const fixture = await prepareDraft();
      const submission = await captureSubmission(fixture);
      await forceLegacyDatabaseState(
        `UPDATE public.app_review_submission
         SET status = $2,
             completed_at = now()
         WHERE id = $1`,
        [submission.id, decisionStatus],
      );

      const { rows: claimedNotifications } = await query<{ id: string }>(
        `SELECT claimed.id
         FROM public.reviewer_claim_app_review_notifications(
           'completed-decision-worker',
           10
         ) AS claimed
         WHERE claimed.submission_id = $1
           AND claimed.notification_type = 'submission_received'`,
        [submission.id],
      );
      expect(claimedNotifications).toHaveLength(1);
    }
  });

  test("fences the Slack provider boundary against withdrawal and ambiguous failure", async () => {
    const fixture = await prepareDraft();
    const submission = await captureSubmission(fixture);
    const workerId = "slack-fence-worker";
    const fenceToken = "55555555-5555-4555-8555-555555555555";
    const { rows: claimedNotifications } = await query<{ id: string }>(
      `SELECT claimed.id
       FROM public.reviewer_claim_app_review_notifications($1, 10) AS claimed
       WHERE claimed.submission_id = $2
         AND claimed.notification_type = 'submission_received'`,
      [workerId, submission.id],
    );
    expect(claimedNotifications).toHaveLength(1);
    const notificationId = claimedNotifications[0].id;

    const { rows: fenced } = await query<{ id: string }>(
      `SELECT begun.id
       FROM public.reviewer_begin_app_review_submission_slack_delivery(
         $1::uuid,
         $2::text,
         $3::uuid
       ) AS begun`,
      [notificationId, workerId, fenceToken],
    );
    expect(fenced).toEqual([{ id: notificationId }]);

    await query(
      `UPDATE public.app_review_notification
       SET attempt_count = 8
       WHERE id = $1`,
      [notificationId],
    );

    const withdraw = () =>
      query(
        `SELECT id
         FROM public.developer_withdraw_active_review_draft(
           $1::text,
           $2::timestamptz,
           $3::uuid,
           $4::integer,
           $5::text,
           $6::text
         )`,
        [
          fixture.draft.id,
          submission.metadata_updated_at,
          submission.id,
          submission.review_version,
          "developer-auth0-subject",
          "developer@example.com",
        ],
      );

    await expect(withdraw()).rejects.toMatchObject({ code: "55P03" });

    const { rows: failed } = await query<{
      status: string;
      fence_token: string | null;
    }>(
      `SELECT
         completed.status,
         completed.payload #>> '{provider_send_fence,token}' AS fence_token
       FROM public.reviewer_complete_app_review_notification(
         $1::uuid,
         $2::text,
         'failed',
         NULL,
         'Ambiguous Slack response.'
       ) AS completed`,
      [notificationId, workerId],
    );
    expect(failed).toEqual([
      { status: "dead_letter", fence_token: fenceToken },
    ]);
    await expect(withdraw()).rejects.toMatchObject({ code: "55P03" });

    await forceLegacyDatabaseState(
      `UPDATE public.app_review_notification
       SET payload = jsonb_set(
         payload,
         '{provider_send_fence,expires_at}',
         to_jsonb((clock_timestamp() - interval '1 second')::text)
       )
       WHERE id = $1`,
      [notificationId],
    );
    await expect(withdraw()).resolves.toMatchObject({
      rows: [{ id: fixture.draft.id }],
    });

    const { rows: finalNotification } = await query<{
      status: string;
      manual_retry_blocked: boolean;
    }>(
      `SELECT status, manual_retry_blocked
       FROM public.app_review_notification
       WHERE id = $1`,
      [notificationId],
    );
    expect(finalNotification).toEqual([
      { status: "dead_letter", manual_retry_blocked: true },
    ]);
  });

  test.each([
    ["app deletion", `UPDATE public.app SET deleted_at = now() WHERE id = $1`],
    ["app ban", `UPDATE public.app SET is_banned = true WHERE id = $1`],
  ])(
    "does not deadlock approval against concurrent %s",
    async (_label, transitionSql) => {
      const fixture = await prepareDraft();
      const reviewed = await saveChecklist(
        await claimSubmission(await captureSubmission(fixture)),
      );
      const pool = new Pool({ max: 3 });
      const transitionClient = await pool.connect();
      const decisionClient = await pool.connect();
      const observer = await pool.connect();
      let transitionOpen = false;
      let decisionOpen = false;
      let decisionPromise: Promise<QueryResult<ReviewSubmission>> | undefined;

      try {
        await transitionClient.query("BEGIN");
        transitionOpen = true;
        await transitionClient.query(
          `SELECT id FROM public.app WHERE id = $1 FOR UPDATE`,
          [fixture.appId],
        );

        await decisionClient.query("BEGIN");
        decisionOpen = true;
        await decisionClient.query(
          "SET application_name = 'reviewer_approval_app_transition_race'",
        );
        const statement = decisionStatement({
          fixture,
          submission: reviewed,
          decision: "approved",
          fingerprint: "9".repeat(64),
        });
        decisionPromise = decisionClient.query<ReviewSubmission>(
          statement.sql,
          statement.values,
        );
        await waitForDatabaseLock(
          observer,
          "reviewer_approval_app_transition_race",
        );

        await expect(
          transitionClient.query(transitionSql, [fixture.appId]),
        ).rejects.toMatchObject({ code: "55P03" });
        await transitionClient.query("ROLLBACK");
        transitionOpen = false;

        const decided = await decisionPromise;
        expect(decided.rows).toEqual([
          expect.objectContaining({ status: "approved" }),
        ]);
        await decisionClient.query("COMMIT");
        decisionOpen = false;
      } finally {
        if (transitionOpen) await transitionClient.query("ROLLBACK");
        await Promise.allSettled(decisionPromise ? [decisionPromise] : []);
        if (decisionOpen) await decisionClient.query("ROLLBACK");
        transitionClient.release();
        decisionClient.release();
        observer.release();
        await pool.end();
      }
    },
    15_000,
  );

  test("does not deadlock approval against concurrent team deletion", async () => {
    const fixture = await prepareDraft();
    const reviewed = await saveChecklist(
      await claimSubmission(await captureSubmission(fixture)),
    );
    const { rows: apps } = await query<{ team_id: string }>(
      `SELECT team_id FROM public.app WHERE id = $1`,
      [fixture.appId],
    );
    const pool = new Pool({ max: 4 });
    const teamClient = await pool.connect();
    const blocker = await pool.connect();
    const decisionClient = await pool.connect();
    const observer = await pool.connect();
    let teamOpen = false;
    let blockerOpen = false;
    let decisionOpen = false;
    let decisionPromise: Promise<QueryResult<ReviewSubmission>> | undefined;

    try {
      await teamClient.query("BEGIN");
      teamOpen = true;
      await teamClient.query(
        `SELECT id FROM public.team WHERE id = $1 FOR UPDATE`,
        [apps[0].team_id],
      );

      await blocker.query("BEGIN");
      blockerOpen = true;
      await blocker.query(
        `SELECT id FROM public.app_review_submission WHERE id = $1 FOR UPDATE`,
        [reviewed.id],
      );

      await decisionClient.query("BEGIN");
      decisionOpen = true;
      await decisionClient.query(
        "SET application_name = 'reviewer_approval_team_transition_race'",
      );
      const statement = decisionStatement({
        fixture,
        submission: reviewed,
        decision: "approved",
        fingerprint: "a".repeat(64),
      });
      decisionPromise = decisionClient.query<ReviewSubmission>(
        statement.sql,
        statement.values,
      );
      await waitForDatabaseLock(
        observer,
        "reviewer_approval_team_transition_race",
      );

      await expect(
        teamClient.query(
          `UPDATE public.team SET deleted_at = now() WHERE id = $1`,
          [apps[0].team_id],
        ),
      ).rejects.toMatchObject({ code: "55P03" });
      await teamClient.query("ROLLBACK");
      teamOpen = false;
      await blocker.query("COMMIT");
      blockerOpen = false;

      const decided = await decisionPromise;
      expect(decided.rows).toEqual([
        expect.objectContaining({ status: "approved" }),
      ]);
      await decisionClient.query("COMMIT");
      decisionOpen = false;
    } finally {
      if (teamOpen) await teamClient.query("ROLLBACK");
      if (blockerOpen) await blocker.query("ROLLBACK");
      await Promise.allSettled(decisionPromise ? [decisionPromise] : []);
      if (decisionOpen) await decisionClient.query("ROLLBACK");
      teamClient.release();
      blocker.release();
      decisionClient.release();
      observer.release();
      await pool.end();
    }
  }, 15_000);

  test("serializes a legacy bridge update against authoritative capture", async () => {
    const fixture = await prepareDraft();
    const pool = new Pool({ max: 4 });
    const blocker = await pool.connect();
    const legacyClient = await pool.connect();
    const captureClient = await pool.connect();
    const observer = await pool.connect();
    let blockerOpen = false;
    let legacyPromise: Promise<QueryResult> | undefined;
    let capturePromise: Promise<QueryResult<ReviewSubmission>> | undefined;
    const assetSnapshot = {
      version: 1,
      prefix: `review-submissions/${fixture.appId}/${fixture.draft.id}/${"c".repeat(32)}/`,
      objects: {
        [`unverified/${fixture.appId}/logo_img.png`]: `review-submissions/${fixture.appId}/${fixture.draft.id}/${"c".repeat(32)}/logo_img.png`,
      },
    };

    try {
      await blocker.query("BEGIN");
      blockerOpen = true;
      await blocker.query(
        `SELECT id FROM public.app WHERE id = $1 FOR UPDATE`,
        [fixture.appId],
      );

      await legacyClient.query(
        "SET application_name = 'reviewer_legacy_bridge_capture_race'",
      );
      legacyPromise = legacyClient.query(
        `UPDATE public.app_metadata
         SET verification_status = 'awaiting_review',
             is_developer_allow_listing = true,
             changelog = 'Legacy concurrent submission'
         WHERE id = $1`,
        [fixture.draft.id],
      );
      await waitForDatabaseLock(
        observer,
        "reviewer_legacy_bridge_capture_race",
      );

      await captureClient.query(
        "SET application_name = 'reviewer_authoritative_capture_race'",
      );
      capturePromise = captureClient.query<ReviewSubmission>(
        `SELECT *
         FROM public.capture_listing_review_submission(
           $1::text,
           'Authoritative concurrent submission'::text,
           'developer-auth0-subject'::text,
           'developer@example.com'::text,
           true,
           $2::timestamptz,
           '[]'::jsonb,
           $3::jsonb
         )`,
        [
          fixture.draft.id,
          fixture.draft.updated_at,
          JSON.stringify(assetSnapshot),
        ],
      );
      await waitForDatabaseLock(
        observer,
        "reviewer_authoritative_capture_race",
      );

      await blocker.query("COMMIT");
      blockerOpen = false;
      await legacyPromise;
      await expect(capturePromise).rejects.toMatchObject({
        code: "P0001",
        message: expect.stringMatching(/Only unverified/i),
      });

      const { rows: counts } = await observer.query<{
        submission_count: string;
        outbox_count: string;
      }>(
        `SELECT
           count(DISTINCT submission.id)::text AS submission_count,
           count(DISTINCT notification.id)::text AS outbox_count
         FROM public.app_review_submission AS submission
         LEFT JOIN public.app_review_notification AS notification
           ON notification.submission_id = submission.id
          AND notification.notification_type = 'submission_received'
         WHERE submission.app_metadata_id = $1`,
        [fixture.draft.id],
      );
      expect(counts).toEqual([{ submission_count: "1", outbox_count: "1" }]);
    } finally {
      if (blockerOpen) await blocker.query("ROLLBACK");
      await Promise.allSettled(legacyPromise ? [legacyPromise] : []);
      await Promise.allSettled(capturePromise ? [capturePromise] : []);
      blocker.release();
      legacyClient.release();
      captureClient.release();
      observer.release();
      await pool.end();
    }
  }, 15_000);

  test("serializes a legacy bridge update against developer withdrawal", async () => {
    const fixture = await prepareDraft();
    const pool = new Pool({ max: 4 });
    const blocker = await pool.connect();
    const legacyClient = await pool.connect();
    const withdrawClient = await pool.connect();
    const observer = await pool.connect();
    let blockerOpen = false;
    let legacyPromise: Promise<QueryResult> | undefined;
    let withdrawPromise: Promise<QueryResult<MetadataVersion>> | undefined;

    try {
      await blocker.query("BEGIN");
      blockerOpen = true;
      await blocker.query(
        `SELECT id FROM public.app WHERE id = $1 FOR UPDATE`,
        [fixture.appId],
      );
      await legacyClient.query(
        "SET application_name = 'reviewer_legacy_bridge_withdraw_race'",
      );
      legacyPromise = legacyClient.query(
        `UPDATE public.app_metadata
         SET verification_status = 'awaiting_review',
             is_developer_allow_listing = true,
             changelog = 'Legacy withdrawal race'
         WHERE id = $1`,
        [fixture.draft.id],
      );
      await waitForDatabaseLock(
        observer,
        "reviewer_legacy_bridge_withdraw_race",
      );

      await withdrawClient.query(
        "SET application_name = 'reviewer_withdraw_legacy_bridge_race'",
      );
      withdrawPromise = withdrawClient.query<MetadataVersion>(
        `SELECT id, updated_at::text AS updated_at
         FROM public.developer_withdraw_active_review_draft(
           $1::text,
           $2::timestamptz,
           NULL::uuid,
           NULL::integer,
           'developer-auth0-subject'::text,
           'developer@example.com'::text
         )`,
        [fixture.draft.id, fixture.draft.updated_at],
      );
      await waitForDatabaseLock(
        observer,
        "reviewer_withdraw_legacy_bridge_race",
      );

      await blocker.query("COMMIT");
      blockerOpen = false;
      await legacyPromise;
      expect((await withdrawPromise).rows).toEqual([]);

      const { rows: current } = await observer.query<MetadataVersion>(
        `SELECT id, updated_at::text AS updated_at
         FROM public.app_metadata
         WHERE id = $1`,
        [fixture.draft.id],
      );
      const { rows: submissions } = await observer.query<ReviewSubmission>(
        `SELECT *, metadata_updated_at::text AS metadata_updated_at
         FROM public.app_review_submission
         WHERE app_metadata_id = $1
           AND status IN ('pending', 'in_review')`,
        [fixture.draft.id],
      );
      expect(submissions).toHaveLength(1);
      const retried = await observer.query<MetadataVersion>(
        `SELECT id, updated_at::text AS updated_at
         FROM public.developer_withdraw_active_review_draft(
           $1::text,
           $2::timestamptz,
           $3::uuid,
           $4::integer,
           'developer-auth0-subject'::text,
           'developer@example.com'::text
         )`,
        [
          fixture.draft.id,
          current[0].updated_at,
          submissions[0].id,
          submissions[0].review_version,
        ],
      );
      expect(retried.rows).toHaveLength(1);
    } finally {
      if (blockerOpen) await blocker.query("ROLLBACK");
      await Promise.allSettled(legacyPromise ? [legacyPromise] : []);
      await Promise.allSettled(withdrawPromise ? [withdrawPromise] : []);
      blocker.release();
      legacyClient.release();
      withdrawClient.release();
      observer.release();
      await pool.end();
    }
  }, 15_000);

  test("serializes asset snapshot repair against request changes", async () => {
    const fixture = await prepareDraft();
    const reviewed = await saveChecklist(
      await claimSubmission(await captureSubmission(fixture)),
    );
    await forceLegacyDatabaseState(
      `UPDATE public.app_review_submission SET asset_snapshot = NULL WHERE id = $1`,
      [reviewed.id],
    );
    const assetSnapshot = {
      version: 1,
      prefix: `review-submissions/${fixture.appId}/${fixture.draft.id}/${"a".repeat(32)}/`,
      objects: {
        [`unverified/${fixture.appId}/logo_img.png`]: `review-submissions/${fixture.appId}/${fixture.draft.id}/${"a".repeat(32)}/logo_img.png`,
      },
    };
    const pool = new Pool({ max: 4 });
    const blocker = await pool.connect();
    const repairClient = await pool.connect();
    const decisionClient = await pool.connect();
    const observer = await pool.connect();
    let blockerOpen = false;
    let repairPromise: Promise<QueryResult<ReviewSubmission>> | undefined;
    let decisionPromise: Promise<QueryResult<ReviewSubmission>> | undefined;

    try {
      await blocker.query("BEGIN");
      blockerOpen = true;
      await blocker.query(
        `SELECT id FROM public.app_review_submission WHERE id = $1 FOR UPDATE`,
        [reviewed.id],
      );

      await repairClient.query(
        "SET application_name = 'reviewer_asset_repair_request_changes_race'",
      );
      repairPromise = repairClient.query<ReviewSubmission>(
        `SELECT *
         FROM public.reviewer_set_app_review_asset_snapshot(
           $1::uuid,
           $2::integer,
           $3::jsonb
         )`,
        [reviewed.id, reviewed.review_version, JSON.stringify(assetSnapshot)],
      );
      await waitForDatabaseLock(
        observer,
        "reviewer_asset_repair_request_changes_race",
      );

      await decisionClient.query(
        "SET application_name = 'reviewer_request_changes_asset_repair_race'",
      );
      const statement = decisionStatement({
        fixture,
        submission: reviewed,
        decision: "changes_requested",
        fingerprint: "b".repeat(64),
      });
      decisionPromise = decisionClient.query<ReviewSubmission>(
        statement.sql,
        statement.values,
      );
      await waitForDatabaseLock(
        observer,
        "reviewer_request_changes_asset_repair_race",
      );

      await blocker.query("COMMIT");
      blockerOpen = false;
      expect((await repairPromise).rows).toHaveLength(1);
      expect((await decisionPromise).rows).toEqual([
        expect.objectContaining({ status: "changes_requested" }),
      ]);
    } finally {
      if (blockerOpen) await blocker.query("ROLLBACK");
      await Promise.allSettled(repairPromise ? [repairPromise] : []);
      await Promise.allSettled(decisionPromise ? [decisionPromise] : []);
      blocker.release();
      repairClient.release();
      decisionClient.release();
      observer.release();
      await pool.end();
    }
  }, 15_000);

  test("serializes asset repair reconciliation against withdrawal", async () => {
    const fixture = await prepareDraft();
    const submission = await captureSubmission(fixture);
    await forceLegacyDatabaseState(
      `UPDATE public.app_review_submission SET asset_snapshot = NULL WHERE id = $1`,
      [submission.id],
    );
    const assetSnapshot = {
      version: 1,
      prefix: `review-submissions/${fixture.appId}/${fixture.draft.id}/${"a".repeat(32)}/`,
      objects: {
        [`unverified/${fixture.appId}/logo_img.png`]: `review-submissions/${fixture.appId}/${fixture.draft.id}/${"a".repeat(32)}/logo_img.png`,
      },
    };
    const pool = new Pool({ max: 4 });
    const setterClient = await pool.connect();
    const reconciliationClient = await pool.connect();
    const withdrawClient = await pool.connect();
    const observer = await pool.connect();
    let setterOpen = false;
    let reconciliationPromise:
      | Promise<QueryResult<ReviewSubmission>>
      | undefined;
    let withdrawPromise: Promise<QueryResult<MetadataVersion>> | undefined;

    try {
      await setterClient.query("BEGIN");
      setterOpen = true;
      const repaired = await setterClient.query<ReviewSubmission>(
        `SELECT *
         FROM public.reviewer_set_app_review_asset_snapshot(
           $1::uuid,
           $2::integer,
           $3::jsonb
         )`,
        [
          submission.id,
          submission.review_version,
          JSON.stringify(assetSnapshot),
        ],
      );
      expect(repaired.rows).toHaveLength(1);

      await reconciliationClient.query(
        "SET application_name = 'reviewer_asset_reconciliation_withdraw_race'",
      );
      reconciliationPromise = reconciliationClient.query<ReviewSubmission>(
        `SELECT *
         FROM public.reconcile_app_review_asset_snapshot_repair(
           $1::uuid,
           $2::jsonb
         )`,
        [submission.id, JSON.stringify(assetSnapshot)],
      );
      await waitForDatabaseLock(
        observer,
        "reviewer_asset_reconciliation_withdraw_race",
      );

      await withdrawClient.query(
        "SET application_name = 'reviewer_withdraw_asset_reconciliation_race'",
      );
      withdrawPromise = withdrawClient.query<MetadataVersion>(
        `SELECT id, updated_at::text AS updated_at
         FROM public.developer_withdraw_active_review_draft(
           $1::text,
           $2::timestamptz,
           $3::uuid,
           $4::integer,
           'developer-auth0-subject'::text,
           'developer@example.com'::text
         )`,
        [
          fixture.draft.id,
          submission.metadata_updated_at,
          submission.id,
          submission.review_version,
        ],
      );
      await waitForDatabaseLock(
        observer,
        "reviewer_withdraw_asset_reconciliation_race",
      );

      await setterClient.query("COMMIT");
      setterOpen = false;
      expect((await reconciliationPromise).rows).toHaveLength(1);
      expect((await withdrawPromise).rows).toHaveLength(1);

      const { rows: finalState } = await observer.query<{ status: string }>(
        `SELECT status FROM public.app_review_submission WHERE id = $1`,
        [submission.id],
      );
      expect(finalState).toEqual([{ status: "withdrawn" }]);
    } finally {
      if (setterOpen) await setterClient.query("ROLLBACK");
      await Promise.allSettled(
        reconciliationPromise ? [reconciliationPromise] : [],
      );
      await Promise.allSettled(withdrawPromise ? [withdrawPromise] : []);
      setterClient.release();
      reconciliationClient.release();
      withdrawClient.release();
      observer.release();
      await pool.end();
    }
  }, 15_000);

  test("serializes manual notification retry behind withdrawal", async () => {
    const fixture = await prepareDraft();
    const submission = await captureSubmission(fixture);
    const { rows: notifications } = await query<{ id: string }>(
      `UPDATE public.app_review_notification
       SET status = 'failed',
           last_error = 'Retry me'
       WHERE submission_id = $1
         AND notification_type = 'submission_received'
       RETURNING id`,
      [submission.id],
    );
    const notificationId = notifications[0].id;
    const pool = new Pool({ max: 4 });
    const blocker = await pool.connect();
    const withdrawClient = await pool.connect();
    const retryClient = await pool.connect();
    const observer = await pool.connect();
    let blockerOpen = false;
    let withdrawPromise: Promise<QueryResult<MetadataVersion>> | undefined;
    let retryPromise: Promise<QueryResult<{ id: string }>> | undefined;

    try {
      await blocker.query("BEGIN");
      blockerOpen = true;
      await blocker.query(
        `SELECT id FROM public.app_review_notification WHERE id = $1 FOR UPDATE`,
        [notificationId],
      );

      await withdrawClient.query(
        "SET application_name = 'reviewer_withdraw_notification_retry_race'",
      );
      withdrawPromise = withdrawClient.query<MetadataVersion>(
        `SELECT id, updated_at::text AS updated_at
         FROM public.developer_withdraw_active_review_draft(
           $1::text,
           $2::timestamptz,
           $3::uuid,
           $4::integer,
           'developer-auth0-subject'::text,
           'developer@example.com'::text
         )`,
        [
          fixture.draft.id,
          submission.metadata_updated_at,
          submission.id,
          submission.review_version,
        ],
      );
      await waitForDatabaseLock(
        observer,
        "reviewer_withdraw_notification_retry_race",
      );

      await retryClient.query(
        "SET application_name = 'reviewer_retry_withdraw_race'",
      );
      retryPromise = retryClient.query<{ id: string }>(
        `SELECT retried.id
         FROM public.reviewer_retry_app_review_notification(
           $1::uuid,
           '66666666-6666-4666-8666-666666666666'::uuid,
           'reviewer-okta-subject'::text,
           'reviewer@world.org'::text
         ) AS retried`,
        [notificationId],
      );
      await waitForDatabaseLock(observer, "reviewer_retry_withdraw_race");

      await blocker.query("COMMIT");
      blockerOpen = false;
      expect((await withdrawPromise).rows).toHaveLength(1);
      expect((await retryPromise).rows).toEqual([]);

      const { rows: finalState } = await observer.query<{
        status: string;
        manual_retry_blocked: boolean;
        retry_event_count: string;
      }>(
        `SELECT
           notification.status,
           notification.manual_retry_blocked,
           (
             SELECT count(*)::text
             FROM public.app_review_event AS event
             WHERE event.submission_id = notification.submission_id
               AND event.event_type = 'notification_retry_requested'
           ) AS retry_event_count
         FROM public.app_review_notification AS notification
         WHERE notification.id = $1`,
        [notificationId],
      );
      expect(finalState).toEqual([
        {
          status: "dead_letter",
          manual_retry_blocked: true,
          retry_event_count: "0",
        },
      ]);
    } finally {
      if (blockerOpen) await blocker.query("ROLLBACK");
      await Promise.allSettled(withdrawPromise ? [withdrawPromise] : []);
      await Promise.allSettled(retryPromise ? [retryPromise] : []);
      blocker.release();
      withdrawClient.release();
      retryClient.release();
      observer.release();
      await pool.end();
    }
  }, 15_000);

  test("serializes simultaneous claims and rejects stale lease versions", async () => {
    const fixture = await prepareDraft();
    const submission = await captureSubmission(fixture);
    const pool = new Pool({ max: 4 });
    const blocker = await pool.connect();
    const firstClaimant = await pool.connect();
    const secondClaimant = await pool.connect();
    const observer = await pool.connect();
    let blockerTransactionOpen = false;
    let firstClaimPromise: Promise<QueryResult<ReviewSubmission>> | undefined;
    let secondClaimPromise: Promise<QueryResult<ReviewSubmission>> | undefined;

    try {
      await blocker.query("BEGIN");
      blockerTransactionOpen = true;
      await blocker.query(
        `SELECT id
         FROM public.app_review_submission
         WHERE id = $1
         FOR UPDATE`,
        [submission.id],
      );
      await firstClaimant.query(
        "SET application_name = 'reviewer_claim_race_one'",
      );
      await secondClaimant.query(
        "SET application_name = 'reviewer_claim_race_two'",
      );

      const claimSql = `SELECT *
        FROM public.reviewer_claim_app_review_submission(
          $1::uuid,
          $2::integer,
          $3::text,
          $4::text
        )`;
      const firstClaimQuery = firstClaimant.query<ReviewSubmission>(claimSql, [
        submission.id,
        submission.review_version,
        "reviewer-one",
        "reviewer-one@world.org",
      ]);
      const secondClaimQuery = secondClaimant.query<ReviewSubmission>(
        claimSql,
        [
          submission.id,
          submission.review_version,
          "reviewer-two",
          "reviewer-two@world.org",
        ],
      );
      firstClaimPromise = firstClaimQuery;
      secondClaimPromise = secondClaimQuery;

      let blockedClaims = 0;
      for (let attempt = 0; attempt < 100; attempt += 1) {
        const { rows } = await observer.query<{ count: string }>(
          `SELECT count(*)::text AS count
           FROM pg_catalog.pg_stat_activity
           WHERE application_name IN (
             'reviewer_claim_race_one',
             'reviewer_claim_race_two'
           )
             AND state = 'active'
             AND wait_event_type = 'Lock'`,
        );
        blockedClaims = Number(rows[0].count);
        if (blockedClaims === 2) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      expect(blockedClaims).toBe(2);

      await blocker.query("COMMIT");
      blockerTransactionOpen = false;
      const [first, second] = await Promise.all([
        firstClaimQuery,
        secondClaimQuery,
      ]);
      const winners = [...first.rows, ...second.rows];

      expect(winners).toHaveLength(1);
      expect(winners[0]).toMatchObject({
        status: "in_review",
        review_version: 2,
      });

      const staleHeartbeat = await blocker.query<ReviewSubmission>(
        `SELECT *
         FROM public.reviewer_heartbeat_app_review_submission(
           $1::uuid,
           $2::uuid,
           $3::integer,
           $4::text,
           $5::text
         )`,
        [
          submission.id,
          winners[0].claim_token,
          1,
          first.rows.length === 1 ? "reviewer-one" : "reviewer-two",
          first.rows.length === 1
            ? "reviewer-one@world.org"
            : "reviewer-two@world.org",
        ],
      );
      expect(staleHeartbeat.rows).toHaveLength(0);

      const { rows: claimEvents } = await blocker.query<{ count: string }>(
        `SELECT count(*)::text AS count
         FROM public.app_review_event
         WHERE submission_id = $1
           AND event_type = 'claimed'`,
        [submission.id],
      );
      expect(claimEvents[0].count).toBe("1");
    } finally {
      if (blockerTransactionOpen) {
        await blocker.query("ROLLBACK");
      }
      await Promise.allSettled(
        [firstClaimPromise, secondClaimPromise].filter(
          (promise): promise is NonNullable<typeof promise> => Boolean(promise),
        ),
      );
      blocker.release();
      firstClaimant.release();
      secondClaimant.release();
      observer.release();
      await pool.end();
    }
  });

  test("reassigns an expired lease and records the expiration", async () => {
    const fixture = await prepareDraft();
    const submission = await captureSubmission(fixture);
    const firstClaim = await claimSubmission(submission);

    await query(
      `UPDATE public.app_review_submission
       SET claimed_at = now() - interval '31 minutes',
           claim_expires_at = now() - interval '1 minute'
       WHERE id = $1`,
      [submission.id],
    );

    const { rows } = await query<ReviewSubmission>(
      `SELECT *
       FROM public.reviewer_claim_app_review_submission(
         $1::uuid,
         $2::integer,
         $3::text,
         $4::text
       )`,
      [
        submission.id,
        firstClaim.review_version,
        "reviewer-two",
        "two@world.org",
      ],
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ status: "in_review", review_version: 3 });
    expect(rows[0].claim_token).not.toBe(firstClaim.claim_token);

    const { rows: events } = await query<{ event_type: string }>(
      `SELECT event_type
       FROM public.app_review_event
       WHERE submission_id = $1
       ORDER BY event_sequence`,
      [submission.id],
    );
    expect(events.map(({ event_type }) => event_type)).toEqual([
      "submitted",
      "claimed",
      "claim_expired",
      "claimed",
    ]);
  });

  test("rotates a live claim for the same reviewer after tab storage is lost", async () => {
    const fixture = await prepareDraft();
    const firstClaim = await claimSubmission(await captureSubmission(fixture));

    const { rows: recovered } = await query<ReviewSubmission>(
      `SELECT *
       FROM public.reviewer_claim_app_review_submission(
         $1::uuid,
         $2::integer,
         $3::text,
         $4::text
       )`,
      [
        firstClaim.id,
        firstClaim.review_version,
        REVIEWER.subject,
        REVIEWER.email,
      ],
    );
    expect(recovered).toHaveLength(1);
    expect(recovered[0]).toMatchObject({
      status: "in_review",
      review_version: firstClaim.review_version + 1,
    });
    expect(recovered[0].claim_token).not.toBe(firstClaim.claim_token);

    const { rows: denied } = await query<ReviewSubmission>(
      `SELECT *
       FROM public.reviewer_claim_app_review_submission(
         $1::uuid,
         $2::integer,
         'different-reviewer'::text,
         'different@world.org'::text
       )`,
      [firstClaim.id, recovered[0].review_version],
    );
    expect(denied).toEqual([]);

    const { rows: events } = await query<{
      actor_subject: string;
      payload: Record<string, unknown>;
      review_version: number;
    }>(
      `SELECT actor_subject, payload, review_version
       FROM public.app_review_event
       WHERE submission_id = $1
         AND event_type = 'claimed'
       ORDER BY event_sequence`,
      [firstClaim.id],
    );
    expect(events).toHaveLength(2);
    expect(events[1]).toEqual(
      expect.objectContaining({
        actor_subject: REVIEWER.subject,
        review_version: recovered[0].review_version,
        payload: expect.objectContaining({ recovered_existing_claim: true }),
      }),
    );
  });

  test("snapshots World ID configuration while lifecycle status keeps reconciling", async () => {
    const fixture = await prepareDraft({ mode: "external" });
    const { rows: legacyActions } = await query<{ id: string }>(
      `SELECT id
       FROM public.action
       WHERE app_id = $1
       ORDER BY id
       LIMIT 1`,
      [fixture.appId],
    );
    expect(legacyActions).toHaveLength(1);
    const redirectId = "uri_reviewer_configuration_freeze";
    await query(
      `INSERT INTO public.redirect (id, action_id, redirect_uri)
       VALUES ($1, $2, 'https://review.example.com/callback')`,
      [redirectId, legacyActions[0].id],
    );

    const rpId = "rp_reviewer_configuration_freeze";
    const actionV4Id = "action_v4_reviewer_configuration_freeze";
    await query(
      `INSERT INTO public.rp_registration (
         rp_id,
         app_id,
         mode,
         signer_address,
         status
       )
       VALUES ($1, $2, 'managed', '0xreviewer', 'pending')`,
      [rpId, fixture.appId],
    );
    await query(
      `INSERT INTO public.action_v4 (id, rp_id, action, description)
       VALUES ($1, $2, 'review-action', 'Submitted configuration')`,
      [actionV4Id, rpId],
    );

    const submission = await captureSubmission(fixture);
    const { rows: submittedSnapshots } = await query<{
      world_id_configuration_snapshot: {
        config: {
          legacy_actions: Array<{
            id: string;
            redirects: Array<{ id: string; redirect_uri: string }>;
          }>;
          registrations: Array<{
            rp_id: string;
            actions: Array<{ id: string }>;
          }>;
        };
        lifecycle: {
          registrations: Array<{
            rp_id: string;
            status: string;
            staging_status: string | null;
          }>;
        };
      };
    }>(
      `SELECT world_id_configuration_snapshot
       FROM public.app_review_submission
       WHERE id = $1`,
      [submission.id],
    );
    expect(
      submittedSnapshots[0].world_id_configuration_snapshot.config
        .legacy_actions,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ...legacyActions[0],
          redirects: expect.arrayContaining([
            {
              id: redirectId,
              redirect_uri: "https://review.example.com/callback",
            },
          ]),
        }),
      ]),
    );
    expect(
      submittedSnapshots[0].world_id_configuration_snapshot.config
        .registrations,
    ).toEqual([
      expect.objectContaining({
        rp_id: rpId,
        actions: [expect.objectContaining({ id: actionV4Id })],
      }),
    ]);
    expect(
      submittedSnapshots[0].world_id_configuration_snapshot.lifecycle
        .registrations,
    ).toEqual([{ rp_id: rpId, status: "pending", staging_status: null }]);

    const { rows: reconciledRegistrations } = await query<{
      status: string;
      staging_status: string | null;
    }>(
      `UPDATE public.rp_registration
       SET status = 'registered', staging_status = 'failed'
       WHERE rp_id = $1
       RETURNING status, staging_status`,
      [rpId],
    );
    expect(reconciledRegistrations).toEqual([
      { status: "registered", staging_status: "failed" },
    ]);

    await expect(
      query(
        `UPDATE public.rp_registration
         SET status = 'pending',
             review_configuration_change_kind = 'signer_rotation'
         WHERE rp_id = $1`,
        [rpId],
      ),
    ).rejects.toMatchObject({ code: "55000" });

    await expect(
      query(
        `UPDATE public.rp_registration
         SET status = 'pending'
         WHERE rp_id = $1`,
        [rpId],
      ),
    ).rejects.toMatchObject({ code: "55000" });

    const { rows: unchangedSnapshots } = await query<{
      world_id_configuration_snapshot: unknown;
    }>(
      `SELECT world_id_configuration_snapshot
       FROM public.app_review_submission
       WHERE id = $1`,
      [submission.id],
    );
    expect(unchangedSnapshots[0].world_id_configuration_snapshot).toEqual(
      submittedSnapshots[0].world_id_configuration_snapshot,
    );

    const blockedWrites: Array<[string, unknown[]]> = [
      [
        `UPDATE public.action SET description = 'Drifted' WHERE id = $1`,
        [legacyActions[0].id],
      ],
      [`DELETE FROM public.action WHERE id = $1`, [legacyActions[0].id]],
      [
        `UPDATE public.redirect
         SET redirect_uri = 'https://attacker.example.com/callback'
         WHERE id = $1`,
        [redirectId],
      ],
      [`DELETE FROM public.redirect WHERE id = $1`, [redirectId]],
      [
        `INSERT INTO public.redirect (action_id, redirect_uri)
         VALUES ($1, 'https://late.example.com/callback')`,
        [legacyActions[0].id],
      ],
      [
        `INSERT INTO public.action (id, action, external_nullifier, app_id)
         VALUES (
           'action_reviewer_configuration_freeze',
           'late-legacy-action',
           '0xreviewerconfigurationfreeze',
           $1
         )`,
        [fixture.appId],
      ],
      [
        `UPDATE public.rp_registration SET signer_address = '0xdrifted' WHERE rp_id = $1`,
        [rpId],
      ],
      [`DELETE FROM public.rp_registration WHERE rp_id = $1`, [rpId]],
      [
        `UPDATE public.action_v4 SET description = 'Drifted' WHERE id = $1`,
        [actionV4Id],
      ],
      [`DELETE FROM public.action_v4 WHERE id = $1`, [actionV4Id]],
      [
        `INSERT INTO public.action_v4 (rp_id, action, description)
         VALUES ($1, 'late-action', 'Added after submission')`,
        [rpId],
      ],
    ];

    for (const [sql, values] of blockedWrites) {
      await expect(query(sql, values)).rejects.toMatchObject({ code: "55000" });
    }

    const { rows: withdrawn } = await query<{ id: string }>(
      `SELECT withdrawn.id
       FROM public.developer_withdraw_active_review_draft(
         $1::text,
         $2::timestamptz,
         $3::uuid,
         $4::integer,
         'developer-auth0-subject'::text,
         'developer@example.com'::text
       ) AS withdrawn`,
      [
        fixture.draft.id,
        submission.metadata_updated_at,
        submission.id,
        submission.review_version,
      ],
    );
    expect(withdrawn).toEqual([{ id: fixture.draft.id }]);

    const { rows: updated } = await query<{ description: string }>(
      `UPDATE public.action_v4
       SET description = 'Editable after withdrawal'
       WHERE id = $1
       RETURNING description`,
      [actionV4Id],
    );
    expect(updated).toEqual([{ description: "Editable after withdrawal" }]);

    const { rows: updatedRedirects } = await query<{ redirect_uri: string }>(
      `UPDATE public.redirect
       SET redirect_uri = 'https://editable.example.com/callback'
       WHERE id = $1
       RETURNING redirect_uri`,
      [redirectId],
    );
    expect(updatedRedirects).toEqual([
      { redirect_uri: "https://editable.example.com/callback" },
    ]);
  });

  test("waits for a mixed-version RP configuration claim before capture", async () => {
    const fixture = await prepareDraft({ mode: "external" });
    const rpId = "rp_reviewer_configuration_operation";
    await query(
      `INSERT INTO public.rp_registration (
         rp_id,
         app_id,
         mode,
         signer_address,
         status
       )
       VALUES ($1, $2, 'managed', '0xreviewer', 'registered')`,
      [rpId, fixture.appId],
    );

    const { rows: claimed } = await query<{
      review_configuration_change_kind: string;
      status: string;
    }>(
      `UPDATE public.rp_registration
       SET status = 'pending'
       WHERE rp_id = $1
       RETURNING status, review_configuration_change_kind`,
      [rpId],
    );
    expect(claimed).toEqual([
      {
        status: "pending",
        review_configuration_change_kind: "legacy_unknown",
      },
    ]);

    await expect(captureSubmission(fixture)).rejects.toMatchObject({
      code: "55000",
    });

    const { rows: settled } = await query<{
      review_configuration_change_kind: string | null;
      status: string;
    }>(
      `UPDATE public.rp_registration
       SET status = 'registered'
       WHERE rp_id = $1
       RETURNING status, review_configuration_change_kind`,
      [rpId],
    );
    expect(settled).toEqual([
      { status: "registered", review_configuration_change_kind: null },
    ]);

    await expect(captureSubmission(fixture)).resolves.toMatchObject({
      status: "pending",
    });
  });

  test("rejects approval if submitted World ID configuration drifted", async () => {
    const fixture = await prepareDraft({ mode: "external" });
    const { rows: legacyActions } = await query<{ id: string }>(
      `SELECT id
       FROM public.action
       WHERE app_id = $1
       ORDER BY id
       LIMIT 1`,
      [fixture.appId],
    );
    expect(legacyActions).toHaveLength(1);

    const captured = await captureSubmission(fixture);
    const reviewed = await saveChecklist(await claimSubmission(captured));

    await forceLegacyDatabaseState(
      `UPDATE public.action
       SET description = 'Legacy drift bypassing the active-review guard'
       WHERE id = $1`,
      [legacyActions[0].id],
    );

    await expect(
      decideSubmission({
        fixture,
        submission: reviewed,
        decision: "approved",
        fingerprint: "7".repeat(64),
      }),
    ).rejects.toMatchObject({ code: "55000" });

    const { rows: finalState } = await query<{
      status: string;
      verification_status: string;
    }>(
      `SELECT submission.status, metadata.verification_status
       FROM public.app_review_submission AS submission
       INNER JOIN public.app_metadata AS metadata
         ON metadata.id = submission.app_metadata_id
       WHERE submission.id = $1`,
      [captured.id],
    );
    expect(finalState).toEqual([
      { status: "in_review", verification_status: "awaiting_review" },
    ]);
  });

  test("serializes a concurrent OIDC redirect insert with submission capture", async () => {
    const fixture = await prepareDraft({ mode: "external" });
    const { rows: legacyActions } = await query<{ id: string }>(
      `SELECT id
       FROM public.action
       WHERE app_id = $1
       ORDER BY id
       LIMIT 1`,
      [fixture.appId],
    );
    expect(legacyActions).toHaveLength(1);

    const pool = new Pool({ max: 3 });
    const captureClient = await pool.connect();
    const redirectClient = await pool.connect();
    const observer = await pool.connect();
    let captureTransactionOpen = false;
    let redirectPromise: Promise<Error | QueryResult> | undefined;

    try {
      await captureClient.query("BEGIN");
      captureTransactionOpen = true;
      const assetSnapshot = {
        version: 1,
        prefix: `review-submissions/${fixture.appId}/${fixture.draft.id}/${"c".repeat(32)}/`,
        objects: {
          [`unverified/${fixture.appId}/logo_img.png`]: `review-submissions/${fixture.appId}/${fixture.draft.id}/${"c".repeat(32)}/logo_img.png`,
        },
      };
      const captured = await captureClient.query<ReviewSubmission>(
        `SELECT *
         FROM public.capture_listing_review_submission(
           $1::text,
           'Concurrent redirect review'::text,
           'developer-auth0-subject'::text,
           'developer@example.com'::text,
           true,
           $2::timestamptz,
           '[]'::jsonb,
           $3::jsonb
         )`,
        [
          fixture.draft.id,
          fixture.draft.updated_at,
          JSON.stringify(assetSnapshot),
        ],
      );
      expect(captured.rows).toHaveLength(1);

      await redirectClient.query(
        "SET application_name = 'reviewer_redirect_capture_race'",
      );
      redirectPromise = redirectClient
        .query(
          `INSERT INTO public.redirect (action_id, redirect_uri)
           VALUES ($1, 'https://late-redirect.example.com/callback')`,
          [legacyActions[0].id],
        )
        .then(
          (result) => result,
          (error: Error) => error,
        );

      let blocked = false;
      for (let attempt = 0; attempt < 100; attempt += 1) {
        const { rows } = await observer.query<{ waiting: boolean }>(
          `SELECT EXISTS (
             SELECT 1
             FROM pg_catalog.pg_stat_activity
             WHERE application_name = 'reviewer_redirect_capture_race'
               AND state = 'active'
               AND wait_event_type = 'Lock'
           ) AS waiting`,
        );
        blocked = rows[0].waiting;
        if (blocked) break;
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      expect(blocked).toBe(true);

      await captureClient.query("COMMIT");
      captureTransactionOpen = false;
      const redirectOutcome = await redirectPromise;
      expect(redirectOutcome).toMatchObject({ code: "55000" });

      const { rows: finalState } = await observer.query<{
        world_id_configuration_snapshot: unknown;
        late_redirect_count: string;
      }>(
        `SELECT
           submission.world_id_configuration_snapshot,
           (
             SELECT count(*)::text
             FROM public.redirect AS redirect
             WHERE redirect.redirect_uri =
               'https://late-redirect.example.com/callback'
           ) AS late_redirect_count
         FROM public.app_review_submission AS submission
         WHERE submission.id = $1`,
        [captured.rows[0].id],
      );
      expect(finalState[0].late_redirect_count).toBe("0");
      expect(
        JSON.stringify(finalState[0].world_id_configuration_snapshot),
      ).not.toContain("late-redirect.example.com");
    } finally {
      if (captureTransactionOpen) await captureClient.query("ROLLBACK");
      await Promise.allSettled(redirectPromise ? [redirectPromise] : []);
      captureClient.release();
      redirectClient.release();
      observer.release();
      await pool.end();
    }
  });

  test("serializes a concurrent localization insert with submission capture", async () => {
    const fixture = await prepareDraft();
    const pool = new Pool({ max: 3 });
    const captureClient = await pool.connect();
    const localizationClient = await pool.connect();
    const observer = await pool.connect();
    let captureTransactionOpen = false;
    let localizationPromise: Promise<Error | QueryResult> | undefined;

    try {
      await captureClient.query("BEGIN");
      captureTransactionOpen = true;
      const assetSnapshot = {
        version: 1,
        prefix: `review-submissions/${fixture.appId}/${fixture.draft.id}/${"b".repeat(32)}/`,
        objects: {
          [`unverified/${fixture.appId}/logo_img.png`]: `review-submissions/${fixture.appId}/${fixture.draft.id}/${"b".repeat(32)}/logo_img.png`,
        },
      };
      const captured = await captureClient.query<ReviewSubmission>(
        `SELECT *
         FROM public.capture_listing_review_submission(
           $1::text,
           'Concurrent localization review'::text,
           'developer-auth0-subject'::text,
           'developer@example.com'::text,
           true,
           $2::timestamptz,
           '[]'::jsonb,
           $3::jsonb
         )`,
        [
          fixture.draft.id,
          fixture.draft.updated_at,
          JSON.stringify(assetSnapshot),
        ],
      );
      expect(captured.rows).toHaveLength(1);

      await localizationClient.query(
        "SET application_name = 'reviewer_localization_capture_race'",
      );
      localizationPromise = localizationClient
        .query(
          `INSERT INTO public.localisations (
             app_metadata_id,
             locale,
             name,
             description,
             world_app_button_text,
             world_app_description,
             short_name
           )
           VALUES (
             $1,
             'es-race',
             'Aplicación tardía',
             'No pertenece a la instantánea',
             'Abrir',
             'Descripción tardía',
             'Tardía'
           )`,
          [fixture.draft.id],
        )
        .then(
          (result) => result,
          (error: Error) => error,
        );

      let blocked = false;
      for (let attempt = 0; attempt < 100; attempt += 1) {
        const { rows } = await observer.query<{ waiting: boolean }>(
          `SELECT EXISTS (
             SELECT 1
             FROM pg_catalog.pg_stat_activity
             WHERE application_name = 'reviewer_localization_capture_race'
               AND state = 'active'
               AND wait_event_type = 'Lock'
           ) AS waiting`,
        );
        blocked = rows[0].waiting;
        if (blocked) break;
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      expect(blocked).toBe(true);

      await captureClient.query("COMMIT");
      captureTransactionOpen = false;
      const localizationOutcome = await localizationPromise;
      expect(localizationOutcome).toMatchObject({ code: "55000" });

      const { rows: finalState } = await observer.query<{
        localizations_snapshot: unknown[];
        localization_count: string;
      }>(
        `SELECT
           submission.localizations_snapshot,
           (
             SELECT count(*)::text
             FROM public.localisations
             WHERE app_metadata_id = submission.app_metadata_id
           ) AS localization_count
         FROM public.app_review_submission AS submission
         WHERE submission.id = $1`,
        [captured.rows[0].id],
      );
      expect(finalState).toEqual([
        { localizations_snapshot: [], localization_count: "0" },
      ]);
    } finally {
      if (captureTransactionOpen) await captureClient.query("ROLLBACK");
      await Promise.allSettled(
        localizationPromise ? [localizationPromise] : [],
      );
      captureClient.release();
      localizationClient.release();
      observer.release();
      await pool.end();
    }
  });

  test("capture reconciliation waits for a delayed transaction commit", async () => {
    const fixture = await prepareDraft();
    const pool = new Pool({ max: 3 });
    const captureClient = await pool.connect();
    const reconciliationClient = await pool.connect();
    const observer = await pool.connect();
    let captureTransactionOpen = false;
    let reconciliationPromise:
      | Promise<QueryResult<ReviewSubmission>>
      | undefined;

    const assetSnapshot = {
      version: 1,
      prefix: `review-submissions/${fixture.appId}/${fixture.draft.id}/${"d".repeat(32)}/`,
      objects: {
        [`unverified/${fixture.appId}/logo_img.png`]: `review-submissions/${fixture.appId}/${fixture.draft.id}/${"d".repeat(32)}/logo_img.png`,
      },
    };

    try {
      await captureClient.query("BEGIN");
      captureTransactionOpen = true;
      const captured = await captureClient.query<ReviewSubmission>(
        `SELECT *
         FROM public.capture_listing_review_submission(
           $1::text,
           'Delayed capture response'::text,
           'developer-auth0-subject'::text,
           'developer@example.com'::text,
           true,
           $2::timestamptz,
           '[]'::jsonb,
           $3::jsonb
         )`,
        [
          fixture.draft.id,
          fixture.draft.updated_at,
          JSON.stringify(assetSnapshot),
        ],
      );
      expect(captured.rows).toHaveLength(1);

      await reconciliationClient.query(
        "SET application_name = 'reviewer_capture_reconciliation_race'",
      );
      reconciliationPromise = reconciliationClient.query<ReviewSubmission>(
        `SELECT *
         FROM public.reconcile_listing_review_submission_capture(
           $1::text,
           $2::jsonb
         )`,
        [fixture.draft.id, JSON.stringify(assetSnapshot)],
      );

      let blocked = false;
      for (let attempt = 0; attempt < 100; attempt += 1) {
        const { rows } = await observer.query<{ waiting: boolean }>(
          `SELECT EXISTS (
             SELECT 1
             FROM pg_catalog.pg_stat_activity
             WHERE application_name = 'reviewer_capture_reconciliation_race'
               AND state = 'active'
               AND wait_event_type = 'Lock'
           ) AS waiting`,
        );
        blocked = rows[0].waiting;
        if (blocked) break;
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      expect(blocked).toBe(true);

      await captureClient.query("COMMIT");
      captureTransactionOpen = false;
      const reconciled = await reconciliationPromise;
      expect(reconciled.rows).toEqual([
        expect.objectContaining({
          id: captured.rows[0].id,
          app_metadata_id: fixture.draft.id,
          status: "pending",
        }),
      ]);
    } finally {
      if (captureTransactionOpen) await captureClient.query("ROLLBACK");
      await Promise.allSettled(
        reconciliationPromise ? [reconciliationPromise] : [],
      );
      captureClient.release();
      reconciliationClient.release();
      observer.release();
      await pool.end();
    }
  });

  test("asset snapshot repair reconciliation waits for a delayed commit", async () => {
    const fixture = await prepareDraft();
    const captured = await captureSubmission(fixture);
    await forceLegacyDatabaseState(
      `UPDATE public.app_review_submission
       SET asset_snapshot = NULL
       WHERE id = $1`,
      [captured.id],
    );

    const assetSnapshot = {
      version: 1,
      prefix: `review-submissions/${fixture.appId}/${fixture.draft.id}/${"e".repeat(32)}/`,
      objects: {
        [`unverified/${fixture.appId}/logo_img.png`]: `review-submissions/${fixture.appId}/${fixture.draft.id}/${"e".repeat(32)}/logo_img.png`,
      },
    };
    const pool = new Pool({ max: 3 });
    const repairClient = await pool.connect();
    const reconciliationClient = await pool.connect();
    const observer = await pool.connect();
    let repairTransactionOpen = false;
    let reconciliationPromise:
      | Promise<QueryResult<ReviewSubmission>>
      | undefined;

    try {
      await repairClient.query("BEGIN");
      repairTransactionOpen = true;
      const repaired = await repairClient.query<ReviewSubmission>(
        `SELECT *
         FROM public.reviewer_set_app_review_asset_snapshot(
           $1::uuid,
           $2::integer,
           $3::jsonb
         )`,
        [captured.id, captured.review_version, JSON.stringify(assetSnapshot)],
      );
      expect(repaired.rows).toHaveLength(1);

      await reconciliationClient.query(
        "SET application_name = 'reviewer_asset_repair_reconciliation_race'",
      );
      reconciliationPromise = reconciliationClient.query<ReviewSubmission>(
        `SELECT *
         FROM public.reconcile_app_review_asset_snapshot_repair(
           $1::uuid,
           $2::jsonb
         )`,
        [captured.id, JSON.stringify(assetSnapshot)],
      );

      let blocked = false;
      for (let attempt = 0; attempt < 100; attempt += 1) {
        const { rows } = await observer.query<{ waiting: boolean }>(
          `SELECT EXISTS (
             SELECT 1
             FROM pg_catalog.pg_stat_activity
             WHERE application_name =
               'reviewer_asset_repair_reconciliation_race'
               AND state = 'active'
               AND wait_event_type = 'Lock'
           ) AS waiting`,
        );
        blocked = rows[0].waiting;
        if (blocked) break;
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      expect(blocked).toBe(true);

      await repairClient.query("COMMIT");
      repairTransactionOpen = false;
      const reconciled = await reconciliationPromise;
      expect(reconciled.rows).toEqual([
        expect.objectContaining({
          id: captured.id,
          asset_snapshot: assetSnapshot,
        }),
      ]);
    } finally {
      if (repairTransactionOpen) await repairClient.query("ROLLBACK");
      await Promise.allSettled(
        reconciliationPromise ? [reconciliationPromise] : [],
      );
      repairClient.release();
      reconciliationClient.release();
      observer.release();
      await pool.end();
    }
  });

  test("request changes leaves the prior verified version untouched", async () => {
    const fixture = await prepareDraft({ withPriorVerified: true });
    const captured = await captureSubmission(fixture);
    const reviewed = await saveChecklist(await claimSubmission(captured));
    const { rows: before } = await query<{
      id: string;
      logo_img_url: string;
      reviewed_by: string;
      updated_at: string;
    }>(
      `SELECT id, logo_img_url, reviewed_by, updated_at::text AS updated_at
       FROM public.app_metadata
       WHERE id = $1`,
      [fixture.priorVerified!.id],
    );

    const decision = await decideSubmission({
      fixture,
      submission: reviewed,
      decision: "changes_requested",
      fingerprint: "b".repeat(64),
    });

    expect(decision).toHaveLength(1);
    expect(decision[0].status).toBe("changes_requested");

    const { rows: after } = await query<{
      id: string;
      logo_img_url: string;
      reviewed_by: string;
      updated_at: string;
    }>(
      `SELECT id, logo_img_url, reviewed_by, updated_at::text AS updated_at
       FROM public.app_metadata
       WHERE id = $1`,
      [fixture.priorVerified!.id],
    );
    expect(after).toEqual(before);

    const { rows: draft } = await query<{
      verification_status: string;
      review_message: string;
      reviewed_by: string;
      updated_at: string;
    }>(
      `SELECT verification_status,
              review_message,
              reviewed_by,
              updated_at::text AS updated_at
       FROM public.app_metadata
       WHERE id = $1`,
      [fixture.draft.id],
    );
    expect(draft[0]).toEqual({
      verification_status: "changes_requested",
      review_message: "Please resolve the failed metadata check.",
      reviewed_by: REVIEWER.email,
      updated_at: expect.any(String),
    });

    const { rows: reopened } = await query<{
      verification_status: string;
    }>(
      `SELECT reopened.verification_status
       FROM public.reopen_changes_requested_review_draft(
         $1::text,
         $2::text,
         $3::timestamptz,
         $4::text,
         $5::text
       ) AS reopened`,
      [
        fixture.draft.id,
        "changes_requested",
        draft[0].updated_at,
        "mcp-api-key:key_123",
        null,
      ],
    );
    expect(reopened).toEqual([{ verification_status: "unverified" }]);

    const { rows: reopenedDraft } = await query<{
      verification_status: string;
    }>(
      `SELECT verification_status
       FROM public.app_metadata
       WHERE id = $1`,
      [fixture.draft.id],
    );
    expect(reopenedDraft[0].verification_status).toBe("unverified");

    const { rows: reopenEvents } = await query<{
      event_type: string;
      actor_subject: string | null;
    }>(
      `SELECT event_type, actor_subject
       FROM public.app_review_event
       WHERE submission_id = $1
         AND event_type = 'draft_reopened'`,
      [captured.id],
    );
    expect(reopenEvents).toEqual([
      {
        event_type: "draft_reopened",
        actor_subject: "mcp-api-key:key_123",
      },
    ]);
  });

  test("a stale reopen cannot withdraw a concurrently resubmitted draft", async () => {
    const fixture = await prepareDraft({ withPriorVerified: true });
    const captured = await captureSubmission(fixture);
    const reviewed = await saveChecklist(await claimSubmission(captured));
    await decideSubmission({
      fixture,
      submission: reviewed,
      decision: "changes_requested",
      fingerprint: "9".repeat(64),
    });

    const { rows: observed } = await query<
      MetadataVersion & {
        verification_status: string;
      }
    >(
      `SELECT id,
              verification_status,
              updated_at::text AS updated_at
       FROM public.app_metadata
       WHERE id = $1`,
      [fixture.draft.id],
    );
    expect(observed[0].verification_status).toBe("changes_requested");

    const { rows: freshlyReopened } = await query<MetadataVersion>(
      `SELECT reopened.id, reopened.updated_at::text AS updated_at
       FROM public.reopen_changes_requested_review_draft(
         $1::text,
         'changes_requested'::text,
         $2::timestamptz,
         'mcp-api-key:fresh'::text,
         NULL::text
       ) AS reopened`,
      [fixture.draft.id, observed[0].updated_at],
    );
    expect(freshlyReopened).toHaveLength(1);

    const resubmitted = await captureSubmission({
      ...fixture,
      draft: freshlyReopened[0],
    });
    expect(resubmitted).toMatchObject({ attempt: 2, status: "pending" });

    const { rows: staleReopen } = await query<MetadataVersion>(
      `SELECT reopened.id, reopened.updated_at::text AS updated_at
       FROM public.reopen_changes_requested_review_draft(
         $1::text,
         'changes_requested'::text,
         $2::timestamptz,
         'mcp-api-key:stale'::text,
         NULL::text
       ) AS reopened`,
      [fixture.draft.id, observed[0].updated_at],
    );
    expect(staleReopen).toHaveLength(0);

    const { rows: finalDraft } = await query<{
      verification_status: string;
      updated_at: string;
    }>(
      `SELECT verification_status, updated_at::text AS updated_at
       FROM public.app_metadata
       WHERE id = $1`,
      [fixture.draft.id],
    );
    expect(finalDraft).toEqual([
      {
        verification_status: "awaiting_review",
        updated_at: expect.any(String),
      },
    ]);

    const { rows: exactTimestampReopen } = await query<MetadataVersion>(
      `SELECT reopened.id, reopened.updated_at::text AS updated_at
       FROM public.reopen_changes_requested_review_draft(
         $1::text,
         'changes_requested'::text,
         $2::timestamptz,
         'mcp-api-key:stale-current-timestamp'::text,
         NULL::text
       ) AS reopened`,
      [fixture.draft.id, finalDraft[0].updated_at],
    );
    expect(exactTimestampReopen).toHaveLength(0);

    const { rows: attempts } = await query<{
      attempt: number;
      status: string;
    }>(
      `SELECT attempt, status
       FROM public.app_review_submission
       WHERE app_metadata_id = $1
       ORDER BY attempt`,
      [fixture.draft.id],
    );
    expect(attempts).toEqual([
      { attempt: 1, status: "changes_requested" },
      { attempt: 2, status: "pending" },
    ]);

    const { rows: staleEvents } = await query<{ event_type: string }>(
      `SELECT event_type
       FROM public.app_review_event
       WHERE actor_subject LIKE 'mcp-api-key:stale%'`,
    );
    expect(staleEvents).toHaveLength(0);
  });

  test("asset snapshot repair failures back off and dead-letter without stale increments", async () => {
    const fixture = await prepareDraft();
    const captured = await captureSubmission(fixture);
    await forceLegacyDatabaseState(
      `UPDATE public.app_review_submission
       SET asset_snapshot = NULL
       WHERE id = $1`,
      [captured.id],
    );

    let repairAttempt = 0;
    for (; repairAttempt < 8; repairAttempt += 1) {
      const { rows } = await query<{
        asset_snapshot_repair_attempt_count: number;
        asset_snapshot_repair_next_at: string | null;
        asset_snapshot_repair_dead_lettered_at: string | null;
      }>(
        `SELECT failed.asset_snapshot_repair_attempt_count,
                failed.asset_snapshot_repair_next_at::text AS asset_snapshot_repair_next_at,
                failed.asset_snapshot_repair_dead_lettered_at::text AS asset_snapshot_repair_dead_lettered_at
         FROM public.reviewer_fail_app_review_asset_snapshot_repair(
           $1::uuid,
           $2::integer,
           $3::integer,
           'source object missing'::text
         ) AS failed`,
        [captured.id, captured.review_version, repairAttempt],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0].asset_snapshot_repair_attempt_count).toBe(
        repairAttempt + 1,
      );
      if (repairAttempt < 7) {
        expect(rows[0].asset_snapshot_repair_next_at).not.toBeNull();
        expect(rows[0].asset_snapshot_repair_dead_lettered_at).toBeNull();
      } else {
        expect(rows[0].asset_snapshot_repair_next_at).toBeNull();
        expect(rows[0].asset_snapshot_repair_dead_lettered_at).not.toBeNull();
      }
    }

    const { rows: staleFailure } = await query(
      `SELECT *
       FROM public.reviewer_fail_app_review_asset_snapshot_repair(
         $1::uuid,
         $2::integer,
         0,
         'stale worker'::text
       )`,
      [captured.id, captured.review_version],
    );
    expect(staleFailure).toHaveLength(0);
  });

  test.each([
    ["mini-app", true],
    ["external", false],
  ] as const)(
    "promotes the exact %s draft with server-derived publication flags",
    async (mode, expectedAppStoreApproval) => {
      const fixture = await prepareDraft({ mode, withPriorVerified: true });
      const captured = await captureSubmission(fixture);
      const reviewed = await saveChecklist(await claimSubmission(captured));
      const fingerprint = mode === "mini-app" ? "c".repeat(64) : "d".repeat(64);
      const readDecisionFootprint = async () => {
        const { rows } = await query<{
          status: string;
          review_version: number;
          event_count: string;
          notification_count: string;
          metadata_states: Array<{ id: string; verification_status: string }>;
        }>(
          `SELECT
             submission.status,
             submission.review_version,
             (
               SELECT count(*)::text
               FROM public.app_review_event AS event
               WHERE event.submission_id = submission.id
             ) AS event_count,
             (
               SELECT count(*)::text
               FROM public.app_review_notification AS notification
               WHERE notification.submission_id = submission.id
             ) AS notification_count,
             (
               SELECT jsonb_agg(
                 jsonb_build_object(
                   'id', metadata.id,
                   'verification_status', metadata.verification_status
                 )
                 ORDER BY metadata.id
               )
               FROM public.app_metadata AS metadata
               WHERE metadata.app_id = submission.app_id
             ) AS metadata_states
           FROM public.app_review_submission AS submission
           WHERE submission.id = $1`,
          [reviewed.id],
        );
        return rows[0];
      };
      const beforeStaleDecisions = await readDecisionFootprint();

      const staleDecision = await decideSubmission({
        fixture,
        submission: reviewed,
        decision: "approved",
        fingerprint,
        expectedMetadataUpdatedAt: new Date(0),
      });
      expect(staleDecision).toHaveLength(0);

      const staleVersionDecision = await decideSubmission({
        fixture,
        submission: reviewed,
        decision: "approved",
        fingerprint,
        expectedReviewVersion: reviewed.review_version - 1,
      });
      expect(staleVersionDecision).toHaveLength(0);
      expect(await readDecisionFootprint()).toEqual(beforeStaleDecisions);

      const decision = await decideSubmission({
        fixture,
        submission: reviewed,
        decision: "approved",
        fingerprint,
      });
      expect(decision).toHaveLength(1);
      expect(decision[0].status).toBe("approved");

      const { rows: metadata } = await query<{
        id: string;
        verification_status: string;
        is_reviewer_world_app_approved: boolean;
        is_reviewer_app_store_approved: boolean;
      }>(
        `SELECT
           id,
           verification_status,
           is_reviewer_world_app_approved,
           is_reviewer_app_store_approved
         FROM public.app_metadata
         WHERE app_id = $1`,
        [fixture.appId],
      );
      expect(metadata).toEqual([
        {
          id: fixture.draft.id,
          verification_status: "verified",
          is_reviewer_world_app_approved: true,
          is_reviewer_app_store_approved: expectedAppStoreApproval,
        },
      ]);
    },
  );

  test("withdrawal closes one attempt and resubmission creates the next", async () => {
    const fixture = await prepareDraft();
    const first = await captureSubmission(fixture);
    const { rows: withdrawnMetadata } = await query<MetadataVersion>(
      `SELECT id, updated_at::text AS updated_at
       FROM public.developer_withdraw_active_review_draft(
         $1::text,
         $2::timestamptz,
         $3::uuid,
         $4::integer,
         $5::text,
         $6::text
       )`,
      [
        fixture.draft.id,
        first.metadata_updated_at,
        first.id,
        first.review_version,
        "developer-auth0-subject",
        "developer@example.com",
      ],
    );
    expect(withdrawnMetadata).toHaveLength(1);

    const { rows: withdrawn } = await query<ReviewSubmission>(
      `SELECT * FROM public.app_review_submission WHERE id = $1`,
      [first.id],
    );
    expect(withdrawn).toHaveLength(1);
    expect(withdrawn[0]).toMatchObject({ status: "withdrawn", attempt: 1 });

    const { rows: currentDraft } = await query<MetadataVersion>(
      `SELECT id, updated_at::text AS updated_at
       FROM public.app_metadata
       WHERE id = $1
         AND verification_status = 'unverified'`,
      [fixture.draft.id],
    );
    const second = await captureSubmission({
      ...fixture,
      draft: currentDraft[0],
    });

    expect(second).toMatchObject({ status: "pending", attempt: 2 });
    const { rows: attempts } = await query<{
      attempt: number;
      status: string;
    }>(
      `SELECT attempt, status
       FROM public.app_review_submission
       WHERE app_metadata_id = $1
       ORDER BY attempt`,
      [fixture.draft.id],
    );
    expect(attempts).toEqual([
      { attempt: 1, status: "withdrawn" },
      { attempt: 2, status: "pending" },
    ]);

    const { rows: events } = await query<{
      submission_id: string;
      event_type: string;
    }>(
      `SELECT submission_id, event_type
       FROM public.app_review_event
       WHERE submission_id IN ($1, $2)
       ORDER BY event_sequence`,
      [first.id, second.id],
    );
    expect(events).toEqual([
      { submission_id: first.id, event_type: "submitted" },
      { submission_id: first.id, event_type: "withdrawn" },
      {
        submission_id: first.id,
        event_type: "notification_dead_lettered",
      },
      { submission_id: second.id, event_type: "submitted" },
    ]);

    const { rows: notifications } = await query<{
      submission_id: string;
      dedupe_key: string;
      status: string;
      manual_retry_blocked: boolean;
    }>(
      `SELECT submission_id, dedupe_key, status, manual_retry_blocked
       FROM public.app_review_notification
       WHERE notification_type = 'submission_received'
       ORDER BY created_at, id`,
    );
    expect(notifications).toHaveLength(2);
    expect(
      new Set(notifications.map(({ dedupe_key }) => dedupe_key)).size,
    ).toBe(2);
    expect(notifications).toEqual([
      expect.objectContaining({
        submission_id: first.id,
        status: "dead_letter",
        manual_retry_blocked: true,
      }),
      expect.objectContaining({
        submission_id: second.id,
        status: "pending",
        manual_retry_blocked: false,
      }),
    ]);
    expect(first.id).not.toBe(second.id);
  });

  test("atomically reopens a changes-requested draft only with its MCP edit", async () => {
    const fixture = await prepareDraft();
    const reviewed = await saveChecklist(
      await claimSubmission(await captureSubmission(fixture)),
    );
    const [changesRequested] = await decideSubmission({
      fixture,
      submission: reviewed,
      decision: "changes_requested",
      fingerprint: "5".repeat(64),
    });
    expect(changesRequested).toMatchObject({ status: "changes_requested" });

    const { rows: current } = await query<{
      updated_at: string;
      verification_status: string;
    }>(
      `SELECT updated_at::text AS updated_at, verification_status
       FROM public.app_metadata
       WHERE id = $1`,
      [fixture.draft.id],
    );
    expect(current[0].verification_status).toBe("changes_requested");

    const { rows: updated } = await query<{
      short_name: string;
      verification_status: string;
    }>(
      `SELECT patched.short_name, patched.verification_status
       FROM public.mcp_patch_editable_app_metadata(
         $1::text,
         'changes_requested'::text,
         $2::timestamptz,
         '{"short_name":"Fixed"}'::jsonb,
         'mcp-api-key:test'::text,
         NULL::text
       ) AS patched`,
      [fixture.draft.id, current[0].updated_at],
    );
    expect(updated).toEqual([
      { short_name: "Fixed", verification_status: "unverified" },
    ]);

    const { rows: reopenedEvents } = await query<{
      actor_subject: string;
      payload: Record<string, unknown>;
    }>(
      `SELECT actor_subject, payload
       FROM public.app_review_event
       WHERE submission_id = $1
         AND event_type = 'draft_reopened'`,
      [reviewed.id],
    );
    expect(reopenedEvents).toEqual([
      {
        actor_subject: "mcp-api-key:test",
        payload: expect.objectContaining({
          edit_committed: true,
          edited_fields: ["short_name"],
        }),
      },
    ]);
  });

  test("does not reopen a changes-requested draft when the MCP edit CAS is stale", async () => {
    const fixture = await prepareDraft();
    const reviewed = await saveChecklist(
      await claimSubmission(await captureSubmission(fixture)),
    );
    await decideSubmission({
      fixture,
      submission: reviewed,
      decision: "changes_requested",
      fingerprint: "4".repeat(64),
    });

    const { rows } = await query(
      `SELECT *
       FROM public.mcp_patch_editable_app_metadata(
         $1::text,
         'changes_requested'::text,
         '2020-01-01T00:00:00.000Z'::timestamptz,
         '{"short_name":"Stale"}'::jsonb,
         'mcp-api-key:test'::text,
         NULL::text
       )`,
      [fixture.draft.id],
    );
    expect(rows).toEqual([]);

    const { rows: state } = await query<{
      event_count: string;
      short_name: string;
      verification_status: string;
    }>(
      `SELECT metadata.short_name,
              metadata.verification_status,
              (
                SELECT count(*)::text
                FROM public.app_review_event
                WHERE submission_id = $2
                  AND event_type = 'draft_reopened'
              ) AS event_count
       FROM public.app_metadata AS metadata
       WHERE metadata.id = $1`,
      [fixture.draft.id, reviewed.id],
    );
    expect(state).toEqual([
      {
        event_count: "0",
        short_name: expect.not.stringMatching(/^Stale$/),
        verification_status: "changes_requested",
      },
    ]);
  });

  test("notification claims enforce leases, backoff, delivery idempotency, and bounded manual retries", async () => {
    const fixture = await prepareDraft();
    const submission = await captureSubmission(fixture);
    const { rows: initialOutbox } = await query<{
      id: string;
      status: string;
      attempt_count: number;
    }>(
      `SELECT id, status, attempt_count
       FROM public.app_review_notification
       WHERE submission_id = $1
         AND notification_type = 'submission_received'`,
      [submission.id],
    );
    expect(initialOutbox).toEqual([
      expect.objectContaining({ status: "pending", attempt_count: 0 }),
    ]);
    const notificationId = initialOutbox[0].id;

    const claimNotifications = async (workerId: string, limit = 1) =>
      (
        await query<{
          id: string;
          status: string;
          attempt_count: number;
          locked_by: string;
        }>(
          `SELECT *
           FROM public.reviewer_claim_app_review_notifications(
             $1::text,
             $2::integer
           )`,
          [workerId, limit],
        )
      ).rows;
    const completeNotification = async ({
      id,
      workerId,
      outcome,
      providerMessageId = null,
      error = null,
    }: {
      id: string;
      workerId: string;
      outcome: "delivered" | "failed" | "deferred";
      providerMessageId?: string | null;
      error?: string | null;
    }) =>
      (
        await query<{
          id: string;
          status: string;
          attempt_count: number;
          next_attempt_at: Date;
          provider_message_id: string | null;
          last_error: string | null;
        }>(
          `SELECT *
           FROM public.reviewer_complete_app_review_notification(
             $1::uuid,
             $2::text,
             $3::text,
             $4::text,
             $5::text
           )`,
          [id, workerId, outcome, providerMessageId, error],
        )
      ).rows;
    let retryOperationSequence = 0;
    const retryNotification = async (
      id: string,
      operationId = `00000000-0000-4000-8000-${String(
        ++retryOperationSequence,
      ).padStart(12, "0")}`,
    ) =>
      (
        await query<{
          id: string;
          status: string;
          attempt_count: number;
          last_error: string | null;
        }>(
          `SELECT *
           FROM public.reviewer_retry_app_review_notification(
             $1::uuid,
             $2::uuid,
             $3::text,
             $4::text
           )`,
          [id, operationId, REVIEWER.subject, REVIEWER.email],
        )
      ).rows;

    const firstClaim = await claimNotifications("worker-one");
    expect(firstClaim).toEqual([
      expect.objectContaining({
        id: notificationId,
        status: "processing",
        attempt_count: 1,
        locked_by: "worker-one",
      }),
    ]);

    expect(
      await completeNotification({
        id: notificationId,
        workerId: "wrong-worker",
        outcome: "failed",
        error: "must not win",
      }),
    ).toHaveLength(0);

    const failedAt = Date.now();
    const failed = await completeNotification({
      id: notificationId,
      workerId: "worker-one",
      outcome: "failed",
      error: "provider unavailable",
    });
    expect(failed).toHaveLength(1);
    expect(failed[0]).toMatchObject({
      status: "failed",
      attempt_count: 1,
      last_error: "provider unavailable",
    });
    expect(
      failed[0].next_attempt_at.getTime() - failedAt,
    ).toBeGreaterThanOrEqual(25_000);
    expect(failed[0].next_attempt_at.getTime() - failedAt).toBeLessThanOrEqual(
      35_000,
    );
    expect(await claimNotifications("worker-too-early")).toHaveLength(0);

    const manualRetryOperation = "00000000-0000-4000-8000-000000000101";
    const manualRetry = await retryNotification(
      notificationId,
      manualRetryOperation,
    );
    expect(manualRetry).toEqual([
      expect.objectContaining({
        status: "pending",
        attempt_count: 1,
        last_error: null,
      }),
    ]);
    await expect(
      retryNotification(notificationId, manualRetryOperation),
    ).resolves.toEqual(manualRetry);
    const { rows: retryEvents } = await query<{ count: string }>(
      `SELECT count(*)::text AS count
       FROM public.app_review_event
       WHERE submission_id = $1
         AND event_type = 'notification_retry_requested'
         AND payload ->> 'operation_id' = $2`,
      [submission.id, manualRetryOperation],
    );
    expect(retryEvents).toEqual([{ count: "1" }]);
    const secondClaim = await claimNotifications("worker-two");
    expect(secondClaim).toEqual([
      expect.objectContaining({
        id: notificationId,
        status: "processing",
        attempt_count: 2,
        locked_by: "worker-two",
      }),
    ]);

    await query(
      `UPDATE public.app_review_notification
       SET locked_at = now() - interval '6 minutes'
       WHERE id = $1`,
      [notificationId],
    );
    expect(
      await completeNotification({
        id: notificationId,
        workerId: "worker-two",
        outcome: "delivered",
        providerMessageId: "stale-worker-message",
      }),
    ).toHaveLength(0);

    const reclaimedClaim = await claimNotifications("worker-three");
    expect(reclaimedClaim).toEqual([
      expect.objectContaining({
        id: notificationId,
        status: "processing",
        attempt_count: 3,
        locked_by: "worker-three",
      }),
    ]);
    const thirdFailureAt = Date.now();
    const thirdFailure = await completeNotification({
      id: notificationId,
      workerId: "worker-three",
      outcome: "failed",
      error: "provider still unavailable",
    });
    expect(thirdFailure).toEqual([
      expect.objectContaining({
        status: "failed",
        attempt_count: 3,
        last_error: "provider still unavailable",
      }),
    ]);
    expect(
      thirdFailure[0].next_attempt_at.getTime() - thirdFailureAt,
    ).toBeGreaterThanOrEqual(115_000);
    expect(
      thirdFailure[0].next_attempt_at.getTime() - thirdFailureAt,
    ).toBeLessThanOrEqual(125_000);
    expect(await claimNotifications("worker-three-too-early")).toHaveLength(0);

    const retryAfterReclaim = await retryNotification(notificationId);
    expect(retryAfterReclaim).toEqual([
      expect.objectContaining({
        status: "pending",
        attempt_count: 3,
        last_error: null,
      }),
    ]);
    const fourthClaim = await claimNotifications("worker-four");
    expect(fourthClaim).toEqual([
      expect.objectContaining({
        id: notificationId,
        status: "processing",
        attempt_count: 4,
        locked_by: "worker-four",
      }),
    ]);
    const delivered = await completeNotification({
      id: notificationId,
      workerId: "worker-four",
      outcome: "delivered",
      providerMessageId: "provider-message-1",
    });
    expect(delivered).toEqual([
      expect.objectContaining({
        status: "delivered",
        provider_message_id: "provider-message-1",
      }),
    ]);
    const { rows: deliveredEventsBeforeRetry } = await query<{ count: string }>(
      `SELECT count(*)::text AS count
       FROM public.app_review_event
       WHERE submission_id = $1
         AND event_type = 'notification_delivered'
         AND payload ->> 'notification_id' = $2`,
      [submission.id, notificationId],
    );
    expect(
      await completeNotification({
        id: notificationId,
        workerId: "worker-four",
        outcome: "delivered",
        providerMessageId: "provider-message-1",
      }),
    ).toHaveLength(1);
    const { rows: deliveredEventsAfterRetry } = await query<{ count: string }>(
      `SELECT count(*)::text AS count
       FROM public.app_review_event
       WHERE submission_id = $1
         AND event_type = 'notification_delivered'
         AND payload ->> 'notification_id' = $2`,
      [submission.id, notificationId],
    );
    expect(deliveredEventsAfterRetry).toEqual(deliveredEventsBeforeRetry);
    const { rows: attemptedEvents } = await query<{ attempt_count: string }>(
      `SELECT payload ->> 'attempt_count' AS attempt_count
       FROM public.app_review_event
       WHERE submission_id = $1
         AND event_type = 'notification_attempted'
         AND payload ->> 'notification_id' = $2
       ORDER BY event_sequence`,
      [submission.id, notificationId],
    );
    expect(attemptedEvents.map(({ attempt_count }) => attempt_count)).toEqual([
      "1",
      "2",
      "3",
      "4",
    ]);

    const { rows: terminalCandidates } = await query<{ id: string }>(
      `INSERT INTO public.app_review_notification (
         submission_id,
         notification_type,
         channel,
         dedupe_key,
         recipient,
         payload,
         attempt_count
       )
       VALUES (
         $1,
         'decision_approved',
         'email',
         $2,
         'owner@example.com',
         '{}'::jsonb,
         7
       )
       RETURNING id`,
      [submission.id, `review-test:${submission.id}:terminal`],
    );
    const terminalNotificationId = terminalCandidates[0].id;
    const eighthClaim = await claimNotifications("worker-eight");
    expect(eighthClaim).toEqual([
      expect.objectContaining({
        id: terminalNotificationId,
        status: "processing",
        attempt_count: 8,
      }),
    ]);
    const deadLetter = await completeNotification({
      id: terminalNotificationId,
      workerId: "worker-eight",
      outcome: "failed",
      error: "eighth attempt failed",
    });
    expect(deadLetter).toEqual([
      expect.objectContaining({
        status: "dead_letter",
        attempt_count: 8,
        last_error: "eighth attempt failed",
      }),
    ]);

    const newCycle = await retryNotification(terminalNotificationId);
    expect(newCycle).toEqual([
      expect.objectContaining({
        status: "pending",
        attempt_count: 0,
        last_error: null,
      }),
    ]);
    const restartedClaim = await claimNotifications("worker-restarted");
    expect(restartedClaim).toEqual([
      expect.objectContaining({
        id: terminalNotificationId,
        status: "processing",
        attempt_count: 1,
      }),
    ]);

    const { rows: terminalEvents } = await query<{
      event_type: string;
      actor_subject: string | null;
      payload: Record<string, unknown>;
    }>(
      `SELECT event_type, actor_subject, payload
       FROM public.app_review_event
       WHERE submission_id = $1
         AND payload ->> 'notification_id' = $2
       ORDER BY event_sequence`,
      [submission.id, terminalNotificationId],
    );
    expect(terminalEvents.map(({ event_type }) => event_type)).toEqual([
      "notification_attempted",
      "notification_dead_lettered",
      "notification_retry_requested",
      "notification_attempted",
    ]);
    expect(terminalEvents[2]).toMatchObject({
      actor_subject: REVIEWER.subject,
      payload: expect.objectContaining({
        previous_status: "dead_letter",
        previous_error: "eighth attempt failed",
      }),
    });
  });

  test("decision retries return the durable result without duplicating audit or outbox rows", async () => {
    const fixture = await prepareDraft({ withPriorVerified: true });
    const captured = await captureSubmission(fixture);
    const reviewed = await saveChecklist(await claimSubmission(captured));
    const input: DecisionInput = {
      fixture,
      submission: reviewed,
      decision: "approved",
      fingerprint: "e".repeat(64),
    };

    const first = await decideSubmission(input);
    expect(first).toHaveLength(1);
    const readEvents = async () =>
      (
        await query<{
          id: string;
          event_type: string;
          event_sequence: string;
          actor_subject: string;
          actor_email: string;
        }>(
          `SELECT
             id,
             event_type,
             event_sequence::text,
             actor_subject,
             actor_email
           FROM public.app_review_event
           WHERE submission_id = $1
           ORDER BY event_sequence`,
          [captured.id],
        )
      ).rows;
    const readOutbox = async () =>
      (
        await query<{
          id: string;
          notification_type: string;
          channel: string;
          dedupe_key: string;
          status: string;
        }>(
          `SELECT id, notification_type, channel, dedupe_key, status
           FROM public.app_review_notification
           WHERE submission_id = $1
           ORDER BY created_at, id`,
          [captured.id],
        )
      ).rows;
    const eventsAfterFirstDecision = await readEvents();
    const outboxAfterFirstDecision = await readOutbox();

    const retry = await decideSubmission(input);
    expect(retry).toHaveLength(1);
    expect(retry[0].id).toBe(first[0].id);
    const events = await readEvents();
    const outbox = await readOutbox();
    expect(events).toEqual(eventsAfterFirstDecision);
    expect(outbox).toEqual(outboxAfterFirstDecision);

    expect(
      events.map(({ event_type, actor_subject, actor_email }) => ({
        event_type,
        actor_subject,
        actor_email,
      })),
    ).toEqual([
      {
        event_type: "submitted",
        actor_subject: "developer-auth0-subject",
        actor_email: "developer@example.com",
      },
      {
        event_type: "claimed",
        actor_subject: REVIEWER.subject,
        actor_email: REVIEWER.email,
      },
      {
        event_type: "checklist_updated",
        actor_subject: REVIEWER.subject,
        actor_email: REVIEWER.email,
      },
      {
        event_type: "approved",
        actor_subject: REVIEWER.subject,
        actor_email: REVIEWER.email,
      },
    ]);
    expect(
      new Set(events.map(({ event_sequence }) => event_sequence)).size,
    ).toBe(events.length);
    expect(
      outbox
        .map(
          ({ notification_type, channel }) => `${notification_type}:${channel}`,
        )
        .sort(),
    ).toEqual([
      "asset_cleanup:asset",
      "decision_approved:email",
      "decision_approved:email",
      "publication_check:publication",
      "submission_received:slack",
    ]);
    expect(new Set(outbox.map(({ dedupe_key }) => dedupe_key)).size).toBe(
      outbox.length,
    );
    expect(outbox.every(({ status }) => status === "pending")).toBe(true);
  });
});
