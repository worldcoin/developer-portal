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

  it("limits sandbox writes to invite processing fields", () => {
    const metadata = readFileSync(
      path.join(tablesPath, "public_sandbox_access_request.yaml"),
      "utf8",
    );
    const start = metadata.indexOf(
      "  - role: internal_dashboard_sandbox_writer",
    );
    const end = metadata.indexOf("\n  - role:", start + 1);
    const permission = metadata.slice(start, end);

    expect(permission).toContain("- accepted");
    expect(permission).toContain("- processed_at");
    expect(permission).not.toContain("- google_email");
    expect(permission).not.toContain("- user_id");
  });

  it("combines read and sandbox-write permissions for dashboard writers", () => {
    const inheritedRoles = readFileSync(
      path.join(tablesPath, "../../../inherited_roles.yaml"),
      "utf8",
    );

    expect(inheritedRoles).toContain("role_name: internal_dashboard_write");
    expect(inheritedRoles).toContain("- internal_dashboard_readonly");
    expect(inheritedRoles).toContain("- internal_dashboard_sandbox_writer");
  });
});
