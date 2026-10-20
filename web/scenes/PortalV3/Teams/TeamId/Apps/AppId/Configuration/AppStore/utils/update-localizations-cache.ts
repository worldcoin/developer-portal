import type { ApolloCache } from "@apollo/client/cache";
import {
  FetchLocalizationsDocument,
  FetchLocalizationsQuery,
  FetchLocalizationsQueryVariables,
} from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppStore/graphql/client/fetch-localizations.generated";
import type { LocalizationCacheRow } from "../types/AppStoreFormTypes";

/**
 * Adds a newly created localization row to the cached FetchLocalizations list.
 *
 * Field *values* need no help — FetchLocalizations selects `id`, so the
 * upsert's `returning` row merges itself into the normalized entity. List
 * membership is the part Apollo cannot infer: deciding a brand-new row belongs
 * in `localizations({"where":{...}})` would mean evaluating Hasura's `where`
 * DSL, and an upsert response never says whether it inserted or updated. No
 * typePolicies configuration replaces this append.
 */
export const appendLocalizationToCache = (
  cache: ApolloCache,
  appMetadataId: string,
  localization: LocalizationCacheRow,
) => {
  cache.updateQuery<FetchLocalizationsQuery, FetchLocalizationsQueryVariables>(
    {
      query: FetchLocalizationsDocument,
      variables: { app_metadata_id: appMetadataId },
    },
    (data) => {
      // Nothing cached means no reader to keep in sync; the next query fetches
      // from the network anyway.
      if (!data) return data;

      // Already a member: the entity was updated in place, so touching the
      // list would only churn ref identity.
      if (data.localisations.some((row) => row.id === localization.id)) {
        return data;
      }

      return {
        ...data,
        localisations: [
          ...data.localisations,
          { ...localization, __typename: "localisations" as const },
        ],
      };
    },
  );
};

export const synchronizeLocalizationsCache = (
  cache: ApolloCache,
  appMetadataId: string,
  localisations: LocalizationCacheRow[],
) => {
  cache.updateQuery<FetchLocalizationsQuery, FetchLocalizationsQueryVariables>(
    {
      query: FetchLocalizationsDocument,
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
            (localization) => localization.locale === "en",
          ),
          ...localisations.map((localization) => ({
            ...localization,
            __typename: "localisations" as const,
          })),
        ],
      };
    },
  );
};
