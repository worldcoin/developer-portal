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
    const deleteSection = metadata.slice(
      metadata.indexOf("delete_permissions:"),
    );
    expect(updateSection).not.toContain("role: service");
    expect(deleteSection).not.toContain("role: service");
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
