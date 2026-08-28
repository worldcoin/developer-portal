import { existsSync, readFileSync } from "fs";
import path from "path";

const migrationDirectory = path.join(
  __dirname,
  "../../../hasura/migrations/default/1788717600000_bridge_uncaptured_listing_reviews",
);
const urlFenceMigration = path.join(
  __dirname,
  "../../../hasura/migrations/default/1788372000000_reject_reviewer_integration_url_credentials/up.sql",
);

const readOptional = (filename: string) =>
  existsSync(filename) ? readFileSync(filename, "utf8") : "";

describe("uncaptured listing review rollout bridge", () => {
  const up = readOptional(path.join(migrationDirectory, "up.sql"));
  const down = readOptional(path.join(migrationDirectory, "down.sql"));
  const urlFence = readOptional(urlFenceMigration);

  it("reconciles eligible production listing rows with immutable history and Slack outbox", () => {
    expect(up).toContain("reconcile_uncaptured_listing_review_submission");
    expect(up).toContain("metadata.verification_status = 'awaiting_review'");
    expect(up).toContain("metadata.is_developer_allow_listing IS TRUE");
    expect(up).toContain("metadata.app_mode IN ('mini-app', 'external')");
    expect(up).toContain(
      "public.is_valid_reviewer_integration_url(metadata.integration_url)",
    );
    expect(up).toContain("reviewed_app.is_staging IS FALSE");
    expect(up).toContain("reviewed_app.deleted_at IS NULL");
    expect(up).toContain("owning_team.deleted_at IS NULL");
    expect(up).toContain("to_jsonb(metadata)");
    expect(up).toContain("localizations_snapshot");
    expect(up).toContain("asset_snapshot");
    expect(up).toContain("'system:legacy-listing-bridge'");
    expect(up).toContain("'submitted'");
    expect(up).toContain("'submission_received'");
    expect(up).toContain("'slack'");
    expect(up).toContain("ON CONFLICT DO NOTHING");
  });

  it("captures future direct transitions but yields to the authoritative capture operation", () => {
    expect(up).toContain(
      "CREATE TRIGGER bridge_uncaptured_listing_review_submission",
    );
    expect(up).toContain(
      "AFTER INSERT OR UPDATE OF verification_status, is_developer_allow_listing, app_mode, integration_url",
    );
    expect(up).toContain(
      "current_setting('reviewer.workflow_bypass', true) = 'on'",
    );
    expect(up).toMatch(
      /CREATE TRIGGER bridge_uncaptured_listing_review_submission[\s\S]*SELECT public\.reconcile_uncaptured_listing_review_submission\(metadata\.id\)/,
    );
  });

  it("removes the trigger before its functions on rollback", () => {
    expect(down).toMatch(
      /DROP TRIGGER bridge_uncaptured_listing_review_submission[\s\S]*DROP FUNCTION public\.bridge_uncaptured_listing_review_submission[\s\S]*DROP FUNCTION public\.reconcile_uncaptured_listing_review_submission/,
    );
  });

  it("withdraws invalid rows from the original one-time backfill", () => {
    expect(urlFence).toContain("system:invalid-integration-url-reconciliation");
    expect(urlFence).toMatch(
      /submission\.status IN \('pending', 'in_review'\)[\s\S]*NOT public\.is_valid_reviewer_integration_url\(metadata\.integration_url\)/,
    );
    expect(urlFence).toContain(
      "CREATE FUNCTION public.is_valid_reviewer_integration_url",
    );
    expect(urlFence).toContain(
      "CREATE TRIGGER guard_reviewer_approval_integration_url",
    );
    expect(urlFence).toContain("SET verification_status = 'unverified'");
    expect(urlFence).toContain("SET status = 'dead_letter'");
    expect(urlFence).toContain("'withdrawn'");
  });
});
