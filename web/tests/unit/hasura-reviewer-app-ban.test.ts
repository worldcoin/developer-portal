import { readFileSync } from "fs";
import path from "path";

const migration = readFileSync(
  path.join(
    __dirname,
    "../../../hasura/migrations/default/1788890400000_withdraw_reviews_on_app_ban/up.sql",
  ),
  "utf8",
);
const bridge = readFileSync(
  path.join(
    __dirname,
    "../../../hasura/migrations/default/1788717600000_bridge_uncaptured_listing_reviews/up.sql",
  ),
  "utf8",
);
const captureAvailability = readFileSync(
  path.join(
    __dirname,
    "../../../hasura/migrations/default/1789495200000_require_publishable_app_state_for_review/up.sql",
  ),
  "utf8",
);

describe("reviewer app ban invariants", () => {
  it("withdraws and audits active reviews when an app becomes banned", () => {
    expect(migration).toContain("CREATE TRIGGER withdraw_app_reviews_on_ban");
    expect(migration).toMatch(
      /OLD\.is_banned IS FALSE AND NEW\.is_banned IS DISTINCT FROM FALSE/,
    );
    expect(migration).toContain("status = 'withdrawn'");
    expect(migration).toContain("SET verification_status = 'unverified'");
    expect(migration).toContain("'system:app-ban'");
    expect(migration).toContain("'notification_dead_lettered'");
  });

  it("guards approval and excludes banned legacy transitions", () => {
    expect(migration).toContain(
      "CREATE TRIGGER guard_reviewer_approval_unbanned_app",
    );
    expect(migration).toMatch(
      /NEW\.status = 'approved'[\s\S]*reviewed_app\.is_banned IS DISTINCT FROM FALSE/,
    );
    expect(bridge).toContain("reviewed_app.is_banned IS DISTINCT FROM FALSE");
    expect(bridge).toContain("reviewed_app.is_banned IS FALSE");
    expect(captureAvailability).toContain("candidate.is_banned");
    expect(captureAvailability).toContain(
      "reviewed_app_is_banned IS DISTINCT FROM false",
    );
  });
});
