import { FetchAppMetadataQuery } from "../../graphql/client/fetch-app-metadata.generated";
import { LocalisationFormSchema } from "../form-schema";
import { parseDescription } from "../utils";

export const transformMailtoToRawEmail = (email: string) => {
  return email.replace("mailto:", "");
};

export const getParsedDescription = (
  locale: string,
  appMetadata: FetchAppMetadataQuery["app"][0]["app_metadata"][0],
  localisationsData: Array<{
    locale: string;
    name?: string | null;
    short_name?: string | null;
    world_app_description?: string | null;
    description?: string | null;
    meta_tag_image_url?: string | null;
    showcase_img_urls?: string[] | null;
  }>,
) => {
  if (locale === "en") {
    return parseDescription(appMetadata?.description ?? "");
  } else {
    return parseDescription(
      localisationsData.find((obj) => obj.locale === locale)?.description ?? "",
    );
  }
};

export const getAppMetadataFormValuesFromEnLocalisation = (
  appMetadata: FetchAppMetadataQuery["app"][0]["app_metadata"][0],
  localisationsData: Array<{
    locale: string;
    name?: string | null;
    short_name?: string | null;
    world_app_description?: string | null;
    description?: string | null;
    meta_tag_image_url?: string | null;
    showcase_img_urls?: string[] | null;
  }>,
): LocalisationFormSchema => {
  const enLocalisationData = localisationsData.find((l) => l.locale === "en");

  const enLocalisationDescriptionOverview = getParsedDescription(
    "en",
    appMetadata,
    localisationsData,
  ).description_overview;

  const enLocalisation: LocalisationFormSchema = {
    language: "en",
    name: enLocalisationData?.name || appMetadata.name,
    short_name: enLocalisationData?.short_name || appMetadata.short_name,
    world_app_description:
      enLocalisationData?.world_app_description ||
      appMetadata.world_app_description,
    description_overview: enLocalisationDescriptionOverview,
    meta_tag_image_url:
      enLocalisationData?.meta_tag_image_url || appMetadata.meta_tag_image_url,
    showcase_img_urls:
      (enLocalisationData?.showcase_img_urls ||
        appMetadata.showcase_img_urls) ??
      [],
  };

  return {
    ...enLocalisation,
    description_overview: enLocalisation.description_overview,
  };
};

export const getLocalisationFormValues = (
  appMetadata: FetchAppMetadataQuery["app"][0]["app_metadata"][0],
  localisationsData: Array<{
    locale: string;
    name?: string | null;
    short_name?: string | null;
    world_app_description?: string | null;
    description?: string | null;
    meta_tag_image_url?: string | null;
    showcase_img_urls?: string[] | null;
  }>,
) => {
  const localisations: LocalisationFormSchema[] = [];

  const enLocalisation = getAppMetadataFormValuesFromEnLocalisation(
    appMetadata,
    localisationsData,
  );

  // en is always present in the form
  localisations.push(enLocalisation);

  const hasLocalisations = localisationsData.length > 0;

  if (!hasLocalisations) {
    return localisations;
  }

  for (const localisation of localisationsData) {
    const descriptionOverview = getParsedDescription(
      localisation.locale,
      appMetadata,
      localisationsData,
    ).description_overview;

    localisations.push({
      language: localisation.locale,
      name: localisation.name || "",
      short_name: localisation.short_name || "",
      world_app_description: localisation.world_app_description || "",
      description_overview: descriptionOverview || "",
      meta_tag_image_url: localisation.meta_tag_image_url || "",
      showcase_img_urls: localisation.showcase_img_urls || [],
    });
  }
  return [...new Set([enLocalisation, ...localisations])];
};
