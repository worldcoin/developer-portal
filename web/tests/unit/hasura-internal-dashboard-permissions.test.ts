import { readFileSync } from "fs";
import path from "path";

const tablesPath = path.join(
  __dirname,
  "../../..",
  "hasura/metadata/databases/default/tables",
);

const getReadonlyPermission = (filename: string) => {
  const metadata = readFileSync(path.join(tablesPath, filename), "utf8");
  const start = metadata.indexOf("  - role: internal_dashboard_readonly");
  const end = metadata.indexOf("\n  - role:", start + 1);

  return end === -1 ? metadata.slice(start) : metadata.slice(start, end);
};

describe("internal dashboard detail permissions", () => {
  it("allows only team member fields needed by the detail page", () => {
    const permission = getReadonlyPermission("public_membership.yaml");

    expect(permission).toContain("- id");
    expect(permission).toContain("- role");
    expect(permission).toContain("- team_id");
    expect(permission).toContain("- user_id");
    expect(permission).not.toContain("- created_at");
    expect(permission).not.toContain("- updated_at");
  });

  it("allows invite identity and expiry for internal support", () => {
    const permission = getReadonlyPermission("public_invite.yaml");

    expect(permission).toContain("- id");
    expect(permission).toContain("- email");
    expect(permission).toContain("- expires_at");
    expect(permission).toContain("allow_aggregations: true");
  });

  it("allows API key inventory fields but never the API key secret", () => {
    const permission = getReadonlyPermission("public_api_key.yaml");

    expect(permission).toContain("- id");
    expect(permission).toContain("- name");
    expect(permission).toContain("- created_at");
    expect(permission).toContain("- updated_at");
    expect(permission).toContain("- is_active");
    expect(permission).not.toContain("- api_key");
  });

  it("allows RP registration reads without manager KMS key IDs", () => {
    const permission = getReadonlyPermission("public_rp_registration.yaml");

    expect(permission).toContain("- rp_id");
    expect(permission).toContain("- app_id");
    expect(permission).toContain("- mode");
    expect(permission).toContain("- status");
    expect(permission).toContain("- staging_status");
    expect(permission).toContain("- signer_address");
    expect(permission).toContain("- operation_hash");
    expect(permission).toContain("- staging_operation_hash");
    expect(permission).toContain("- is_unique_manager_key");
    expect(permission).toContain("allow_aggregations: true");
    expect(permission).not.toContain("- manager_kms_key_id");
  });

  it("allows legacy action aggregates without exposing nullifier identity", () => {
    const actionPermission = getReadonlyPermission("public_action.yaml");
    const nullifierPermission = getReadonlyPermission("public_nullifier.yaml");

    expect(actionPermission).toContain("- action");
    expect(actionPermission).toContain("- app_id");
    expect(actionPermission).toContain("- name");
    expect(actionPermission).toContain("- status");
    expect(actionPermission).toContain("allow_aggregations: true");
    expect(actionPermission).not.toContain("- client_secret");
    expect(actionPermission).not.toContain("- external_nullifier");

    expect(nullifierPermission).toContain("- uses");
    expect(nullifierPermission).toContain("allow_aggregations: true");
    expect(nullifierPermission).not.toContain("- id");
    expect(nullifierPermission).not.toContain("- nullifier_hash");
    expect(nullifierPermission).not.toContain("- nullifier_hash_int");
  });

  it("allows World ID 4.0 counts without exposing nullifier values", () => {
    const actionPermission = getReadonlyPermission("public_action_v4.yaml");
    const nullifierPermission = getReadonlyPermission(
      "public_nullifier_v4.yaml",
    );

    expect(actionPermission).toContain("- action");
    expect(actionPermission).toContain("- environment");
    expect(actionPermission).toContain("- rp_id");
    expect(actionPermission).toContain("allow_aggregations: true");

    expect(nullifierPermission).toContain("- action_v4_id");
    expect(nullifierPermission).toContain("allow_aggregations: true");
    expect(nullifierPermission).not.toContain("- id");
    expect(nullifierPermission).not.toMatch(/^\s+- nullifier$/m);
  });

  it("lets dashboard readers update only sandbox invite processing fields", () => {
    const metadata = readFileSync(
      path.join(tablesPath, "public_sandbox_access_request.yaml"),
      "utf8",
    );
    const updatePermissionsStart = metadata.indexOf("update_permissions:");
    const start = metadata.indexOf(
      "  - role: internal_dashboard_readonly",
      updatePermissionsStart,
    );
    const end = metadata.indexOf("\n  - role:", start + 1);
    const permission = metadata.slice(start, end);

    expect(permission).toContain("- accepted");
    expect(permission).toContain("- processed_at");
    expect(permission).not.toContain("- google_email");
    expect(permission).not.toContain("- user_id");
    expect(metadata).not.toContain("internal_dashboard_sandbox_writer");

    const insertSection = metadata.slice(
      metadata.indexOf("insert_permissions:"),
      metadata.indexOf("select_permissions:"),
    );
    expect(insertSection).toContain("- google_email");
    expect(insertSection).toContain("- user_id");
    expect(insertSection).not.toContain("- accepted");
    expect(insertSection).not.toContain("- processed_at");

    const updateSection = metadata.slice(
      updatePermissionsStart,
      metadata.indexOf("delete_permissions:"),
    );
    const serviceUpdateStart = updateSection.indexOf("  - role: service");
    const serviceUpdatePermission = updateSection.slice(serviceUpdateStart);
    const deleteSection = metadata.slice(
      metadata.indexOf("delete_permissions:"),
    );

    // The service role needs an update permission for Hasura to expose the
    // no-op `on_conflict` used by the insert mutation. Its impossible primary
    // key filter prevents the role from updating an existing request.
    expect(serviceUpdateStart).toBeGreaterThan(-1);
    expect(serviceUpdatePermission).toContain("- google_email");
    expect(serviceUpdatePermission).not.toContain("- accepted");
    expect(serviceUpdatePermission).not.toContain("- processed_at");
    expect(serviceUpdatePermission).toContain("_is_null: true");
    expect(deleteSection).not.toContain("role: service");
  });

  it("limits iOS sandbox request writes to enrollment workflow fields", () => {
    const metadata = readFileSync(
      path.join(tablesPath, "public_sandbox_access_request_ios.yaml"),
      "utf8",
    );
    const insertSection = metadata.slice(
      metadata.indexOf("insert_permissions:"),
      metadata.indexOf("select_permissions:"),
    );
    const updateSection = metadata.slice(
      metadata.indexOf("update_permissions:"),
      metadata.indexOf("delete_permissions:"),
    );
    const serviceUpdateStart = updateSection.indexOf("  - role: service");
    const dashboardUpdatePermission = updateSection.slice(
      0,
      serviceUpdateStart,
    );
    const serviceUpdatePermission = updateSection.slice(serviceUpdateStart);
    const deleteSection = metadata.slice(
      metadata.indexOf("delete_permissions:"),
    );

    expect(insertSection).toContain("- asc_email");
    expect(insertSection).toContain("- portal_email");
    expect(insertSection).toContain("- team_id");
    expect(insertSection).toContain("- user_id");
    expect(insertSection).not.toContain("- status");
    expect(dashboardUpdatePermission).toContain("- status");
    expect(dashboardUpdatePermission).toContain("- approved_at");
    expect(dashboardUpdatePermission).toContain("- rejection_reason");
    expect(dashboardUpdatePermission).toContain("- revoked_at");
    expect(dashboardUpdatePermission).not.toContain("- approved_by");
    expect(dashboardUpdatePermission).not.toContain("- revoked_by");
    expect(dashboardUpdatePermission).not.toContain("- asc_email");
    expect(dashboardUpdatePermission).not.toContain("- portal_email");

    // The service role's only update is the re-request upsert: it may reopen
    // a rejected request as pending, but never touch ownership or the
    // approval/revocation audit fields, and never rows in any other status.
    expect(serviceUpdateStart).toBeGreaterThan(-1);
    expect(serviceUpdatePermission).toContain("- asc_email");
    expect(serviceUpdatePermission).toContain("- portal_email");
    expect(serviceUpdatePermission).toContain("- team_id");
    expect(serviceUpdatePermission).toContain("- status");
    expect(serviceUpdatePermission).toContain("- rejection_reason");
    expect(serviceUpdatePermission).toContain("- created_at");
    expect(serviceUpdatePermission).not.toContain("- user_id");
    expect(serviceUpdatePermission).not.toContain("- approved_at");
    expect(serviceUpdatePermission).not.toContain("- revoked_at");
    expect(serviceUpdatePermission).toContain("_eq: rejected");
    expect(serviceUpdatePermission).toContain("X-Hasura-User-Id");
    expect(serviceUpdatePermission).toContain("_eq: pending");
    expect(deleteSection).toContain("_eq: pending");
    expect(deleteSection).not.toContain("role: service");
    expect(metadata).toContain("- name: team");
    expect(metadata).toContain("foreign_key_constraint_on: team_id");
    expect(metadata).toContain("- revoked_at");
    expect(metadata).not.toContain("- approved_by");
    expect(metadata).not.toContain("- revoked_by");
    const serviceSelectPermission = metadata.slice(
      metadata.indexOf(
        "  - role: service",
        metadata.indexOf("select_permissions:"),
      ),
      metadata.indexOf("update_permissions:"),
    );
    expect(serviceSelectPermission).not.toContain("- revoked_at");
    expect(serviceSelectPermission).not.toContain("- revoked_by");
  });

  it("creates the complete iOS access-request schema in one migration", () => {
    const migration = readFileSync(
      path.join(
        tablesPath,
        "../../../../migrations/default/1787346730000_create_table_public_sandbox_access_request_ios/up.sql",
      ),
      "utf8",
    );

    expect(migration).toContain("'approving'");
    expect(migration).toContain("'revoking'");
    expect(migration).toContain("'revoked'");
    expect(migration).toContain('lower(btrim("asc_email"))');
    expect(migration).toContain(
      'CONSTRAINT "unique_sandbox_access_request_ios_asc_email"',
    );
    expect(migration).toContain(
      'CONSTRAINT "sandbox_access_request_ios_asc_email_is_canonical"',
    );
    expect(migration).toContain('"approved_at" IS NOT NULL');
    expect(migration).toContain('"revoked_at" IS NOT NULL');
    expect(migration).toContain('"revoked_at" IS NULL');
    expect(migration).not.toContain('"approved_by"');
    expect(migration).not.toContain('"revoked_by"');
    expect(migration).toContain("\"status\" = 'rejected'");
    expect(migration).toContain('"rejection_reason" IS NULL');
  });

  it("does not define elevated internal dashboard roles", () => {
    const inheritedRoles = readFileSync(
      path.join(tablesPath, "../../../inherited_roles.yaml"),
      "utf8",
    );

    expect(inheritedRoles.trim()).toBe("[]");
  });
});

describe("admin RP inventory native query", () => {
  it("counts unique and shared manager keys only when a KMS key exists", () => {
    const databases = readFileSync(
      path.join(tablesPath, "../../databases.yaml"),
      "utf8",
    );
    const start = databases.indexOf("root_field_name: admin_rp_inventory");
    const end = databases.indexOf("returns: admin_rp_inventory", start);
    const sql = databases.slice(start, end);

    const uniqueFilter = sql.match(
      /COUNT\(\*\) FILTER \(\s*WHERE[\s\S]*?\)::bigint AS unique_manager_key_rps/,
    )?.[0];
    const sharedFilter = sql.match(
      /COUNT\(\*\) FILTER \(\s*WHERE[\s\S]*?\)::bigint AS shared_manager_key_rps/,
    )?.[0];

    expect(uniqueFilter).toContain("is_unique_manager_key = true");
    expect(uniqueFilter).toContain("manager_kms_key_id IS NOT NULL");
    expect(sharedFilter).toContain("is_unique_manager_key = false");
    expect(sharedFilter).toContain("manager_kms_key_id IS NOT NULL");
  });
});
