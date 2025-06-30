import {
  appDescriptionOverviewSchema,
  appNameSchema,
  appShortNameSchema,
  appWorldAppDescriptionSchema,
  httpsLinkSchema as getHttpsLinkSchema,
} from "@/lib/schema";
import * as yup from "yup";

const httpsLinkSchema = getHttpsLinkSchema();

const appWebsiteUrlSchema = httpsLinkSchema.required("This field is required");
const supportEmailSchema = yup.string().email("Invalid email address");

const supportLinkSchema = yup
  .string()
  .test(
    "is-valid-support-link",
    "Must be a valid https URL or a miniapp deeplink (worldapp://mini-app?app_id=)",
    (value) => {
      if (!value) return true;

      // miniapp deeplink
      if (value.startsWith("worldapp://mini-app?app_id=")) {
        return true;
      }

      // https url
      if (httpsLinkSchema.isValidSync(value)) {
        return true;
      }

      return false;
    },
  );

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

const appMetadataIdSchema = yup
  .string()
  .required("App metadata id is required");

export const localisationFormSchema = yup.object({
  language: yup.string().required("Locale is required"),
  name: appNameSchema,
  short_name: appShortNameSchema,
  world_app_description: appWorldAppDescriptionSchema,
  description_overview: appDescriptionOverviewSchema,
  meta_tag_image_url: yup.string().notRequired(),
  showcase_img_urls: yup.array().of(yup.string().notRequired()),
});
export type LocalisationFormSchema = yup.Asserts<typeof localisationFormSchema>;
export const mainAppStoreFormSchema = yup
  .object({
    category: categorySchema,
    app_website_url: appWebsiteUrlSchema,
    support_link: supportLinkSchema,
    support_email: supportEmailSchema,
    support_type: yup.string().oneOf(["email", "link"]),
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
    localisations: yup.array().of(localisationFormSchema).default([]),
  })
  .test(
    "support-contact-required",
    "Either support link or support email must be provided",
    function (values) {
      const { support_link, support_email } = values || {};

      // exactly one must be provided
      return !!(support_link || support_email);
    },
  );

export type AppStoreFormValues = yup.Asserts<typeof mainAppStoreFormSchema>;

export const localisationFormFinalSchema = yup.object({
  language: yup.string().required("Locale is required"),
  name: appNameSchema.required("Name is required"),
  short_name: appShortNameSchema.required("Short name is required"),
  world_app_description: appWorldAppDescriptionSchema.required(
    "App tag line is required",
  ),
  description_overview: appDescriptionOverviewSchema.required(
    "Description is required",
  ),
  meta_tag_image_url: yup.string().notRequired(),
  showcase_img_urls: yup
    .array()
    .of(yup.string())
    .min(1, "Showcase images are required"),
});
/**
 * for validating the final object before submitting for review
 */
export const mainAppStoreFormFinalSchema = yup
  .object({
    name: appNameSchema.required("Name is required"),
    short_name: appShortNameSchema.required("Short name is required"),
    category: categorySchema.required("Category is required"),
    world_app_description: appWorldAppDescriptionSchema.required(
      "App tag line is required",
    ),
    app_website_url: appWebsiteUrlSchema.required("Website URL is required"),
    description_overview: appDescriptionOverviewSchema.required(
      "Description is required",
    ),
    support_link: supportLinkSchema, // tested later
    support_email: supportEmailSchema, // tested later
    is_android_only: isAndroidOnlySchema.required("This field is required"),
    is_for_humans_only: isForHumansOnlySchema.required(
      "This field is required",
    ),
    supported_countries: supportedCountriesSchema.required(
      "This field is required",
    ),
    supported_languages: yup
      .array(yup.string().required("This field is required"))
      .min(1, "This field is required")
      .required("This field is required")
      .test("has-english", "English is a required language", (langs) =>
        langs.includes("en"),
      ),
    localisations: yup
      .array()
      .of(localisationFormSchema)
      .test(
        "has-english",
        "English is a required language",
        (localisations) => {
          if (!localisations) return false;

          const hasEnglish = localisations.some(
            (localisation) => localisation.language === "en",
          );
          if (!hasEnglish) return false;

          return true;
        },
      ),
  })
  .test(
    "support-contact-required",
    "Either support link or support email must be provided",
    function (values) {
      const { support_link, support_email } = values || {};

      // exactly one must be provided
      return !!(support_link || support_email);
    },
  );
