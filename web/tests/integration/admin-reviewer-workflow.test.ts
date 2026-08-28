import { Pool, QueryResult } from "pg";

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
       verification_status
     )
     VALUES (
       $1,
       'Submitted review draft',
       'Submitted review description',
       $2,
       'https://review.example.com/app',
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
  const { rows } = await query<ReviewSubmission>(
    `SELECT captured.*, captured.metadata_updated_at::text AS metadata_updated_at
     FROM public.capture_listing_review_submission(
       $1::text,
       $2::text,
       $3::text,
       $4::text,
       true,
       $5::timestamptz,
       $6::jsonb
     ) AS captured`,
    [
      fixture.draft.id,
      "Ready for listing review",
      "developer-auth0-subject",
      "developer@example.com",
      fixture.draft.updated_at,
      JSON.stringify([]),
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

const decideSubmission = async ({
  fixture,
  submission,
  decision,
  fingerprint,
  expectedMetadataUpdatedAt = submission.metadata_updated_at,
  expectedReviewVersion = submission.review_version,
}: DecisionInput): Promise<ReviewSubmission[]> => {
  const operationId = fingerprint.slice(0, 16);
  const logoFilename = `review_${fixture.draft.id}_${operationId}_logo.png`;
  const developerMessage =
    decision === "approved"
      ? "Approved for publication"
      : "Please resolve the failed metadata check.";
  const { rows } = await query<ReviewSubmission>(
    `SELECT decided.*, decided.metadata_updated_at::text AS metadata_updated_at
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
    [
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
  );

  return rows;
};

describe("reviewer workflow database invariants", () => {
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

  test("serializes simultaneous claims and rejects stale lease versions", async () => {
    const fixture = await prepareDraft();
    const submission = await captureSubmission(fixture);
    const pool = new Pool({ max: 3 });
    const blocker = await pool.connect();
    const firstClaimant = await pool.connect();
    const secondClaimant = await pool.connect();
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
        const { rows } = await blocker.query<{ count: string }>(
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
    }>(
      `SELECT verification_status, review_message, reviewed_by
       FROM public.app_metadata
       WHERE id = $1`,
      [fixture.draft.id],
    );
    expect(draft[0]).toEqual({
      verification_status: "changes_requested",
      review_message: "Please resolve the failed metadata check.",
      reviewed_by: REVIEWER.email,
    });
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
    const { rows: withdrawn } = await query<ReviewSubmission>(
      `SELECT *
       FROM public.withdraw_listing_review_submission(
         $1::text,
         $2::text,
         $3::text
       )`,
      [fixture.draft.id, "developer-auth0-subject", "developer@example.com"],
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
      { submission_id: second.id, event_type: "submitted" },
    ]);

    const { rows: notifications } = await query<{ dedupe_key: string }>(
      `SELECT dedupe_key
       FROM public.app_review_notification
       WHERE notification_type = 'submission_received'
       ORDER BY created_at, id`,
    );
    expect(notifications).toHaveLength(2);
    expect(
      new Set(notifications.map(({ dedupe_key }) => dedupe_key)).size,
    ).toBe(2);
    expect(first.id).not.toBe(second.id);
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
    const retryNotification = async (id: string) =>
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
             $2::text,
             $3::text
           )`,
          [id, REVIEWER.subject, REVIEWER.email],
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

    const manualRetry = await retryNotification(notificationId);
    expect(manualRetry).toEqual([
      expect.objectContaining({
        status: "pending",
        attempt_count: 1,
        last_error: null,
      }),
    ]);
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
