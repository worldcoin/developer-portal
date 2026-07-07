import { GetRpRegistrationDocument } from "@/api/hasura/rotate-signer-key/graphql/get-rp-registration.generated";
import { FetchAppSecretDocument } from "@/api/helpers/oidc/graphql/fetch-app-secret-query.generated";
import { FetchOidcAppDocument } from "@/api/helpers/oidc/graphql/fetch-oidc-app.generated";
import { AppPrecheckByActionQueryDocument } from "@/api/v1/precheck/[app_id]/graphql/app-precheck-by-action.generated";
import { AppPrecheckQueryDocument } from "@/api/v1/precheck/[app_id]/graphql/app-precheck.generated";
import { FetchRpRegistrationForPrecheckDocument } from "@/api/v1/precheck/[app_id]/graphql/fetch-rp-registration-for-precheck.generated";
import { FetchAppActionDocument } from "@/api/v2/verify/graphql/fetch-app-action.generated";
import { DeleteAppDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/Danger/page/DeleteModal/graphql/server/delete-app.generated";
import { print } from "graphql";
import { DocumentNode } from "graphql/language";

// #region Test Data
const source = (document: DocumentNode) => print(document).replace(/\s+/g, "");
// #endregion

// #region Deleted app guards
describe("deleted app guards", () => {
  it("filters deleted apps from public active-app lookups", () => {
    const documents = [
      AppPrecheckQueryDocument,
      AppPrecheckByActionQueryDocument,
      FetchRpRegistrationForPrecheckDocument,
      FetchAppActionDocument,
      FetchOidcAppDocument,
      FetchAppSecretDocument,
    ];

    for (const document of documents) {
      expect(source(document)).toContain("deleted_at:{_is_null:true}");
    }
  });

  it("selects app deletion state before rotating signer keys", () => {
    const document = source(GetRpRegistrationDocument);

    expect(document).toContain("status");
    expect(document).toContain("is_archived");
    expect(document).toContain("deleted_at");
  });

  it("archives apps when soft-deleting them", () => {
    expect(source(DeleteAppDocument)).toContain("is_archived:true");
  });
});
// #endregion
