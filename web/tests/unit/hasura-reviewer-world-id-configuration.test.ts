import { readFileSync } from "fs";
import path from "path";

const migrationDirectory = path.join(
  __dirname,
  "../../../hasura/migrations/default/1789236000000_freeze_world_id_configuration_during_review",
);
const up = readFileSync(path.join(migrationDirectory, "up.sql"), "utf8");
const down = readFileSync(path.join(migrationDirectory, "down.sql"), "utf8");
const metadata = readFileSync(
  path.join(
    __dirname,
    "../../../hasura/metadata/databases/default/tables/public_rp_registration.yaml",
  ),
  "utf8",
);
const configurationClaims = [
  ["rotate-signer-key/graphql/claim-rotation-slot.graphql", "signer_rotation"],
  [
    "switch-to-self-managed/graphql/claim-mode-switch-slot.graphql",
    "mode_switch",
  ],
  ["toggle-rp-active/graphql/claim-toggle-slot.graphql", "active_toggle"],
] as const;

describe("reviewer World ID configuration guard", () => {
  it("captures immutable legacy and v4 configuration for every listing review", () => {
    expect(up).toContain("world_id_configuration_snapshot jsonb");
    expect(up).toContain("build_app_review_world_id_configuration_snapshot");
    expect(up).toContain("capture_app_review_world_id_configuration_snapshot");
    expect(up).toContain("'legacy_actions'");
    expect(up).toContain("'redirects'");
    expect(up).toContain("'registrations'");
    expect(up).toContain("'lifecycle'");
    expect(up).toContain("NEW.world_id_configuration_snapshot :=");
    expect(up).toContain(
      "Submitted World ID configuration snapshots are immutable.",
    );
  });

  it("freezes submitted configuration while allowing RP lifecycle updates", () => {
    expect(up).toContain("status IN ('pending', 'in_review')");
    expect(up).toContain("BEFORE INSERT OR UPDATE OR DELETE ON public.action");
    expect(up).toContain(
      "BEFORE INSERT OR UPDATE OR DELETE ON public.redirect",
    );
    expect(up).toContain(
      "BEFORE INSERT OR UPDATE OR DELETE ON public.rp_registration",
    );
    expect(up).toContain(
      "BEFORE INSERT OR UPDATE OR DELETE ON public.action_v4",
    );
    expect(up).toContain("guarded_old_app_id");
    expect(up).toContain("guarded_new_app_id");
    expect(up).toContain(
      "NEW.signer_address IS NOT DISTINCT FROM OLD.signer_address",
    );
    expect(up).toContain(
      "Status, operation hashes, and managed-key bookkeeping are lifecycle state",
    );
    expect(up).toContain("ERRCODE = '55000'");
    expect(up).toContain(
      "World ID configuration changed after submission; the draft must be resubmitted.",
    );
  });

  it("serializes configuration writes with submission capture", () => {
    expect(up).toMatch(
      /FROM public\.app AS guarded_app[\s\S]*ORDER BY guarded_app\.id[\s\S]*FOR UPDATE/,
    );
    expect(up).toContain("reviewer.workflow_bypass");
    expect(up).toContain("public.redirect");
  });

  it("claims every externally-effectful RP change before it can race review", () => {
    expect(up).toContain("review_configuration_change_kind text");
    expect(up).toContain(
      "World ID configuration is changing; retry submission after it settles.",
    );
    expect(up).toContain("OLD.review_configuration_change_kind IS NULL");
    expect(up).toContain(
      "NEW.review_configuration_change_kind := 'legacy_unknown'",
    );
    expect(up).toContain(
      "SET review_configuration_change_kind = 'legacy_unknown'",
    );
    expect(up).toContain("NEW.review_configuration_change_kind := NULL");
    expect(metadata).toMatch(
      /update_permissions:[\s\S]*role: service[\s\S]*review_configuration_change_kind/,
    );

    for (const [relativePath, operationKind] of configurationClaims) {
      const source = readFileSync(
        path.join(__dirname, "../../api/hasura", relativePath),
        "utf8",
      );
      expect(source).toContain(
        `review_configuration_change_kind: "${operationKind}"`,
      );
      const generatedSource = readFileSync(
        path.join(
          __dirname,
          "../../api/hasura",
          relativePath.replace(".graphql", ".generated.ts"),
        ),
        "utf8",
      );
      expect(generatedSource).toContain(
        `review_configuration_change_kind: "${operationKind}"`,
      );
    }
  });

  it("removes all guards on rollback", () => {
    expect(down).toContain(
      "DROP TRIGGER IF EXISTS guard_active_app_review_action_write",
    );
    expect(down).toContain(
      "DROP TRIGGER IF EXISTS guard_active_app_review_rp_registration_write",
    );
    expect(down).toContain(
      "DROP TRIGGER IF EXISTS guard_active_app_review_action_v4_write",
    );
    expect(down).toContain(
      "DROP TRIGGER IF EXISTS guard_active_app_review_redirect_write",
    );
    expect(down).toContain(
      "DROP FUNCTION IF EXISTS public.guard_active_app_review_configuration(text, text)",
    );
    expect(down).toContain(
      "DROP COLUMN IF EXISTS world_id_configuration_snapshot",
    );
    expect(down).toContain(
      "DROP FUNCTION IF EXISTS public.build_app_review_world_id_configuration_snapshot(text)",
    );
    expect(down).toContain(
      "DROP COLUMN IF EXISTS review_configuration_change_kind",
    );
  });
});
