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
const submissionOperationMigrationPath = path.join(
  repoRoot,
  "hasura/migrations/default/1787940000000_capture_listing_review_submissions/up.sql",
);
const functionsPath = path.join(
  repoRoot,
  "hasura/metadata/databases/default/functions",
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

const rolePermission = (
  metadata: string,
  sectionName: string,
  role: string,
) => {
  const section = permissionSection(metadata, sectionName);
  const start = section.indexOf(`  - role: ${role}`);
  if (start === -1) return "";

  const end = section.indexOf("\n  - role:", start + 1);
  return end === -1 ? section.slice(start) : section.slice(start, end);
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
    expect(migration).toContain('"app_metadata_id" varchar NOT NULL');
    expect(migration).not.toContain('FOREIGN KEY ("app_metadata_id")');
    expect(migration).not.toContain("ON DELETE cascade");
    expect(migration).not.toContain("ON DELETE set null");
    expect(migration).toContain(
      'FOREIGN KEY ("app_id") REFERENCES "public"."app" ("id")\n        ON UPDATE restrict ON DELETE restrict',
    );
    expect(migration).toContain(
      'FOREIGN KEY ("team_id") REFERENCES "public"."team" ("id")\n        ON UPDATE restrict ON DELETE restrict',
    );
    expect(
      migration.match(
        /REFERENCES "public"\."app_review_submission" \("id"\)\n        ON UPDATE restrict ON DELETE restrict/g,
      ),
    ).toHaveLength(2);
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
    expect(migration).toContain("COALESCE(metadata.\"changelog\", '')");
    expect(migration).toContain(
      'CREATE UNIQUE INDEX "app_review_event_one_submitted_per_submission"',
    );
    expect(migration).toMatch(
      /INSERT INTO "public"\."app_review_event"[\s\S]*'submitted'[\s\S]*jsonb_build_object\('backfilled', true\)[\s\S]*submission\."submitted_at"[\s\S]*ON CONFLICT DO NOTHING/,
    );
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

describe("listing review submission database operations", () => {
  const migration = readOptional(submissionOperationMigrationPath);
  const withdrawOperation = migration.slice(
    migration.indexOf(
      "CREATE OR REPLACE FUNCTION public.withdraw_listing_review_submission",
    ),
  );

  it("captures metadata state, a monotonic attempt, event, and outbox atomically", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.capture_listing_review_submission",
    );
    expect(migration.match(/SECURITY INVOKER/g)).toHaveLength(2);
    expect(migration).toMatch(/FROM public\.app_metadata[\s\S]*FOR UPDATE/);
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain("p_expected_metadata_updated_at");
    expect(migration).toContain("p_expected_localizations_snapshot");
    expect(migration).toContain("metadata.updated_at IS DISTINCT FROM");
    expect(migration).toContain("localizations_snapshot IS DISTINCT FROM");
    expect(migration).toMatch(
      /COALESCE\(MAX\(previous_submission\.attempt\), 0\) \+ 1/,
    );
    expect(migration).toContain("to_jsonb(metadata)");
    expect(migration).toContain("jsonb_agg");
    expect(migration).toContain(
      "ORDER BY localization.locale, localization.id",
    );
    expect(migration).toContain("verification_status = 'awaiting_review'");
    expect(migration).toContain("review_message = ''");
    expect(migration).toContain("reviewed_by = ''");
    expect(migration).toContain("verified_at = NULL");
    expect(migration).toContain("is_reviewer_app_store_approved = false");
    expect(migration).toContain("is_reviewer_world_app_approved = false");
    expect(migration).toContain("INSERT INTO public.app_review_submission");
    expect(migration).toContain("INSERT INTO public.app_review_event");
    expect(migration).toContain("'submitted'");
    expect(migration).toContain("INSERT INTO public.app_review_notification");
    expect(migration).toContain("'submission_received'");
    expect(migration).toContain("'slack'");
    expect(migration).toContain("ON CONFLICT (dedupe_key) DO NOTHING");
  });

  it("locks the app and every existing localization through capture commit", () => {
    expect(migration).toMatch(
      /SELECT candidate\.\*\s+INTO app\s+FROM public\.app AS candidate\s+WHERE candidate\.id = metadata\.app_id\s+FOR UPDATE;/,
    );
    expect(migration).toMatch(
      /FROM \(\s+SELECT localization\.\*[\s\S]*?FROM public\.localisations AS localization[\s\S]*?WHERE localization\.app_metadata_id = p_app_metadata_id[\s\S]*?FOR UPDATE\s+\) AS locked_localization/,
    );
    expect(migration).toContain(
      "The parent metadata row lock blocks new localization inserts",
    );
  });

  it("guards listing eligibility inside the transaction", () => {
    expect(migration).toContain("app.is_staging");
    expect(migration).toContain(
      "metadata.app_mode NOT IN ('mini-app', 'external')",
    );
    expect(migration).toContain("p_listing_consent IS NOT TRUE");
    expect(migration).toContain(
      "metadata.verification_status IS DISTINCT FROM 'unverified'",
    );
    expect(migration).toContain("app.deleted_at IS NOT NULL");
  });

  it("withdraws only the exact active attempt and appends history", () => {
    expect(withdrawOperation).toContain(
      "CREATE OR REPLACE FUNCTION public.withdraw_listing_review_submission",
    );
    expect(withdrawOperation).toContain(
      "candidate.app_metadata_id = p_app_metadata_id",
    );
    expect(withdrawOperation).toContain(
      "candidate.status IN ('pending', 'in_review')",
    );
    expect(withdrawOperation).toMatch(
      /SET status = 'withdrawn',[\s\S]*review_version = review_version \+ 1,[\s\S]*RETURNING \* INTO submission;[\s\S]*submission\.review_version/,
    );
    expect(withdrawOperation).toContain("event_type");
    expect(withdrawOperation).toContain("'withdrawn'");
    expect(withdrawOperation).not.toContain(
      "DELETE FROM public.app_review_submission",
    );
  });

  it("recovers changes-requested metadata without changing terminal review history", () => {
    expect(withdrawOperation).toContain(
      "metadata.verification_status NOT IN ('awaiting_review', 'changes_requested')",
    );
    expect(withdrawOperation).toMatch(
      /UPDATE public\.app_metadata[\s\S]*verification_status = 'unverified'[\s\S]*IF metadata\.verification_status = 'changes_requested' THEN\s+RETURN;\s+END IF;[\s\S]*SELECT candidate\.\*[\s\S]*INTO submission/,
    );
  });

  it("refuses to withdraw verified metadata before changing it", () => {
    expect(withdrawOperation).toMatch(
      /metadata\.verification_status IS NULL\s+OR metadata\.verification_status NOT IN \('awaiting_review', 'changes_requested'\)[\s\S]*RAISE EXCEPTION[\s\S]*UPDATE public\.app_metadata/,
    );
  });

  it("tracks both operations as service-only Hasura mutations", () => {
    const functions = readOptional(path.join(functionsPath, "functions.yaml"));
    const capture = readOptional(
      path.join(functionsPath, "public_capture_listing_review_submission.yaml"),
    );
    const withdraw = readOptional(
      path.join(
        functionsPath,
        "public_withdraw_listing_review_submission.yaml",
      ),
    );

    expect(functions).toContain(
      "public_capture_listing_review_submission.yaml",
    );
    expect(functions).toContain(
      "public_withdraw_listing_review_submission.yaml",
    );
    for (const metadata of [capture, withdraw]) {
      expect(metadata).toContain("exposed_as: mutation");
      expect(metadata).toContain("- role: service");
      expect(metadata).not.toContain("internal_dashboard_readonly");
    }
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
    expect(appMetadata).toContain("manual_configuration:");
    expect(appMetadata).toContain("id: app_metadata_id");

    const submission = readTable("app_review_submission");
    expect(submission).toContain("- name: app_metadata");
    expect(submission).toContain("manual_configuration:");
    expect(submission).toContain("app_metadata_id: id");
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
      const selects = rolePermission(
        metadata,
        "select_permissions",
        "internal_dashboard_readonly",
      );

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
        expect(
          rolePermission(metadata, mutation, "internal_dashboard_readonly"),
        ).toBe("");
      }
    },
  );

  it("does not leak service-only submission fields into dashboard reads", () => {
    const metadata = readTable("app_review_submission");
    const dashboard = rolePermission(
      metadata,
      "select_permissions",
      "internal_dashboard_readonly",
    );
    const service = rolePermission(metadata, "select_permissions", "service");

    expect(dashboard).not.toContain("- claim_token");
    expect(dashboard).not.toContain("- claimed_by_subject");
    expect(dashboard).not.toContain("- decided_by_subject");
    expect(service).toContain("- claim_token");
    expect(service).toContain("- claimed_by_subject");
    expect(service).toContain("- decided_by_subject");
  });

  it("keeps events append-only even for the service role", () => {
    const metadata = readTable("app_review_event");

    expect(rolePermission(metadata, "insert_permissions", "service")).not.toBe(
      "",
    );
    expect(rolePermission(metadata, "select_permissions", "service")).not.toBe(
      "",
    );
    expect(rolePermission(metadata, "update_permissions", "service")).toBe("");
    expect(rolePermission(metadata, "delete_permissions", "service")).toBe("");
  });

  it("limits notification mutations to delivery state for the service role", () => {
    const metadata = readTable("app_review_notification");
    const updates = rolePermission(metadata, "update_permissions", "service");

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
    expect(rolePermission(metadata, "delete_permissions", "service")).toBe("");
  });
});
