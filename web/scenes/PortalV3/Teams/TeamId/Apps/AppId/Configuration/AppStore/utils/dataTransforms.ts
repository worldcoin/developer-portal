import { LocalizationFormSchema } from "../FormSchema/types";
import { AppMetadata, LocalizationData } from "../types/AppStoreFormTypes";
import { parseDescription } from "../utils";

export const transformMailtoToRawEmail = (email: string) => {
  return email.replace("mailto:", "");
};

export const getParsedDescription = (
  locale: string,
  appMetadata: Pick<
    AppMetadata,
    | "description"
    | "world_app_description"
    | "meta_tag_image_url"
    | "short_name"
    | "name"
    | "showcase_img_urls"
  >,
  localizationsData: LocalizationData,
) => {
  if (locale === "en") {
    return parseDescription(appMetadata?.description ?? "");
  } else {
    return parseDescription(
      localizationsData.find((obj) => obj.locale === locale)?.description ?? "",
    );
  }
};

export const getAppMetadataFormValuesFromEnLocalization = (
  appMetadata: Pick<
    AppMetadata,
    | "description"
    | "world_app_description"
    | "meta_tag_image_url"
    | "short_name"
    | "name"
    | "showcase_img_urls"
  >,
  localizationsData: LocalizationData,
): LocalizationFormSchema => {
  const enLocalizationData = localizationsData.find((l) => l.locale === "en");
  const enLocalizationDescriptionOverview = getParsedDescription(
    "en",
    appMetadata,
    localizationsData,
  ).description_overview;

  const enLocalization: LocalizationFormSchema = {
    language: "en",
    name: enLocalizationData?.name || appMetadata.name,
    short_name: enLocalizationData?.short_name || appMetadata.short_name,
    world_app_description:
      enLocalizationData?.world_app_description ||
      appMetadata.world_app_description,
    description_overview: enLocalizationDescriptionOverview,
    meta_tag_image_url:
      enLocalizationData?.meta_tag_image_url || appMetadata.meta_tag_image_url,
    showcase_img_urls:
      (enLocalizationData?.showcase_img_urls ||
        appMetadata.showcase_img_urls) ??
      [],
  };

  return {
    ...enLocalization,
    description_overview: enLocalization.description_overview,
  };
};

export const getLocalizationFormValues = (
  appMetadata: Pick<
    AppMetadata,
    | "description"
    | "world_app_description"
    | "meta_tag_image_url"
    | "short_name"
    | "name"
    | "showcase_img_urls"
  >,
  localizationsData: LocalizationData,
) => {
  const localisations: LocalizationFormSchema[] = [];
  const enLocalization = getAppMetadataFormValuesFromEnLocalization(
    appMetadata,
    localizationsData,
  );

  // en is always present in the form
  localisations.push(enLocalization);

  const hasLocalizations = localizationsData.length > 0;

  if (!hasLocalizations) {
    return localisations;
  }

  for (const localization of localizationsData) {
    const descriptionOverview = getParsedDescription(
      localization.locale,
      appMetadata,
      localizationsData,
    ).description_overview;

    localisations.push({
      language: localization.locale,
      name: localization.name || "",
      short_name: localization.short_name || "",
      world_app_description: localization.world_app_description || "",
      description_overview: descriptionOverview || "",
      meta_tag_image_url: localization.meta_tag_image_url || "",
      showcase_img_urls: localization.showcase_img_urls || [],
    });
  }
  return [...new Set([enLocalization, ...localisations])];
};
