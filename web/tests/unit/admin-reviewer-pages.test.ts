import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

describe("admin reviewer page boundaries", () => {
  it.each([
    "app/admin/reviewer/page.tsx",
    "app/admin/reviewer/[reviewId]/page.tsx",
  ])("authenticates before reviewer data access in %s", (relativePath) => {
    const source = readFileSync(join(root, relativePath), "utf8");
    const authOffset = source.indexOf("requireAdminUser()");
    const sceneOffset = source.indexOf("<AdminReviewer");

    expect(authOffset).toBeGreaterThan(-1);
    expect(sceneOffset).toBeGreaterThan(authOffset);
    expect(source).toContain("isAdminReviewerPortalEnabled()");
    expect(source).toContain("notFound()");
  });

  it("feature-gates the Reviewer navigation item", () => {
    const layout = readFileSync(join(root, "scenes/Admin/layout.tsx"), "utf8");
    const nav = readFileSync(
      join(root, "components/AdminDashboard/NavBar/index.tsx"),
      "utf8",
    );

    expect(layout).toContain("isAdminReviewerPortalEnabled()");
    expect(nav).toContain("showReviewer");
    expect(nav).toContain('href="/admin/reviewer"');
  });

  it("does not query or expose claim tokens in dashboard GraphQL", () => {
    const queueQuery = readFileSync(
      join(
        root,
        "scenes/Admin/reviewer/graphql/server/fetch-reviewer-queue.gql",
      ),
      "utf8",
    );
    const detailQuery = readFileSync(
      join(
        root,
        "scenes/Admin/reviewer/graphql/server/fetch-reviewer-submission.gql",
      ),
      "utf8",
    );

    expect(`${queueQuery}\n${detailQuery}`).not.toMatch(/claim_token/i);
  });

  it("keeps the server checklist context projection narrow", () => {
    const query = readFileSync(
      join(root, "api/admin/reviewer/graphql/reviewer-workflow.graphql"),
      "utf8",
    );
    const contextQuery = query.slice(
      query.indexOf("query FetchReviewChecklistContext"),
      query.indexOf("query FetchReviewDecisionContext"),
    );

    expect(contextQuery).toContain("app_review_submission_by_pk");
    expect(contextQuery).toContain("app_mode");
    expect(contextQuery).toContain("checklist_version");
    expect(contextQuery).not.toMatch(/claim_token|claimed_by_subject/i);
  });

  it("keeps broad unpublished metadata out of the dashboard read role", () => {
    const appMetadata = readFileSync(
      join(
        root,
        "../hasura/metadata/databases/default/tables/public_app_metadata.yaml",
      ),
      "utf8",
    );
    const localizations = readFileSync(
      join(
        root,
        "../hasura/metadata/databases/default/tables/public_localisations.yaml",
      ),
      "utf8",
    );
    const metadataStart = appMetadata.indexOf(
      "  - role: internal_dashboard_readonly",
      appMetadata.indexOf("select_permissions:"),
    );
    const metadataEnd = appMetadata.indexOf("\n  - role:", metadataStart + 1);
    const metadataPermission = appMetadata.slice(metadataStart, metadataEnd);

    expect(metadataPermission).toContain("- name");
    expect(metadataPermission).not.toContain("- integration_url");
    expect(metadataPermission).not.toContain("- contracts");
    expect(localizations).not.toContain(
      "select_permissions:\n  - role: internal_dashboard_readonly",
    );
  });

  it("loads live listing metadata through an exact-app server-only projection", () => {
    const query = readFileSync(
      join(root, "api/helpers/graphql/fetch-reviewer-live-metadata.graphql"),
      "utf8",
    );
    const projection = readFileSync(
      join(root, "api/helpers/reviewer-live-metadata.ts"),
      "utf8",
    );
    const adminRead = readFileSync(
      join(root, "scenes/Admin/reviewer/server/fetch-reviewer-data.ts"),
      "utf8",
    );

    expect(query).toContain("$appId: String!");
    expect(query).toContain("app_id: { _eq: $appId }");
    expect(query).toContain('verification_status: { _eq: "verified" }');
    expect(query).toContain("is_reviewer_world_app_approved: { _eq: true }");
    expect(projection).toContain("getAPIServiceGraphqlClient");
    expect(adminRead).not.toContain("getAPIServiceGraphqlClient");
  });
});
