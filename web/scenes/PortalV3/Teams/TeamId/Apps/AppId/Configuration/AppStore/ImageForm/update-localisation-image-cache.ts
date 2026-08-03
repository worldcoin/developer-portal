import type { ApolloCache } from "@apollo/client/cache";
import {
  FetchLocalisationsDocument,
  FetchLocalisationsQuery,
  FetchLocalisationsQueryVariables,
} from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppStore/graphql/client/fetch-localisations.generated";

type LocalisationImageUpdate =
  | { meta_tag_image_url: string }
  | { showcase_img_urls: string[] };

type Localisation = FetchLocalisationsQuery["localisations"][number];

const createEmptyLocalisation = (locale: string): Localisation => ({
  __typename: "localisations",
  locale,
  name: "",
  description: "",
  world_app_button_text: "",
  world_app_description: "",
  short_name: "",
  hero_image_url: "",
  meta_tag_image_url: "",
  showcase_img_urls: [],
});

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

      return {
        ...data,
        localisations: hasLocalisation
          ? data.localisations.map((localisation) =>
              localisation.locale === locale
                ? { ...localisation, ...imageUpdate }
                : localisation,
            )
          : [
              ...data.localisations,
              { ...createEmptyLocalisation(locale), ...imageUpdate },
            ],
      };
    },
  );
};
