import { existsSync, readFileSync } from "fs";
import path from "path";

const repoRoot = path.join(__dirname, "../../..");
const migrationDirectory = path.join(
  repoRoot,
  "hasura/migrations/default/1788112800000_add_reviewer_decisions",
);
const readOptional = (filename: string) =>
  existsSync(filename) ? readFileSync(filename, "utf8") : "";
const migration = readOptional(path.join(migrationDirectory, "up.sql"));
const rollback = readOptional(path.join(migrationDirectory, "down.sql"));
const functionsDirectory = path.join(
  repoRoot,
  "hasura/metadata/databases/default/functions",
);
const submissionMetadata = readOptional(
  path.join(
    repoRoot,
    "hasura/metadata/databases/default/tables/public_app_review_submission.yaml",
  ),
);
const workflowGraphql = readOptional(
  path.join(
    repoRoot,
    "web/api/admin/reviewer/graphql/reviewer-workflow.graphql",
  ),
);

describe("reviewer decision database operation", () => {
  it("stores a unique canonical decision fingerprint and terminal result", () => {
    expect(migration).toContain('ADD COLUMN "decision_fingerprint" text');
    expect(migration).toContain('ADD COLUMN "decision_result" jsonb');
    expect(migration).toContain("app_review_submission_decision_result_object");
    expect(submissionMetadata).toContain("- decision_fingerprint");
    expect(submissionMetadata).toContain("- decision_result");
  });

  it("defines one service-only exact-version finalizer", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.reviewer_decide_app_review_submission",
    );
    expect(migration).toContain("SECURITY INVOKER");
    const tracked = readOptional(
      path.join(
        functionsDirectory,
        "public_reviewer_decide_app_review_submission.yaml",
      ),
    );
    const functions = readOptional(
      path.join(functionsDirectory, "functions.yaml"),
    );
    expect(functions).toContain(
      "public_reviewer_decide_app_review_submission.yaml",
    );
    expect(tracked).toContain("exposed_as: mutation");
    expect(tracked).toContain("- role: service");
    expect(tracked).not.toContain("- role: reviewer");
  });

  it("registers operation-unique prepared plans for delayed durable settlement", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.reviewer_enqueue_app_review_asset_cleanup",
    );
    expect(migration).toContain("'prepared_operation_settlement'");
    expect(migration).toContain("p_decision_fingerprint");
    expect(migration).toContain("p_operation_id");
    expect(migration).toContain("p_expected_review_version");
    expect(migration).toContain("p_app_metadata_id");
    expect(migration).toContain("p_asset_keys");
    expect(migration).toContain("'settlement_state', 'pending'");
    expect(migration).toContain(
      "'expected_review_version', p_expected_review_version",
    );
    expect(migration).toContain("'app_metadata_id', p_app_metadata_id");
    expect(migration).toContain("next_attempt_at");
    expect(migration).toContain("interval '2 minutes'");
    const tracked = readOptional(
      path.join(
        functionsDirectory,
        "public_reviewer_enqueue_app_review_asset_cleanup.yaml",
      ),
    );
    expect(tracked).toContain("- role: service");
    expect(tracked).not.toContain("- role: reviewer");
  });

  it("settles prepared plans as committed or aborted through a service-only operation", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.reviewer_settle_app_review_asset_cleanup",
    );
    expect(migration).toContain("p_settlement_state");
    expect(migration).toContain("IN ('committed', 'aborted')");
    expect(migration).toContain("'settlement_state', p_settlement_state");
    const tracked = readOptional(
      path.join(
        functionsDirectory,
        "public_reviewer_settle_app_review_asset_cleanup.yaml",
      ),
    );
    expect(tracked).toContain("- role: service");
    expect(tracked).not.toContain("- role: reviewer");
  });

  it("binds every prepared cleanup key to the metadata and operation", () => {
    expect(migration).toContain(
      "'review_' || submission.app_metadata_id || '_' || p_operation_id || '_'",
    );
    expect(migration).toContain("prepared_filename");
    expect(migration).toContain("prepared_filename_prefix");
  });

  it("uses the shared metadata advisory lock and required row lock order", () => {
    const advisory = migration.indexOf("pg_advisory_xact_lock");
    const draft = migration.indexOf("INTO submitted_metadata");
    const app = migration.indexOf("INTO reviewed_app");
    const prior = migration.indexOf("INTO prior_verified_metadata");
    const localizations = migration.indexOf("AS locked_localization");
    const submission = migration.indexOf("INTO submission", localizations);

    expect(advisory).toBeGreaterThan(-1);
    expect(draft).toBeGreaterThan(advisory);
    expect(app).toBeGreaterThan(draft);
    expect(prior).toBeGreaterThan(app);
    expect(localizations).toBeGreaterThan(prior);
    expect(submission).toBeGreaterThan(localizations);
    expect(migration).toContain("FOR UPDATE");
  });

  it("compare-and-swaps the claim, draft, localizations, mode, and consent", () => {
    for (const guard of [
      "submission.review_version = p_expected_review_version",
      "submission.claim_token = p_claim_token",
      "submission.claimed_by_subject = p_actor_subject",
      "submission.claim_expires_at > now()",
      "submitted_metadata.id = p_app_metadata_id",
      "submitted_metadata.updated_at IS DISTINCT FROM p_expected_metadata_updated_at",
      "submitted_metadata.verification_status IS DISTINCT FROM 'awaiting_review'",
      "submitted_metadata.app_mode IS DISTINCT FROM submission.app_mode",
      "submitted_metadata.is_developer_allow_listing IS NOT TRUE",
      "current_localizations_snapshot IS DISTINCT FROM submission.localizations_snapshot",
    ]) {
      expect(migration).toContain(guard);
    }
  });

  it("CASes the exact prior verified row or its locked absence", () => {
    expect(migration).toContain("p_expected_prior_verified_id");
    expect(migration).toContain("p_expected_prior_verified_updated_at");
    expect(migration).toContain(
      "prior_verified.verification_status = 'verified'",
    );
    expect(migration).toContain(
      "prior_verified_metadata.id IS DISTINCT FROM p_expected_prior_verified_id",
    );
    expect(migration).toContain(
      "prior_verified_metadata.updated_at IS DISTINCT FROM p_expected_prior_verified_updated_at",
    );
    expect(migration).toContain(
      "current_prior_localizations_snapshot IS DISTINCT FROM p_expected_prior_localizations_snapshot",
    );
    expect(migration).toContain(
      "prior_verified_found IS DISTINCT FROM (p_expected_prior_verified_id IS NOT NULL)",
    );
  });

  it("makes matching terminal retries idempotent and mismatches empty", () => {
    expect(migration).toMatch(
      /submission\.status IN \('approved', 'changes_requested'\)[\s\S]*submission\.decision_fingerprint = p_decision_fingerprint[\s\S]*submission\.decided_by_subject = p_actor_subject[\s\S]*RETURN NEXT submission/,
    );
    expect(migration).toContain("RETURN;");
    expect(migration).toContain("ON CONFLICT (dedupe_key) DO NOTHING");
    const terminalRetry = migration.indexOf(
      "submission.status IN ('approved', 'changes_requested')",
    );
    const decisionEvent = migration.indexOf(
      "INSERT INTO public.app_review_event",
      terminalRetry,
    );
    expect(terminalRetry).toBeGreaterThan(-1);
    expect(decisionEvent).toBeGreaterThan(terminalRetry);
  });

  it("rejects null fingerprints and keys outside the exact reviewed app prefix", () => {
    expect(migration).toContain("p_decision IS NULL");
    expect(migration).toContain("p_decision_fingerprint IS NULL");
    expect(migration).toContain(
      "split_part(prepared_key.value, '/', 2) IS DISTINCT FROM reviewed_app.id",
    );
    expect(migration).toContain(
      "split_part(old_key.value, '/', 2) IS DISTINCT FROM reviewed_app.id",
    );
  });

  it("requests changes without replacing the live version", () => {
    const requestChanges = migration.slice(
      migration.indexOf("IF p_decision = 'changes_requested'"),
      migration.indexOf("-- Approval", migration.indexOf("IF p_decision")),
    );
    expect(requestChanges).toContain(
      "verification_status = 'changes_requested'",
    );
    expect(requestChanges).toContain("review_message = p_developer_message");
    expect(requestChanges).toContain("reviewed_by = p_actor_email");
    expect(requestChanges).not.toContain("DELETE FROM public.app_metadata");
    expect(requestChanges).not.toContain("is_reviewer_world_app_approved");
    expect(requestChanges).not.toContain("is_reviewer_app_store_approved");
  });

  it("deletes the exact old live row before promoting in place with derived flags", () => {
    const deletion = migration.indexOf("DELETE FROM public.app_metadata");
    const promotion = migration.indexOf(
      "UPDATE public.app_metadata\n        SET logo_img_url",
      deletion,
    );
    expect(deletion).toBeGreaterThan(-1);
    expect(promotion).toBeGreaterThan(deletion);
    expect(migration).toContain("is_reviewer_world_app_approved = true");
    expect(migration).toContain(
      "is_reviewer_app_store_approved = (submission.app_mode = 'mini-app')",
    );
    expect(migration).toContain("UPDATE public.localisations");
    expect(migration).toContain("first_verified_at = COALESCE");
    const destructiveApproval = migration.slice(deletion, promotion);
    expect(destructiveApproval).toContain(
      "RAISE EXCEPTION 'Exact prior verified metadata changed during decision.'",
    );
  });

  it("deduplicates OWNER and ADMIN recipients inside the decision transaction", () => {
    expect(migration).toContain(
      "SELECT DISTINCT lower(btrim(team_user.email))",
    );
    expect(migration).toContain("membership.role IN ('OWNER', 'ADMIN')");
    expect(migration).toContain("decision_approved");
    expect(migration).toContain("decision_changes_requested");
    expect(migration).not.toMatch(/internalNotes|internal_notes/);
  });

  it("adds publication and durable exact-key asset cleanup outbox work", () => {
    expect(migration).toContain("'publication_check'");
    expect(migration).toContain("'asset_cleanup'");
    expect(migration).toContain("'asset'");
    expect(migration).toContain("p_old_asset_keys");
    expect(migration).toContain("p_prepared_asset_keys");
    expect(
      workflowGraphql.match(/hero_image_url/g)?.length,
    ).toBeGreaterThanOrEqual(2);
  });

  it("clears the claim and appends a versioned immutable decision event", () => {
    for (const assignment of [
      "claim_token = NULL",
      "claimed_by_subject = NULL",
      "claimed_by_email = NULL",
      "claimed_at = NULL",
      "claim_expires_at = NULL",
    ]) {
      expect(migration).toContain(assignment);
    }
    expect(migration).toContain("review_version = review_version + 1");
    expect(migration).toContain("INSERT INTO public.app_review_event");
    expect(migration).toContain("p_decision_fingerprint");
  });

  it("fences app-scoped legacy writes while narrow workflow functions bypass", () => {
    expect(migration).toContain(
      "CREATE TRIGGER guard_active_app_review_metadata_write",
    );
    expect(migration).toContain(
      "CREATE TRIGGER guard_active_app_review_localization_write",
    );
    expect(migration).toContain("current_setting('reviewer.workflow_bypass'");
    expect(migration).toContain(
      "set_config('reviewer.workflow_bypass', 'on', true)",
    );
    expect(
      migration.match(/set_config\('reviewer\.workflow_bypass'/g)?.length,
    ).toBeGreaterThanOrEqual(3);
    expect(migration).toContain(
      "capture_listing_review_submission_without_reviewer_bypass",
    );
    expect(migration).toContain(
      "withdraw_listing_review_submission_without_reviewer_bypass",
    );
    expect(migration).toContain("guarded_old_app_id");
    expect(migration).toContain("guarded_new_app_id");
    expect(migration).toContain("guarded_old_metadata_id");
    expect(migration).toContain("guarded_new_metadata_id");
    expect(migration).toContain("previous_workflow_bypass");
    expect(
      migration.match(
        /set_config\(\s*'reviewer\.workflow_bypass',\s*COALESCE\(previous_workflow_bypass, ''\),\s*true\s*\)/g,
      )?.length,
    ).toBeGreaterThanOrEqual(6);
  });

  it("rolls back the finalizer, guards, outbox domain, and added columns", () => {
    expect(rollback).toContain(
      "DROP FUNCTION public.reviewer_decide_app_review_submission",
    );
    expect(rollback).toContain(
      "DROP FUNCTION public.reviewer_enqueue_app_review_asset_cleanup",
    );
    expect(rollback).toContain(
      "DROP FUNCTION public.reviewer_settle_app_review_asset_cleanup",
    );
    expect(rollback).toContain(
      "DROP TRIGGER guard_active_app_review_metadata_write",
    );
    expect(rollback).toContain(
      "DROP TRIGGER guard_active_app_review_localization_write",
    );
    expect(rollback).toContain('DROP COLUMN "decision_fingerprint"');
    expect(rollback).toContain('DROP COLUMN "decision_result"');
    expect(rollback).toContain("app_review_notification_type_check");
    expect(rollback).toContain("app_review_notification_channel_check");
    const cleanupRows = rollback.indexOf(
      "DELETE FROM public.app_review_notification",
    );
    const narrowChannelConstraint = rollback.indexOf(
      "ADD CONSTRAINT app_review_notification_channel_check",
    );
    expect(cleanupRows).toBeGreaterThan(-1);
    expect(cleanupRows).toBeLessThan(narrowChannelConstraint);
  });
});
