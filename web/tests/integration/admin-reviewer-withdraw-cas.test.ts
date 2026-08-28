import { integrationDBClean, integrationDBExecuteQuery } from "./setup";

type Row = Record<string, any>;

beforeEach(integrationDBClean);

const query = async <T extends Row>(sql: string, values: unknown[] = []) =>
  (await integrationDBExecuteQuery(sql, values)) as { rows: T[] };

describe("developer review withdrawal compare-and-swap", () => {
  it("does not let a stale page withdraw a newer resubmission", async () => {
    const { rows: apps } = await query<{ id: string }>(
      `SELECT id FROM public.app WHERE name = 'Sign In App' LIMIT 1`,
    );
    const appId = apps[0].id;
    const { rows: drafts } = await query<{ id: string; updated_at: string }>(
      `UPDATE public.app_metadata
       SET app_mode = 'mini-app',
           integration_url = 'https://review.example.com/app',
           logo_img_url = 'logo_img.png',
           verification_status = 'unverified',
           is_developer_allow_listing = false
       WHERE app_id = $1
       RETURNING id, updated_at::text AS updated_at`,
      [appId],
    );
    const draft = drafts[0];
    const assetSnapshot = (nonce: string) => ({
      version: 1,
      prefix: `review-submissions/${appId}/${draft.id}/${nonce}/`,
      objects: {
        [`unverified/${appId}/logo_img.png`]: `review-submissions/${appId}/${draft.id}/${nonce}/logo_img.png`,
      },
    });
    const capture = async (updatedAt: string, nonce: string) =>
      (
        await query<{
          id: string;
          review_version: number;
          metadata_updated_at: string;
        }>(
          `SELECT captured.id,
                  captured.review_version,
                  captured.metadata_updated_at::text AS metadata_updated_at
           FROM public.capture_listing_review_submission(
             $1::text,
             'Ready for review'::text,
             'developer-auth0-subject'::text,
             'developer@example.com'::text,
             true,
             $2::timestamptz,
             '[]'::jsonb,
             $3::jsonb
           ) AS captured`,
          [draft.id, updatedAt, JSON.stringify(assetSnapshot(nonce))],
        )
      ).rows[0];

    const first = await capture(draft.updated_at, "a".repeat(32));
    const { rows: withdrawn } = await query<{ updated_at: string }>(
      `SELECT transitioned.updated_at::text AS updated_at
       FROM public.developer_withdraw_active_review_draft(
         $1::text,
         $2::timestamptz,
         $3::uuid,
         $4::integer,
         'developer-auth0-subject'::text,
         'developer@example.com'::text
       ) AS transitioned`,
      [draft.id, first.metadata_updated_at, first.id, first.review_version],
    );
    expect(withdrawn).toHaveLength(1);

    const second = await capture(withdrawn[0].updated_at, "b".repeat(32));
    const { rows: stale } = await query<{ id: string }>(
      `SELECT transitioned.id
       FROM public.developer_withdraw_active_review_draft(
         $1::text,
         $2::timestamptz,
         $3::uuid,
         $4::integer,
         'developer-auth0-subject'::text,
         'developer@example.com'::text
       ) AS transitioned`,
      [draft.id, first.metadata_updated_at, first.id, first.review_version],
    );
    expect(stale).toHaveLength(0);

    const { rows: finalRows } = await query<{
      verification_status: string;
      attempt: number;
      status: string;
    }>(
      `SELECT metadata.verification_status,
              submission.attempt,
              submission.status
       FROM public.app_metadata AS metadata
       INNER JOIN public.app_review_submission AS submission
         ON submission.app_metadata_id = metadata.id
       WHERE metadata.id = $1
         AND submission.id = $2`,
      [draft.id, second.id],
    );
    expect(finalRows).toEqual([
      {
        verification_status: "awaiting_review",
        attempt: 2,
        status: "pending",
      },
    ]);
  });
});
