import { existsSync, readFileSync } from "fs";
import path from "path";

const repositoryRoot = path.join(__dirname, "../../..");
const migrationDirectory = path.join(
  repositoryRoot,
  "hasura/migrations/default/1789322400000_make_legacy_verification_version_aware",
);
const functionMetadataPath = path.join(
  repositoryRoot,
  "hasura/metadata/databases/default/functions/public_legacy_verify_app_metadata.yaml",
);
const tablesMetadataPath = path.join(
  repositoryRoot,
  "hasura/metadata/databases/default/tables/tables.yaml",
);
const settlementTableMetadataPath = path.join(
  repositoryRoot,
  "hasura/metadata/databases/default/tables/public_legacy_app_verification_asset_settlement.yaml",
);
const mutationPath = path.join(
  repositoryRoot,
  "web/api/hasura/verify-app/graphql/verifyApp.graphql",
);
const reviewerDecisionMigrationPath = path.join(
  repositoryRoot,
  "hasura/migrations/default/1788112800000_add_reviewer_decisions/up.sql",
);

const readOptional = (filename: string) =>
  existsSync(filename) ? readFileSync(filename, "utf8") : "";

describe("legacy verification compare-and-swap", () => {
  const up = readOptional(path.join(migrationDirectory, "up.sql"));
  const down = readOptional(path.join(migrationDirectory, "down.sql"));
  const functionMetadata = readOptional(functionMetadataPath);
  const tablesMetadata = readOptional(tablesMetadataPath);
  const settlementTableMetadata = readOptional(settlementTableMetadataPath);
  const mutation = readOptional(mutationPath);
  const reviewerDecisionMigration = readOptional(reviewerDecisionMigrationPath);

  it("locks and promotes only the exact awaiting metadata version", () => {
    expect(up).toContain("legacy_verify_app_metadata");
    expect(up).toContain("legacy_verification_operation_id");
    expect(up).toContain("p_operation_id uuid");
    expect(up).toMatch(
      /metadata\.legacy_verification_operation_id = p_operation_id[\s\S]*RETURN NEXT metadata/,
    );
    expect(up).toContain("pg_advisory_xact_lock");
    expect(up).toContain(
      "metadata.updated_at IS DISTINCT FROM p_expected_metadata_updated_at",
    );
    expect(up).toContain(
      "metadata.verification_status IS DISTINCT FROM 'awaiting_review'",
    );
    expect(up).toContain("p_expected_prior_verified_updated_at");
    expect(up).toContain("p_expected_localization_versions");
    expect(up).toContain("status IN ('pending', 'in_review')");
    expect(up).toContain("metadata.app_mode IN ('mini-app', 'external')");
    expect(up).toContain("metadata.is_developer_allow_listing IS TRUE");
    expect(up).toMatch(
      /DELETE FROM public\.app_metadata[\s\S]*UPDATE public\.app_metadata[\s\S]*RETURN NEXT verified_metadata/,
    );
    expect(up).toMatch(
      /UPDATE public\.legacy_app_verification_asset_settlement[\s\S]*outcome = 'committed'[\s\S]*RETURN NEXT verified_metadata/,
    );
  });

  it("durably registers and retries exact-app asset settlement", () => {
    expect(up).toContain(
      "CREATE TABLE public.legacy_app_verification_asset_settlement",
    );
    expect(up).toContain("register_legacy_app_verification_asset_settlement");
    expect(up).toContain(
      "reviewer_claim_legacy_app_verification_asset_settlements",
    );
    expect(up).toContain("complete_legacy_app_verification_asset_settlement");
    expect(up).toContain(
      "split_part(asset_key.value #>> '{}', '/', 2) IS DISTINCT FROM p_app_id",
    );
    expect(up).toContain("ELSE 'failed'");
    expect(up).toContain("THEN 'dead_letter'");
    expect(up).toContain("FOR UPDATE SKIP LOCKED");
    expect(up).toMatch(
      /metadata\.legacy_verification_operation_id =\s*settlement\.operation_id/,
    );
    expect(up).toMatch(
      /FOR candidate IN[\s\S]*pg_advisory_xact_lock[\s\S]*FROM public\.app_metadata[\s\S]*FOR UPDATE[\s\S]*FROM public\.legacy_app_verification_asset_settlement[\s\S]*FOR UPDATE SKIP LOCKED[\s\S]*settlement\.attempt_count >= 8[\s\S]*delivery_status = 'dead_letter'/,
    );
    expect(up).not.toMatch(
      /A worker that repeatedly dies[\s\S]*UPDATE public\.legacy_app_verification_asset_settlement/,
    );
  });

  it("tracks the settlement without exposing direct writes", () => {
    expect(tablesMetadata).toContain(
      "public_legacy_app_verification_asset_settlement.yaml",
    );
    expect(settlementTableMetadata).toContain(
      "name: legacy_app_verification_asset_settlement",
    );
    expect(settlementTableMetadata).toContain("role: reviewer");
    expect(settlementTableMetadata).toContain("role: service");
    expect(settlementTableMetadata).not.toContain("insert_permissions:");
    expect(settlementTableMetadata).not.toContain("update_permissions:");
    expect(settlementTableMetadata).not.toContain("delete_permissions:");
  });

  it("exposes the mutation only to the authenticated legacy reviewer role", () => {
    expect(functionMetadata).toContain("name: legacy_verify_app_metadata");
    expect(functionMetadata).toContain("exposed_as: mutation");
    expect(functionMetadata).toContain("role: reviewer");
    expect(functionMetadata).not.toContain("role: user");
  });

  it("replaces the non-atomic multi-root mutation with the exact operation", () => {
    expect(mutation).toContain("legacy_verify_app_metadata");
    expect(mutation).toContain("p_operation_id: $operation_id");
    expect(mutation).toContain(
      "p_expected_metadata_updated_at: $expected_metadata_updated_at",
    );
    expect(mutation).not.toContain("delete_app_metadata_by_pk");
    expect(mutation).not.toContain("update_app_metadata_by_pk");
  });

  it("serializes and rejects localization writes after the parent enters review or becomes live", () => {
    expect(reviewerDecisionMigration).toMatch(
      /guard_active_app_review_localization_write[\s\S]*FOR UPDATE[\s\S]*verification_status IN \(\s*'awaiting_review',\s*'verified'\s*\)/,
    );
    expect(up).toMatch(
      /previous_workflow_bypass text := current_setting\(\s*'reviewer\.workflow_bypass',\s*true\s*\)/,
    );
    expect(up).toContain(
      "PERFORM set_config('reviewer.workflow_bypass', 'on', true)",
    );
    expect(up).toContain("COALESCE(previous_workflow_bypass, '')");
  });

  it("drops the transactional function on rollback", () => {
    expect(down).toContain("DROP FUNCTION public.legacy_verify_app_metadata");
    expect(down).toContain(
      "DROP FUNCTION IF EXISTS public.complete_legacy_app_verification_asset_settlement",
    );
    expect(down).toContain(
      "DROP TABLE IF EXISTS public.legacy_app_verification_asset_settlement",
    );
  });
});
