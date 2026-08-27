import { existsSync, readFileSync } from "fs";
import path from "path";

const repoRoot = path.join(__dirname, "../../..");
const migrationPath = path.join(
  repoRoot,
  "hasura/migrations/default/1788026400000_add_reviewer_workflow_operations/up.sql",
);
const downMigrationPath = path.join(
  repoRoot,
  "hasura/migrations/default/1788026400000_add_reviewer_workflow_operations/down.sql",
);
const functionsPath = path.join(
  repoRoot,
  "hasura/metadata/databases/default/functions",
);

const readOptional = (filename: string) =>
  existsSync(filename) ? readFileSync(filename, "utf8") : "";

describe("reviewer workflow database operations", () => {
  const migration = readOptional(migrationPath);

  it.each([
    "reviewer_claim_app_review_submission",
    "reviewer_heartbeat_app_review_submission",
    "reviewer_release_app_review_submission",
    "reviewer_save_app_review_checklist",
  ])("defines %s as one transactional operation", (functionName) => {
    expect(migration).toContain(
      `CREATE OR REPLACE FUNCTION public.${functionName}`,
    );
    expect(migration).toMatch(
      new RegExp(
        `CREATE OR REPLACE FUNCTION public\\.${functionName}[\\s\\S]*?LANGUAGE plpgsql[\\s\\S]*?SECURITY INVOKER`,
      ),
    );
  });

  it("uses database-generated 30-minute leases and permits expired takeover", () => {
    expect(migration).toContain("gen_random_uuid()");
    expect(migration).toContain("now() + interval '30 minutes'");
    expect(migration).toMatch(
      /claim_expires_at IS NULL\s+OR candidate\.claim_expires_at <= now\(\)/,
    );
    expect(migration).toContain("'claim_expired'");
    expect(migration).toContain("'claimed'");
  });

  it("compare-and-swaps claimant, token, unexpired lease, and review version", () => {
    for (const guard of [
      "submission.review_version = p_expected_review_version",
      "submission.claim_token = p_claim_token",
      "submission.claimed_by_subject = p_actor_subject",
      "submission.claim_expires_at > now()",
      "submission.status = 'in_review'",
    ]) {
      expect(migration).toContain(guard);
    }
    expect(migration).toContain("review_version = review_version + 1");
  });

  it("clears every claim field and returns a released review to pending", () => {
    const release = migration.slice(
      migration.indexOf(
        "CREATE OR REPLACE FUNCTION public.reviewer_release_app_review_submission",
      ),
      migration.indexOf(
        "CREATE OR REPLACE FUNCTION public.reviewer_save_app_review_checklist",
      ),
    );

    expect(release).toContain("status = 'pending'");
    for (const assignment of [
      "claim_token = NULL",
      "claimed_by_subject = NULL",
      "claimed_by_email = NULL",
      "claimed_at = NULL",
      "claim_expires_at = NULL",
    ]) {
      expect(release).toContain(assignment);
    }
    expect(release).toContain("'claim_released'");
  });

  it("persists checklist JSON and version while appending immutable audit", () => {
    expect(migration).toContain("checklist = p_checklist");
    expect(migration).toContain("checklist_version = p_checklist_version");
    expect(migration).toContain("jsonb_typeof(p_checklist) <> 'object'");
    expect(migration).toContain("INSERT INTO public.app_review_event");
    expect(migration).toContain("'claim_heartbeat'");
    expect(migration).toContain("'checklist_updated'");
    expect(migration).toContain("'checklist', saved_submission.checklist");
  });

  it("tracks all operations as service-only Hasura mutations", () => {
    const functions = readOptional(path.join(functionsPath, "functions.yaml"));

    for (const functionName of [
      "reviewer_claim_app_review_submission",
      "reviewer_heartbeat_app_review_submission",
      "reviewer_release_app_review_submission",
      "reviewer_save_app_review_checklist",
    ]) {
      const metadataName = `public_${functionName}.yaml`;
      const metadata = readOptional(path.join(functionsPath, metadataName));

      expect(functions).toContain(metadataName);
      expect(metadata).toContain("exposed_as: mutation");
      expect(metadata).toContain("- role: service");
      expect(metadata).not.toContain("internal_dashboard_readonly");
      expect(metadata).not.toContain("- role: reviewer");
    }
  });

  it("drops all four functions in the rollback", () => {
    const downMigration = readOptional(downMigrationPath);

    for (const functionName of [
      "reviewer_claim_app_review_submission",
      "reviewer_heartbeat_app_review_submission",
      "reviewer_release_app_review_submission",
      "reviewer_save_app_review_checklist",
    ]) {
      expect(downMigration).toContain(`DROP FUNCTION public.${functionName}`);
    }
  });
});
