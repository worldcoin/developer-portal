import { existsSync, readFileSync } from "fs";
import path from "path";

const repoRoot = path.join(__dirname, "../../..");
const migrationDirectory = path.join(
  repoRoot,
  "hasura/migrations/default/1789581600000_reconcile_reviewer_prepared_asset_cleanup",
);
const readOptional = (filename: string) =>
  existsSync(filename) ? readFileSync(filename, "utf8") : "";
const up = readOptional(path.join(migrationDirectory, "up.sql"));
const down = readOptional(path.join(migrationDirectory, "down.sql"));
const functionsDirectory = path.join(
  repoRoot,
  "hasura/metadata/databases/default/functions",
);
const functionMetadata = readOptional(
  path.join(
    functionsDirectory,
    "public_reviewer_reconcile_app_review_asset_cleanup.yaml",
  ),
);
const functions = readOptional(path.join(functionsDirectory, "functions.yaml"));
const workflowGraphql = readOptional(
  path.join(
    repoRoot,
    "web/api/admin/reviewer/graphql/reviewer-workflow.graphql",
  ),
);

describe("reviewer prepared asset cleanup reconciliation", () => {
  it("tracks one service-only exact-plan reconciliation operation", () => {
    expect(up).toContain(
      "CREATE OR REPLACE FUNCTION public.reviewer_reconcile_app_review_asset_cleanup",
    );
    expect(functions).toContain(
      "public_reviewer_reconcile_app_review_asset_cleanup.yaml",
    );
    expect(functionMetadata).toContain("exposed_as: mutation");
    expect(functionMetadata).toContain("- role: service");
    expect(functionMetadata).not.toContain("- role: reviewer");
    expect(functionMetadata).not.toContain(
      "- role: internal_dashboard_readonly",
    );
    expect(workflowGraphql).toContain("mutation ReconcileReviewAssetCleanup");
  });

  it("serializes with decisions in metadata, app, submission, notification order", () => {
    const advisory = up.indexOf(
      "pg_advisory_xact_lock(hashtextextended(p_app_metadata_id, 0))",
    );
    const metadata = up.indexOf("INTO submitted_metadata", advisory);
    const app = up.indexOf("INTO reviewed_app", metadata);
    const submission = up.indexOf("INTO submission", app);
    const notification = up.indexOf("INTO cleanup_notification", submission);

    expect(advisory).toBeGreaterThan(-1);
    expect(metadata).toBeGreaterThan(advisory);
    expect(app).toBeGreaterThan(metadata);
    expect(submission).toBeGreaterThan(app);
    expect(notification).toBeGreaterThan(submission);
    expect(up.slice(advisory, notification)).toContain("FOR UPDATE");
  });

  it("binds reconciliation to the claimed worker and exact immutable plan", () => {
    for (const guard of [
      "cleanup_notification.locked_by IS DISTINCT FROM p_worker_id",
      "cleanup_notification.payload ->> 'decision_fingerprint' IS DISTINCT FROM p_decision_fingerprint",
      "cleanup_notification.payload ->> 'operation_id' IS DISTINCT FROM p_operation_id",
      "cleanup_notification.payload ->> 'expected_review_version' IS DISTINCT FROM p_expected_review_version::text",
      "cleanup_notification.payload ->> 'app_metadata_id' IS DISTINCT FROM p_app_metadata_id",
      "cleanup_notification.payload -> 'asset_keys' IS DISTINCT FROM p_asset_keys",
    ]) {
      expect(up).toContain(guard);
    }
    expect(up).toContain(
      "cleanup_notification.status IS DISTINCT FROM 'processing'",
    );
  });

  it("derives committed only from the exact approved result and otherwise defers or aborts", () => {
    expect(up).toContain("submission.status = 'approved'");
    expect(up).toContain(
      "submission.decision_fingerprint = p_decision_fingerprint",
    );
    expect(up).toContain(
      "submission.decision_result -> 'prepared_asset_keys' = p_asset_keys",
    );
    expect(up).toContain(
      "submission.review_version = p_expected_review_version + 1",
    );
    expect(up).toContain("clock_timestamp() >= submission.claim_expires_at");
    expect(up).toContain("'settlement_state', derived_settlement_state");
  });

  it("fences a delayed approval after its exact prepared plan was aborted", () => {
    expect(up).toContain(
      "CREATE OR REPLACE FUNCTION public.guard_aborted_app_review_asset_cleanup_decision",
    );
    expect(up).toContain(
      "CREATE TRIGGER guard_aborted_app_review_asset_cleanup_decision",
    );
    expect(up).toContain("OLD.status = 'in_review'");
    expect(up).toContain("NEW.status = 'approved'");
    expect(up).toContain(
      "candidate.payload ->> 'expected_review_version' = OLD.review_version::text",
    );
    expect(up).toContain(
      "candidate.payload -> 'asset_keys' = NEW.decision_result -> 'prepared_asset_keys'",
    );
    expect(up).toContain(
      "candidate.payload ->> 'settlement_state' = 'aborted'",
    );
  });

  it("rolls back the trigger and service operation", () => {
    expect(down).toContain(
      "DROP TRIGGER IF EXISTS guard_aborted_app_review_asset_cleanup_decision",
    );
    expect(down).toContain(
      "DROP FUNCTION IF EXISTS public.guard_aborted_app_review_asset_cleanup_decision",
    );
    expect(down).toContain(
      "DROP FUNCTION IF EXISTS public.reviewer_reconcile_app_review_asset_cleanup",
    );
  });
});
