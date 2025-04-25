import {
  appDescriptionConnectSchema,
  appDescriptionHowItWorksSchema,
  appDescriptionOverviewSchema,
  appNameSchema,
  appShortNameSchema,
  appStoreImageSchema,
  appWorldAppButtonTextSchema,
  appWorldAppDescriptionSchema,
  httpsLinkSchema,
} from "@/lib/schema";
import * as yup from "yup";

const appWebsiteUrlSchema = httpsLinkSchema().required(
  "This field is required",
);
const supportEmailSchema = yup.string().email("Invalid email address");

const supportLinkSchema = httpsLinkSchema({ excludeEmptyString: true });
const supportedCountriesSchema = yup
  .array(
    yup
      .string()
      .required("This field is required")
      .length(2, "Invalid country code"),
  )
  .min(1, "This field is required")
  .required("This field is required")
  .default([]);
const categorySchema = yup.string().optional();
const isAndroidOnlySchema = yup
  .boolean()
  .typeError("This field is required")
  .required("This field is required");
const isForHumansOnlySchema = yup
  .boolean()
  .typeError("This field is required")
  .required("This field is required");

export const schema = yup.object({
  name: appNameSchema,
  short_name: appShortNameSchema,
  category: categorySchema,
  world_app_description: appWorldAppDescriptionSchema,
  world_app_button_text: appWorldAppButtonTextSchema,
  app_website_url: appWebsiteUrlSchema,
  description_overview: appDescriptionOverviewSchema,
  description_how_it_works: appDescriptionHowItWorksSchema,
  description_connect: appDescriptionConnectSchema,
  support_link: supportLinkSchema,
  support_email: supportEmailSchema,
  is_android_only: isAndroidOnlySchema,
  is_for_humans_only: isForHumansOnlySchema,
  supported_countries: supportedCountriesSchema,
  supported_languages: yup
    .array(yup.string().required("This field is required"))
    .min(1, "This field is required")
    .required("This field is required")
    .default(["en"])
    .test("has-english", "English is a required language", (langs) =>
      langs.includes("en"),
    ),
});
export type AppStoreLocalisedFormValues = yup.Asserts<typeof schema>;

const appMetadataIdSchema = yup
  .string()
  .required("App metadata id is required");

export const insertLocalisationInitialSchema = yup.object({
  name: appNameSchema,
  short_name: appShortNameSchema,
  world_app_description: appWorldAppDescriptionSchema,
  world_app_button_text: appWorldAppButtonTextSchema,
  description_overview: appDescriptionOverviewSchema,
  description_how_it_works: appDescriptionHowItWorksSchema,
  description_connect: appDescriptionConnectSchema,
  app_metadata_id: appMetadataIdSchema,
  locale: yup.string().required("Locale is required"),
  hero_image_url: appStoreImageSchema,
  meta_tag_image_url: appStoreImageSchema.optional(),
  showcase_img_urls: yup.array().of(appStoreImageSchema),
});

export type InsertLocalisationInitialSchema = yup.Asserts<
  typeof insertLocalisationInitialSchema
>;

export const updateAppLocaleInfoInitialSchema = insertLocalisationInitialSchema;
export type UpdateAppLocaleInfoInitialSchema = InsertLocalisationInitialSchema;

export const updateAppSupportInfoInitialSchema = yup.object({
  app_metadata_id: appMetadataIdSchema,
  is_support_email: yup.boolean().required("This field is required"),
  support_link: supportLinkSchema,
  support_email: supportEmailSchema,
  app_website_url: appWebsiteUrlSchema,
  supported_countries: supportedCountriesSchema,
  category: categorySchema,
  is_android_only: isAndroidOnlySchema,
  is_for_humans_only: isForHumansOnlySchema,
});

export type UpdateAppSupportInfoInitialSchema = yup.Asserts<
  typeof updateAppSupportInfoInitialSchema
>;

export const updateLocalisationInitialSchema = insertLocalisationInitialSchema
  .omit(["app_metadata_id"])
  .shape({
    localisation_id: yup.string().required("Localisation id is required"),
  });
export type UpdateLocalisationInitialSchema = yup.Asserts<
  typeof updateLocalisationInitialSchema
>;
