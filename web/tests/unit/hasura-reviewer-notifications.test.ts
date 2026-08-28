import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "../../..");
const migrationPath = path.join(
  root,
  "hasura/migrations/default/1788199200000_deliver_reviewer_notifications/up.sql",
);
const rollbackPath = path.join(
  root,
  "hasura/migrations/default/1788199200000_deliver_reviewer_notifications/down.sql",
);

describe("reviewer notification outbox migration", () => {
  it("claims due work with a lease and appends an attempted event atomically", () => {
    const sql = fs.readFileSync(migrationPath, "utf8");

    expect(sql).toContain(
      "CREATE OR REPLACE FUNCTION public.reviewer_claim_app_review_notifications",
    );
    expect(sql).toMatch(/FOR UPDATE(?: OF notification)? SKIP LOCKED/);
    expect(sql).toContain("interval '5 minutes'");
    expect(sql).toContain("attempt_count = notification.attempt_count + 1");
    expect(sql).toContain("'notification_attempted'");
    expect(sql).toContain("attempt_count < 8");
    expect(sql).toMatch(
      /exhausted_candidates[\s\S]*FOR UPDATE(?: OF notification)? SKIP LOCKED[\s\S]*LIMIT p_limit/,
    );
    expect(sql).toContain("notification.locked_at IS NULL");
    expect(sql).toContain(
      "WHEN notification.notification_type = 'submission_received'",
    );
    expect(sql).toMatch(
      /notification\.next_attempt_at,\s+notification\.created_at,\s+notification\.id/,
    );
  });

  it("excludes an ambiguous prepared operation while its exact claim is live", () => {
    const sql = fs.readFileSync(migrationPath, "utf8");

    expect(sql).toContain("'prepared_operation_settlement'");
    expect(sql).toContain("'settlement_state' = 'pending'");
    expect(sql).toContain("claim_expires_at > now()");
    expect(sql).toContain("expected_review_version");
  });

  it("applies exponential retry through eight attempts and records every outcome", () => {
    const sql = fs.readFileSync(migrationPath, "utf8");

    expect(sql).toContain(
      "CREATE OR REPLACE FUNCTION public.reviewer_complete_app_review_notification",
    );
    expect(sql).toContain("p_outcome IS NULL");
    expect(sql).toContain("power(2, notification.attempt_count - 1)");
    expect(sql).toContain("notification.attempt_count >= 8");
    expect(sql).toContain("'dead_letter'");
    expect(sql).toContain("'notification_delivered'");
    expect(sql).toContain("'notification_failed'");
    expect(sql).toContain("'notification_dead_lettered'");
    expect(sql).toContain("'publication_check_succeeded'");
    expect(sql).toContain("'publication_check_failed'");
    expect(sql).not.toContain(
      "attempt_count = GREATEST(notification.attempt_count - 1, 0)",
    );
    expect(sql).toContain("locked_by IS DISTINCT FROM p_worker_id");
    expect(sql).toContain("notification.status = 'delivered'");
  });

  it("starts a new bounded cycle for manual dead-letter retry and preserves the prior error", () => {
    const sql = fs.readFileSync(migrationPath, "utf8");

    expect(sql).toContain("WHEN previous_status = 'dead_letter' THEN 0");
    expect(sql).toContain("previous_error := notification.last_error");
    expect(sql).toContain("'previous_error', previous_error");
  });

  it("never deletes immutable events during rollback", () => {
    const rollback = fs.readFileSync(rollbackPath, "utf8");
    expect(rollback).not.toMatch(/DELETE FROM public\.app_review_event/i);
  });

  it("allows only the service role to claim, complete, and manually retry", () => {
    const functions = fs.readFileSync(
      path.join(
        root,
        "hasura/metadata/databases/default/functions/functions.yaml",
      ),
      "utf8",
    );
    for (const name of [
      "public_reviewer_claim_app_review_notifications.yaml",
      "public_reviewer_complete_app_review_notification.yaml",
      "public_reviewer_retry_app_review_notification.yaml",
    ]) {
      expect(functions).toContain(name);
      expect(
        fs.readFileSync(
          path.join(root, "hasura/metadata/databases/default/functions", name),
          "utf8",
        ),
      ).toContain("role: service");
    }
  });
});
