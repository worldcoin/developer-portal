import { readFileSync } from "fs";
import path from "path";

const repoRoot = path.join(__dirname, "../../..");
const migrationDirectory = path.join(
  repoRoot,
  "hasura/migrations/default/1788458400000_withdraw_reviews_on_app_deletion",
);

describe("review workflow app deletion cleanup", () => {
  const up = readFileSync(path.join(migrationDirectory, "up.sql"), "utf8");
  const down = readFileSync(path.join(migrationDirectory, "down.sql"), "utf8");

  it("atomically withdraws active reviews and appends a system event", () => {
    expect(up).toContain("withdraw_app_reviews_on_soft_delete");
    expect(up).toContain("BEFORE UPDATE OF deleted_at ON public.app");
    expect(up).toContain("status IN ('pending', 'in_review')");
    expect(up).toContain("status = 'withdrawn'");
    expect(up).toContain("review_version = review_version + 1");
    expect(up).toContain("claim_token = NULL");
    expect(up).toContain("verification_status = 'unverified'");
    expect(up).toContain("'system:app-deletion'");
    expect(up).toMatch(/jsonb_build_object\([\s\S]*'reason', 'app_deleted'/);
  });

  it("also withdraws active reviews when their team is soft-deleted", () => {
    expect(up).toContain("withdraw_team_reviews_on_soft_delete");
    expect(up).toContain("BEFORE UPDATE OF deleted_at ON public.team");
    expect(up).toContain("team_id = NEW.id");
    expect(up).toContain("'system:team-deletion'");
    expect(up).toContain("'reason', 'team_deleted'");
  });

  it("reconciles reviews whose app or team was deleted before the triggers landed", () => {
    expect(up).toContain("system:rollout-deletion-reconciliation");
    expect(up).toContain("reviewed_app.deleted_at IS NOT NULL");
    expect(up).toContain("owning_team.deleted_at IS NOT NULL");
    expect(up).toContain("rollout_reconciliation");
  });

  it("removes the trigger before its function on rollback", () => {
    expect(down).toMatch(
      /DROP TRIGGER withdraw_team_reviews_on_soft_delete[\s\S]*DROP FUNCTION public\.withdraw_team_reviews_on_soft_delete/,
    );
    expect(down).toMatch(
      /DROP TRIGGER withdraw_app_reviews_on_soft_delete[\s\S]*DROP FUNCTION public\.withdraw_app_reviews_on_soft_delete/,
    );
  });
});
