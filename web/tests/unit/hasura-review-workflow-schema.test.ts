import { existsSync, readFileSync } from "fs";
import path from "path";

const repoRoot = path.join(__dirname, "../../..");
const migrationPath = path.join(
  repoRoot,
  "hasura/migrations/default/1787863600000_create_app_review_workflow/up.sql",
);
const downMigrationPath = path.join(
  repoRoot,
  "hasura/migrations/default/1787863600000_create_app_review_workflow/down.sql",
);
const tablesPath = path.join(
  repoRoot,
  "hasura/metadata/databases/default/tables",
);

const readTable = (name: string) =>
  readOptional(path.join(tablesPath, `public_${name}.yaml`));

const readOptional = (filename: string) =>
  existsSync(filename) ? readFileSync(filename, "utf8") : "";

const permissionSection = (metadata: string, sectionName: string) => {
  const start = metadata.indexOf(`${sectionName}:`);
  if (start === -1) return "";

  const remainder = metadata.slice(start + sectionName.length + 1);
  const nextSection = remainder.search(/^[a-z_]+:/m);
  return nextSection === -1
    ? metadata.slice(start)
    : metadata.slice(start, start + sectionName.length + 1 + nextSection);
};

describe("review workflow migration", () => {
  const migration = readOptional(migrationPath);

  it("creates constrained submission, event, and notification records", () => {
    expect(migration).toContain(
      'CREATE TABLE "public"."app_review_submission"',
    );
    expect(migration).toContain('CREATE TABLE "public"."app_review_event"');
    expect(migration).toContain(
      'CREATE TABLE "public"."app_review_notification"',
    );

    for (const column of [
      "app_metadata_id",
      "app_id",
      "team_id",
      "attempt",
      "status",
      "app_mode",
      "listing_target",
      "listing_consent",
      "changelog",
      "submitted_at",
      "metadata_updated_at",
      "review_version",
      "claimed_by_subject",
      "claimed_by_email",
      "claim_token",
      "claim_expires_at",
      "checklist_version",
      "checklist",
      "metadata_snapshot",
      "localizations_snapshot",
      "decision_summary",
      "completed_at",
    ]) {
      expect(migration).toContain(`"${column}"`);
    }

    expect(
      migration.match(/"id" uuid NOT NULL DEFAULT gen_random_uuid \(\)/g),
    ).toHaveLength(3);
    expect(migration).toContain('CHECK ("attempt" > 0)');
    expect(migration).toContain('CHECK ("review_version" > 0)');
    expect(migration).toContain("'pending'");
    expect(migration).toContain("'in_review'");
    expect(migration).toContain("'changes_requested'");
    expect(migration).toContain("'approved'");
    expect(migration).toContain("'withdrawn'");
    expect(migration).not.toContain("'rejected'");
    expect(migration).toContain("'mini-app'");
    expect(migration).toContain("'external'");
    expect(migration).toContain("'mini_app_store'");
    expect(migration).toContain("'world_ecosystem'");
    expect(migration).toContain(
      'CREATE UNIQUE INDEX "app_review_submission_one_active_metadata"',
    );
    expect(migration).toContain("WHERE \"status\" IN ('pending', 'in_review')");
  });

  it("backfills only eligible production listing reviews idempotently", () => {
    expect(migration).toContain('INSERT INTO "public"."app_review_submission"');
    expect(migration).toContain('metadata."updated_at"');
    expect(migration).toContain('app."is_staging" = false');
    expect(migration).toContain(
      "metadata.\"verification_status\" = 'awaiting_review'",
    );
    expect(migration).toContain('metadata."is_developer_allow_listing" = true');
    expect(migration).toContain(
      "metadata.\"app_mode\" IN ('mini-app', 'external')",
    );
    expect(migration).toContain("ON CONFLICT DO NOTHING");
    expect(migration).toContain("to_jsonb(metadata)");
    expect(migration).toContain("jsonb_agg");
    expect(migration).toContain('app."team_id"');
    expect(migration).toContain('metadata."is_developer_allow_listing"');
    expect(migration).toContain('metadata."changelog"');
  });

  it("drops dependent outbox and event tables before submissions", () => {
    const downMigration = readOptional(downMigrationPath);
    const notificationDrop = downMigration.indexOf(
      'DROP TABLE "public"."app_review_notification"',
    );
    const eventDrop = downMigration.indexOf(
      'DROP TABLE "public"."app_review_event"',
    );
    const submissionDrop = downMigration.indexOf(
      'DROP TABLE "public"."app_review_submission"',
    );

    expect(notificationDrop).toBeGreaterThan(-1);
    expect(eventDrop).toBeGreaterThan(notificationDrop);
    expect(submissionDrop).toBeGreaterThan(eventDrop);
  });
});

describe("review workflow Hasura metadata", () => {
  it("tracks every review table and its parent relationships", () => {
    const tables = readFileSync(path.join(tablesPath, "tables.yaml"), "utf8");
    const app = readTable("app");
    const appMetadata = readTable("app_metadata");

    expect(tables).toContain("public_app_review_submission.yaml");
    expect(tables).toContain("public_app_review_event.yaml");
    expect(tables).toContain("public_app_review_notification.yaml");
    expect(app).toContain("- name: review_submissions");
    expect(appMetadata).toContain("- name: review_submissions");
  });

  it.each([
    [
      "app_review_submission",
      [
        "id",
        "app_metadata_id",
        "app_id",
        "team_id",
        "attempt",
        "status",
        "app_mode",
        "listing_target",
        "listing_consent",
        "changelog",
        "submitted_at",
        "review_version",
        "claim_expires_at",
        "checklist",
        "metadata_snapshot",
        "localizations_snapshot",
        "decision_summary",
      ],
    ],
    [
      "app_review_event",
      [
        "id",
        "submission_id",
        "event_type",
        "actor_email",
        "payload",
        "created_at",
      ],
    ],
    [
      "app_review_notification",
      [
        "id",
        "submission_id",
        "notification_type",
        "channel",
        "status",
        "attempt_count",
        "next_attempt_at",
        "delivered_at",
        "provider_message_id",
        "last_error",
      ],
    ],
  ])(
    "gives dashboard readers required %s fields and no writes",
    (table, columns) => {
      const metadata = readTable(table as string);
      const selects = permissionSection(metadata, "select_permissions");

      expect(selects).toContain("role: internal_dashboard_readonly");
      for (const column of columns as string[]) {
        expect(selects).toContain(`- ${column}`);
      }
      expect(selects).toContain("allow_aggregations: true");

      for (const mutation of [
        "insert_permissions",
        "update_permissions",
        "delete_permissions",
      ]) {
        expect(permissionSection(metadata, mutation)).not.toContain(
          "role: internal_dashboard_readonly",
        );
      }
    },
  );

  it("keeps events append-only even for the service role", () => {
    const metadata = readTable("app_review_event");

    expect(permissionSection(metadata, "insert_permissions")).toContain(
      "role: service",
    );
    expect(permissionSection(metadata, "select_permissions")).toContain(
      "role: service",
    );
    expect(permissionSection(metadata, "update_permissions")).not.toContain(
      "role: service",
    );
    expect(permissionSection(metadata, "delete_permissions")).not.toContain(
      "role: service",
    );
  });

  it("limits notification mutations to delivery state for the service role", () => {
    const metadata = readTable("app_review_notification");
    const updates = permissionSection(metadata, "update_permissions");

    expect(updates).toContain("role: service");
    for (const column of [
      "status",
      "attempt_count",
      "next_attempt_at",
      "locked_at",
      "locked_by",
      "last_attempt_at",
      "delivered_at",
      "last_error",
    ]) {
      expect(updates).toContain(`- ${column}`);
    }
    expect(updates).not.toContain("- submission_id");
    expect(updates).not.toContain("- notification_type");
    expect(updates).not.toContain("- channel");
    expect(updates).not.toContain("- payload");
    expect(permissionSection(metadata, "delete_permissions")).not.toContain(
      "role: service",
    );
  });
});
