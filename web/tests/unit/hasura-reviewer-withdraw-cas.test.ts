import { readFileSync } from "fs";
import path from "path";

const repoRoot = path.join(__dirname, "../../..");
const migrationDirectory = path.join(
  repoRoot,
  "hasura/migrations/default/1788804000000_withdraw_active_review_draft_cas",
);

describe("developer review withdrawal CAS", () => {
  const up = () =>
    readFileSync(path.join(migrationDirectory, "up.sql"), "utf8");
  const down = () =>
    readFileSync(path.join(migrationDirectory, "down.sql"), "utf8");

  it("requires the exact metadata timestamp, submission, and review version", () => {
    const sql = up();
    expect(sql).toContain("developer_withdraw_active_review_draft");
    expect(sql).toContain(
      "metadata.updated_at IS DISTINCT FROM p_expected_metadata_updated_at",
    );
    expect(sql).toContain(
      "submission.id IS DISTINCT FROM p_expected_submission_id",
    );
    expect(sql).toContain(
      "submission.review_version IS DISTINCT FROM p_expected_review_version",
    );
    expect(sql).toContain("status IN ('pending', 'in_review')");
    expect(sql).toContain("event_type");
    expect(sql).toContain("'withdrawn'");
  });

  it("fences the legacy mutation away from reviewer-managed listing drafts", () => {
    const sql = up();
    expect(sql).toContain("withdraw_listing_review_submission");
    expect(sql).toMatch(/app_mode IN \('mini-app', 'external'\)/);
    expect(sql).toContain("is_developer_allow_listing IS TRUE");
  });

  it("restores the compatible legacy wrapper on rollback", () => {
    expect(down()).toContain(
      "withdraw_listing_review_submission_without_reviewer_bypass",
    );
  });
});
