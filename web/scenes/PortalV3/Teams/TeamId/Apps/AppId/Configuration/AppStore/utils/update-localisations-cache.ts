import type { ApolloCache } from "@apollo/client/cache";
import {
  FetchLocalisationsDocument,
  FetchLocalisationsQuery,
  FetchLocalisationsQueryVariables,
} from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppStore/graphql/client/fetch-localisations.generated";
import type { LocalisationCacheRow } from "../types/AppStoreFormTypes";

type LocalisationImageUpdate =
  | { meta_tag_image_url: string }
  | { showcase_img_urls: string[] };

export const updateLocalisationImageCache = (
  cache: ApolloCache,
  appMetadataId: string,
  locale: string,
  imageUpdate: LocalisationImageUpdate,
) => {
  cache.updateQuery<FetchLocalisationsQuery, FetchLocalisationsQueryVariables>(
    {
      query: FetchLocalisationsDocument,
      variables: { app_metadata_id: appMetadataId },
    },
    (data) => {
      if (!data) return data;

      const hasLocalisation = data.localisations.some(
        (localisation) => localisation.locale === locale,
      );
      // The image mutation does not return the rest of the localization row.
      // Wait for the complete form autosave instead of inventing blank fields.
      if (!hasLocalisation) return data;

      return {
        ...data,
        localisations: data.localisations.map((localisation) =>
          localisation.locale === locale
            ? { ...localisation, ...imageUpdate }
            : localisation,
        ),
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
