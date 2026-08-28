import { readFileSync } from "fs";
import path from "path";

const repositoryRoot = path.join(__dirname, "../../..");
const read = (relativePath: string) =>
  readFileSync(path.join(repositoryRoot, relativePath), "utf8");

const migration = read(
  "hasura/migrations/default/1789495200000_require_publishable_app_state_for_review/up.sql",
);
const down = read(
  "hasura/migrations/default/1789495200000_require_publishable_app_state_for_review/down.sql",
);

describe("reviewer app availability fences", () => {
  it("requires active, unarchived state during capture and approval", () => {
    expect(migration).toContain(
      "reviewed_app_status IS DISTINCT FROM 'active'",
    );
    expect(migration).toContain(
      "reviewed_app_is_archived IS DISTINCT FROM false",
    );
    expect(migration).toContain("guard_reviewer_approval_publishable_app");
    expect(
      read(
        "hasura/migrations/default/1788112800000_add_reviewer_decisions/up.sql",
      ),
    ).toMatch(
      /reviewed_app\.status IS DISTINCT FROM 'active'[\s\S]*reviewed_app\.is_archived IS DISTINCT FROM false/,
    );
  });

  it("requires explicit withdrawal before an owner disables a reviewed app", () => {
    expect(migration).toContain("guard_active_app_review_publishable_state");
    expect(migration).toContain("status IN ('pending', 'in_review')");
    expect(migration).toContain(
      "Withdraw the active listing review before deactivating or archiving this app.",
    );
  });

  it("filters unavailable apps from catalogs without breaking direct deeplinks", () => {
    const catalog = read("web/api/v2/public/apps/index.ts");
    expect(catalog).toContain('{ status: { _eq: "active" } }');
    expect(catalog).toContain("{ is_archived: { _eq: false } }");

    const appQuery = read(
      "web/api/v2/public/app/[app_id]/graphql/get-app-metadata.graphql",
    );
    expect(appQuery).toContain("is_banned: { _eq: false }");
    expect(appQuery).not.toContain('status: { _eq: "active" }');
    expect(appQuery).not.toContain("is_archived: { _eq: false }");
    expect(appQuery).not.toContain("deleted_at: { _is_null: true }");
  });

  it("restores the prior capture function and drops both guards", () => {
    expect(down).toContain(
      "DROP TRIGGER IF EXISTS guard_active_app_review_publishable_state",
    );
    expect(down).toContain(
      "DROP TRIGGER IF EXISTS guard_reviewer_approval_publishable_app",
    );
    expect(down).toContain("RENAME TO capture_listing_review_submission");
  });
});
