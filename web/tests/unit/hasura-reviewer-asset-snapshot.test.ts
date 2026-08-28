import { readFileSync } from "fs";
import path from "path";

const migration = readFileSync(
  path.join(
    __dirname,
    "../../../hasura/migrations/default/1788285600000_snapshot_reviewer_submission_assets/up.sql",
  ),
  "utf8",
);
const retryMigration = readFileSync(
  path.join(
    __dirname,
    "../../../hasura/migrations/default/1789149600000_retry_reviewer_asset_snapshot_repairs/up.sql",
  ),
  "utf8",
);
const tableMetadata = readFileSync(
  path.join(
    __dirname,
    "../../../hasura/metadata/databases/default/tables/public_app_review_submission.yaml",
  ),
  "utf8",
);

describe("reviewer asset snapshot database guard", () => {
  it("validates the complete immutable manifest before approval", () => {
    expect(migration).toMatch(
      /NEW\.status = 'approved'[\s\S]*public\.is_valid_reviewer_asset_snapshot\([\s\S]*NEW\.asset_snapshot[\s\S]*NEW\.app_id[\s\S]*NEW\.app_metadata_id[\s\S]*NEW\.metadata_snapshot/,
    );
    expect(migration).toMatch(
      /OLD\.asset_snapshot IS NOT NULL[\s\S]*NEW\.asset_snapshot IS DISTINCT FROM OLD\.asset_snapshot[\s\S]*asset snapshots are immutable/i,
    );
  });

  it("exposes and idempotently requeues dead-lettered preparation", () => {
    expect(retryMigration).toContain(
      "reviewer_retry_app_review_asset_snapshot_repair",
    );
    expect(retryMigration).toContain("asset_snapshot_repair_retry_requested");
    expect(retryMigration).toContain("'operation_id', p_operation_id");

    const readPermission = tableMetadata.slice(
      tableMetadata.indexOf("  - role: internal_dashboard_readonly"),
      tableMetadata.indexOf(
        "  - role: service",
        tableMetadata.indexOf("select_permissions:"),
      ),
    );
    expect(readPermission).toContain("asset_snapshot_repair_attempt_count");
    expect(readPermission).toContain("asset_snapshot_repair_dead_lettered_at");
    expect(readPermission).toContain("asset_snapshot_repair_last_error");
    expect(readPermission).toContain("asset_snapshot_repair_next_at");
  });
});
