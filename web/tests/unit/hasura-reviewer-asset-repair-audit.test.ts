import { readFileSync } from "fs";
import path from "path";

const repositoryRoot = path.join(__dirname, "../../..");
const read = (relativePath: string) =>
  readFileSync(path.join(repositoryRoot, relativePath), "utf8");

const up = read(
  "hasura/migrations/default/1789927200000_audit_reviewer_asset_repairs/up.sql",
);
const down = read(
  "hasura/migrations/default/1789927200000_audit_reviewer_asset_repairs/down.sql",
);
const metadata = read(
  "hasura/metadata/databases/default/functions/public_reviewer_begin_app_review_asset_snapshot_repair.yaml",
);

describe("reviewer asset repair audit", () => {
  it("records a durable system event before storage work", () => {
    expect(up).toContain(
      "CREATE FUNCTION public.reviewer_begin_app_review_asset_snapshot_repair",
    );
    expect(up).toMatch(
      /pg_advisory_xact_lock[\s\S]*FROM public\.app_metadata[\s\S]*FOR UPDATE[\s\S]*FROM public\.app_review_submission[\s\S]*FOR UPDATE/,
    );
    expect(up).toContain("'asset_snapshot_repair_attempted'");
    expect(up).toContain("'system:asset-snapshot-repair'");
    expect(up).toContain("'operation_id', p_operation_id");
  });

  it("appends success, failure, and dead-letter outcomes", () => {
    expect(up).toContain("'asset_snapshot_repair_succeeded'");
    expect(up).toContain("'asset_snapshot_repair_failed'");
    expect(up).toContain("'asset_snapshot_repair_dead_lettered'");
    expect(up).toContain(
      "CREATE TRIGGER audit_app_review_asset_snapshot_repair_outcome",
    );
  });

  it("exposes begin only to the service role and rolls back cleanly", () => {
    expect(metadata).toContain(
      "name: reviewer_begin_app_review_asset_snapshot_repair",
    );
    expect(metadata).toContain("role: service");
    expect(metadata).not.toContain("role: internal_dashboard_readonly");
    expect(down).toContain(
      "DROP FUNCTION IF EXISTS public.reviewer_begin_app_review_asset_snapshot_repair",
    );
    expect(down).toContain("immutable repair audit rows remain");
    expect(down).not.toContain("DELETE FROM public.app_review_event");
  });
});
