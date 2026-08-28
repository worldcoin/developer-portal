import { readFileSync } from "fs";
import path from "path";

const migrationDirectory = path.join(
  __dirname,
  "../../../hasura/migrations/default/1789408800000_reconcile_listing_review_capture",
);
const up = readFileSync(path.join(migrationDirectory, "up.sql"), "utf8");
const down = readFileSync(path.join(migrationDirectory, "down.sql"), "utf8");

describe("listing review capture reconciliation", () => {
  it("waits on the capture advisory lock before reading the exact manifest", () => {
    expect(up).toContain(
      "pg_advisory_xact_lock(hashtextextended(p_app_metadata_id, 0))",
    );
    expect(up.indexOf("pg_advisory_xact_lock")).toBeLessThan(
      up.indexOf("FROM public.app_review_submission AS submission"),
    );
    expect(up).toContain("submission.asset_snapshot = p_asset_snapshot");
  });

  it("removes the reconciliation function on rollback", () => {
    expect(down).toContain(
      "DROP FUNCTION public.reconcile_listing_review_submission_capture(text, jsonb)",
    );
  });

  it("waits on the repair setter's submission and metadata locks", () => {
    expect(up).toContain("reconcile_app_review_asset_snapshot_repair");
    expect(up).toMatch(
      /FROM public\.app_review_submission AS candidate[\s\S]*FOR UPDATE[\s\S]*FROM public\.app_metadata AS metadata[\s\S]*FOR UPDATE[\s\S]*submission\.asset_snapshot = p_asset_snapshot/,
    );
    expect(down).toContain(
      "DROP FUNCTION public.reconcile_app_review_asset_snapshot_repair(uuid, jsonb)",
    );
  });
});
