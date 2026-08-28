import { existsSync, readFileSync } from "fs";
import path from "path";

const repoRoot = path.join(__dirname, "../../..");
const migrationDirectory = path.join(
  repoRoot,
  "hasura/migrations/default/1789840800000_cancel_withdrawn_review_notifications",
);
const readOptional = (filename: string) =>
  existsSync(filename) ? readFileSync(filename, "utf8") : "";
const up = readOptional(path.join(migrationDirectory, "up.sql"));
const down = readOptional(path.join(migrationDirectory, "down.sql"));

describe("withdrawn review notification and lock-order hardening", () => {
  it("atomically dead-letters stale submission Slack work with an audit event", () => {
    expect(up).toContain("cancel_app_review_submission_received_notification");
    expect(up).toContain("status IN ('pending', 'processing', 'failed')");
    expect(up).toContain("status = 'dead_letter'");
    expect(up).toContain("manual_retry_blocked = true");
    expect(up).toContain("locked_at = NULL");
    expect(up).toContain("locked_by = NULL");
    expect(up).toContain("'notification_dead_lettered'");
  });

  it("cancels from developer, app deletion, team deletion, ban, and rollout paths", () => {
    for (const actor of [
      "p_actor_subject",
      "system:app-deletion",
      "system:team-deletion",
      "system:notification-terminal-reconciliation",
    ]) {
      expect(up).toContain(actor);
    }
    expect(up).toContain("withdraw_active_app_reviews_for_ban");
    expect(up).toContain(
      "reconcile_terminal_app_review_submission_notifications",
    );
  });

  it("claims completed alerts but excludes withdrawn submissions", () => {
    expect(up).toContain(
      "CREATE FUNCTION public.reviewer_claim_app_review_notifications",
    );
    expect(up).toContain("locked_submission.status = 'withdrawn'");
    const submissionLock = up.indexOf("INTO locked_submission");
    const notificationLock = up.indexOf(
      "INTO locked_notification",
      submissionLock,
    );
    expect(submissionLock).toBeGreaterThan(-1);
    expect(notificationLock).toBeGreaterThan(submissionLock);
  });

  it("orders completion and manual retry behind the submission lock", () => {
    for (const functionName of [
      "reviewer_complete_app_review_notification",
      "reviewer_retry_app_review_notification",
    ]) {
      const start = up.indexOf(`CREATE FUNCTION public.${functionName}(`);
      const nextFunction = up.indexOf("CREATE FUNCTION public.", start + 1);
      const body = up.slice(
        start,
        nextFunction > start ? nextFunction : undefined,
      );
      const submission = body.indexOf("INTO submission");
      const notification = body.indexOf("INTO notification", submission);
      expect(start).toBeGreaterThan(-1);
      expect(submission).toBeGreaterThan(-1);
      expect(notification).toBeGreaterThan(submission);
    }
  });

  it("coordinates the provider boundary with a bounded pre-send fence", () => {
    expect(up).toContain("reviewer_begin_app_review_submission_slack_delivery");
    expect(up).toContain("provider_send_fence");
    expect(up).toContain("interval '30 seconds'");
    expect(up).toContain("A Slack provider send is already in progress");
    expect(up).toContain(
      "reviewer_complete_app_review_notification_before_terminal_fence",
    );
    expect(up).toContain(
      "reviewer_retry_app_review_notification_before_lock_order_fix",
    );
  });

  it("makes app and team transitions deadlock-safe with ordered advisory ownership", () => {
    expect(up).toContain("withdraw_active_app_reviews_for_transition");
    expect(up).toContain("withdraw_active_team_reviews_for_transition");
    expect(up).toContain("pg_try_advisory_xact_lock");
    expect(up).toContain("ERRCODE = '55P03'");
    expect(up).toContain("ORDER BY active_submission.app_metadata_id");
    expect(up).toContain("FOR UPDATE");
  });

  it("splits advisory-first standalone bridge reconciliation from trigger-locked work", () => {
    const standalone = up.indexOf(
      "CREATE FUNCTION public.reconcile_uncaptured_listing_review_submission(",
    );
    const locked = up.indexOf(
      "CREATE FUNCTION public.reconcile_uncaptured_listing_review_submission_locked(",
    );
    const bridge = up.indexOf(
      "CREATE OR REPLACE FUNCTION public.bridge_uncaptured_listing_review_submission",
    );
    expect(locked).toBeGreaterThan(-1);
    expect(standalone).toBeGreaterThan(locked);
    expect(up.slice(standalone, bridge)).toContain("pg_advisory_xact_lock");
    expect(up.slice(bridge)).toContain(
      "reconcile_uncaptured_listing_review_submission_locked(NEW.id)",
    );
  });

  it("orders asset snapshot setter and reconciler behind metadata advisory locks", () => {
    for (const functionName of [
      "reviewer_set_app_review_asset_snapshot",
      "reconcile_app_review_asset_snapshot_repair",
    ]) {
      const start = up.indexOf(`CREATE FUNCTION public.${functionName}(`);
      const nextFunction = up.indexOf("CREATE FUNCTION public.", start + 1);
      const body = up.slice(
        start,
        nextFunction > start ? nextFunction : undefined,
      );
      const advisory = body.indexOf("pg_advisory_xact_lock");
      const metadata = body.indexOf("INTO current_metadata");
      const submission = body.indexOf("INTO submission", metadata);
      expect(start).toBeGreaterThan(-1);
      expect(advisory).toBeGreaterThan(-1);
      expect(metadata).toBeGreaterThan(advisory);
      expect(submission).toBeGreaterThan(metadata);
    }
  });

  it("restores every replaced operation on rollback", () => {
    for (const backup of [
      "developer_withdraw_active_review_draft_before_notification_cancellation",
      "withdraw_app_reviews_on_soft_delete_before_lock_order_fix",
      "withdraw_team_reviews_on_soft_delete_before_lock_order_fix",
      "withdraw_active_app_reviews_for_ban_before_lock_order_fix",
      "reviewer_claim_app_review_notifications_before_terminal_fence",
      "reviewer_complete_app_review_notification_before_terminal_fence",
      "reviewer_set_app_review_asset_snapshot_before_lock_order_fix",
      "reconcile_app_review_asset_snapshot_repair_before_lock_order_fix",
      "reconcile_uncaptured_listing_review_submission_before_lock_order_fix",
    ]) {
      expect(down).toContain(backup);
    }
    expect(down).toContain(
      "DROP FUNCTION public.cancel_app_review_submission_received_notification",
    );
  });
});
