import type { DocumentNode, FieldNode, SelectionSetNode } from "graphql";
import { FetchLocalisationsDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppStore/graphql/client/fetch-localisations.generated";
import { UpsertLocalisedMetaTagImageDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppStore/graphql/client/upsert-localised-meta-tag-image.generated";
import { UpsertLocalisedShowcaseImagesDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppStore/graphql/client/upsert-localised-showcase-images.generated";
import { UpdateAppStoreCompleteDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppStore/graphql/server/update-app-store-complete.generated";

/**
 * If a row written into the cached FetchLocalisations list is missing a field
 * the query selects, Apollo does not return a partial row — it reads `null`
 * for the *entire* query, blanking every locale. Nothing in the type system
 * catches it, since each mutation generates its own result type.
 */

const selectionsOf = (node: SelectionSetNode | undefined) =>
  (node?.selections ?? []).filter(
    (selection): selection is FieldNode => selection.kind === "Field",
  );

const findField = (
  selectionSet: SelectionSetNode | undefined,
  name: string,
): FieldNode | undefined =>
  selectionsOf(selectionSet).find((field) => field.name.value === name);

const rootSelectionSet = (document: DocumentNode) => {
  const operation = document.definitions.find(
    (definition) => definition.kind === "OperationDefinition",
  );
  if (!operation || operation.kind !== "OperationDefinition") {
    throw new Error("document has no operation definition");
  }
  return operation.selectionSet;
};

const queryFields = () => {
  const localisations = findField(
    rootSelectionSet(FetchLocalisationsDocument),
    "localisations",
  );
  return selectionsOf(localisations?.selectionSet).map(
    (field) => field.name.value,
  );
};

const returningFields = (document: DocumentNode) => {
  const insert = findField(rootSelectionSet(document), "insert_localisations");
  const returning = findField(insert?.selectionSet, "returning");
  return selectionsOf(returning?.selectionSet).map((field) => field.name.value);
};

describe("localisations cache selection sets", () => {
  it("keys the cached query on the primary key", () => {
    // Drop this and rows silently become embedded again, so mutation results
    // stop merging and manual cache patching has to come back.
    expect(queryFields()).toContain("id");
  });

  it.each([
    ["UpsertLocalisedShowcaseImages", UpsertLocalisedShowcaseImagesDocument],
    ["UpsertLocalisedMetaTagImage", UpsertLocalisedMetaTagImageDocument],
    ["UpdateAppStoreComplete", UpdateAppStoreCompleteDocument],
  ])("%s returns every field FetchLocalisations selects", (_name, document) => {
    const returning = returningFields(document as DocumentNode);
    expect(returning.length).toBeGreaterThan(0);

    const missing = queryFields().filter((field) => !returning.includes(field));
    expect(missing).toEqual([]);
  });
});
