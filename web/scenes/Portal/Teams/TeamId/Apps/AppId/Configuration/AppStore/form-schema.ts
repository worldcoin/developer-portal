import {
  appDescriptionConnectSchema,
  appDescriptionHowItWorksSchema,
  appDescriptionOverviewSchema,
  appNameSchema,
  appShortNameSchema,
  appWorldAppButtonTextSchema,
  appWorldAppDescriptionSchema,
  httpsLinkSchema,
} from "@/lib/schema";
import * as yup from "yup";

const appWebsiteUrlSchema = httpsLinkSchema.required("This field is required");

const supportLinkSchema = httpsLinkSchema;
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
  support_email: yup.string().email("Invalid email address"),
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
});

export type InsertLocalisationInitialSchema = yup.Asserts<
  typeof insertLocalisationInitialSchema
>;

export const updateAppLocaleInfoInitialSchema = insertLocalisationInitialSchema;
export type UpdateAppLocaleInfoInitialSchema = InsertLocalisationInitialSchema;

export const updateAppSupportInfoInitialSchema = yup.object({
  app_metadata_id: appMetadataIdSchema,
  support_link: supportLinkSchema,
  app_website_url: appWebsiteUrlSchema,
  supported_countries: supportedCountriesSchema,
  category: categorySchema,
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
