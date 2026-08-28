import { readFileSync } from "fs";
import path from "path";

const root = path.join(__dirname, "../../..");
const read = (relativePath: string) =>
  readFileSync(path.join(root, relativePath), "utf8");
const up = read(
  "hasura/migrations/default/1789754400000_atomic_mcp_metadata_edits/up.sql",
);
const down = read(
  "hasura/migrations/default/1789754400000_atomic_mcp_metadata_edits/down.sql",
);

describe("atomic MCP metadata edits", () => {
  it("uses an exact CAS and reopens only after a nonempty patch commits", () => {
    expect(up).toContain("p_patch = '{}'::jsonb");
    expect(up).toContain(
      "metadata.updated_at IS DISTINCT FROM p_expected_metadata_updated_at",
    );
    expect(up).toMatch(
      /UPDATE public\.app_metadata[\s\S]*RETURNING \* INTO updated_metadata;[\s\S]*IF metadata\.verification_status = 'changes_requested'[\s\S]*'draft_reopened'/,
    );
    expect(up).toContain("'edit_committed', true");
  });

  it("restricts the JSON patch and tracks the function for service only", () => {
    expect(up).toContain(
      "MCP metadata patch contains a field that is not editable.",
    );
    const functionMetadata = read(
      "hasura/metadata/databases/default/functions/public_mcp_patch_editable_app_metadata.yaml",
    );
    expect(functionMetadata).toContain("exposed_as: mutation");
    expect(functionMetadata).toMatch(/permissions:\s+- role: service/);
    expect(functionMetadata).not.toContain("role: user");
  });

  it("routes the imported MCP update SDK through the atomic function", () => {
    const operation = read("web/api/mcp/graphql/update-app-metadata.graphql");
    expect(operation).toContain("mcp_patch_editable_app_metadata");
    expect(operation).toContain("p_expected_metadata_updated_at");
    expect(operation).toContain("p_actor_subject");
    const generatedOperation = read(
      "web/api/mcp/graphql/update-app-metadata.generated.ts",
    );
    expect(generatedOperation).toContain("mcp_patch_editable_app_metadata");
    expect(generatedOperation).toContain("expected_metadata_updated_at");
    expect(down).toContain(
      "DROP FUNCTION IF EXISTS public.mcp_patch_editable_app_metadata",
    );
  });
});
