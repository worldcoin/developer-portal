import { appNameSchema } from "@/lib/schema";
import * as yup from "yup";

function noLinks(value: string | undefined) {
  if (!value) return true;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return !urlRegex.test(value);
}
const shortNameSchema = yup.string().required("Short name is required").max(10);
const worldAppDescriptionSchema = yup
  .string()
  .max(35, "Annotation cannot exceed 35 characters")
  .test("no-links", "Links not allowed here", noLinks)
  .required();
const worldAppButtonTextSchema = yup
  .string()
  .max(25, "Content cannot exceed 25 characters")
  .optional();
const appWebsiteUrlSchema = yup
  .string()
  .url("Must be a valid https:// URL")
  .matches(/^https:\/\/(\w+-)*\w+(\.\w+)+([\/\w\-._/?%&#=]*)?$/, {
    message: "Link must be a valid HTTPS URL",
    excludeEmptyString: true,
  })
  .required("This field is required");
const descriptionOverviewSchema = yup
  .string()
  .max(1500, "Overview cannot exceed 1500 characters")
  .test("no-links", "Links not allowed here", noLinks)
  .required("This section is required");
const descriptionHowItWorksSchema = yup
  .string()
  .max(1500, "How it works cannot exceed 1500 characters")
  .test("no-links", "Links not allowed here", noLinks)
  .optional();
const descriptionConnectSchema = yup
  .string()
  .max(1500, "How to connect cannot exceed 1500 characters")
  .test("no-links", "Links not allowed here", noLinks)
  .optional();
const supportLinkSchema = yup.string().url("Invalid URL");
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
  short_name: shortNameSchema,
  category: categorySchema,
  world_app_description: worldAppDescriptionSchema,
  world_app_button_text: worldAppButtonTextSchema,
  app_website_url: appWebsiteUrlSchema,
  description_overview: descriptionOverviewSchema,
  description_how_it_works: descriptionHowItWorksSchema,
  description_connect: descriptionConnectSchema,
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
  short_name: shortNameSchema,
  world_app_description: worldAppDescriptionSchema,
  world_app_button_text: worldAppButtonTextSchema,
  description_overview: descriptionOverviewSchema,
  description_how_it_works: descriptionHowItWorksSchema,
  description_connect: descriptionConnectSchema,
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
