import type { ApolloCache } from "@apollo/client/cache";
import {
  FetchLocalisationsDocument,
  FetchLocalisationsQuery,
  FetchLocalisationsQueryVariables,
} from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppStore/graphql/client/fetch-localisations.generated";
import type { LocalisationCacheRow } from "../types/AppStoreFormTypes";

/**
 * Adds a newly created localization row to the cached FetchLocalisations list.
 *
 * Field *values* need no help — FetchLocalisations selects `id`, so the
 * upsert's `returning` row merges itself into the normalized entity. List
 * membership is the part Apollo cannot infer: deciding a brand-new row belongs
 * in `localisations({"where":{...}})` would mean evaluating Hasura's `where`
 * DSL, and an upsert response never says whether it inserted or updated. No
 * typePolicies configuration replaces this append.
 */
export const appendLocalisationToCache = (
  cache: ApolloCache,
  appMetadataId: string,
  localisation: LocalisationCacheRow,
) => {
  cache.updateQuery<FetchLocalisationsQuery, FetchLocalisationsQueryVariables>(
    {
      query: FetchLocalisationsDocument,
      variables: { app_metadata_id: appMetadataId },
    },
    (data) => {
      // Nothing cached means no reader to keep in sync; the next query fetches
      // from the network anyway.
      if (!data) return data;

      // Already a member: the entity was updated in place, so touching the
      // list would only churn ref identity.
      if (data.localisations.some((row) => row.id === localisation.id)) {
        return data;
      }

      return {
        ...data,
        localisations: [
          ...data.localisations,
          { ...localisation, __typename: "localisations" as const },
        ],
      };
    },
  );
};

export const synchronizeLocalisationsCache = (
  cache: ApolloCache,
  appMetadataId: string,
  localisations: LocalisationCacheRow[],
) => {
  cache.updateQuery<FetchLocalisationsQuery, FetchLocalisationsQueryVariables>(
    {
      query: FetchLocalisationsDocument,
      variables: { app_metadata_id: appMetadataId },
    },
    (data) => {
      if (!data) return data;

      // This is the complete normalized non-English set successfully written
      // by the form autosave. Preserve a legacy English row, if one exists.
      return {
        ...data,
        localisations: [
          ...data.localisations.filter(
            (localisation) => localisation.locale === "en",
          ),
          ...localisations.map((localisation) => ({
            ...localisation,
            __typename: "localisations" as const,
          })),
        ],
      };
    },
  );
};
