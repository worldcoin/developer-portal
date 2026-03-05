import {
  appDescriptionOverviewSchema,
  appNameSchema,
  appShortNameSchema,
  appWorldAppDescriptionSchema,
} from "@/lib/schema";
import * as yup from "yup";
import {
  appWebsiteUrlSchema,
  categorySchema,
  isAndroidOnlySchema,
  isForHumansOnlySchema,
  supportedCountriesSchema,
  supportEmailSchema,
  supportLinkSchema,
} from "./field-schema";

export const localisationFormSchema = yup
  .object({
    language: yup.string().required("Locale is required"),
    name: appNameSchema,
    short_name: appShortNameSchema.when("$isMiniApp", {
      is: true,
      then: (s) => s.required("Short name is required"),
      otherwise: (s) => s.notRequired(),
    }),
    world_app_description: appWorldAppDescriptionSchema.when("$isMiniApp", {
      is: true,
      then: (s) => s.required("App tag line is required"),
      otherwise: (s) => s.notRequired(),
    }),
    description_overview: appDescriptionOverviewSchema,
    meta_tag_image_url: yup.string().notRequired(),
    showcase_img_urls: yup.array().of(yup.string().notRequired()),
  })
  .noUnknown();

export const mainAppStoreFormSchema = yup
  .object({
    category: categorySchema,
    support_type: yup.string().when("$isMiniApp", {
      is: true,
      then: (s) => s.oneOf(["email", "link"], "Invalid support type"),
      otherwise: (s) => s.notRequired(),
    }),
    support_link: yup.string().when("$isMiniApp", {
      is: false,
      then: (s) => s.notRequired(),
      otherwise: (s) =>
        s.when("support_type", {
          is: "link",
          then: () => supportLinkSchema.required("Support contact is required"),
          otherwise: () => yup.string().length(0),
        }),
    }),
    support_email: yup.string().when("$isMiniApp", {
      is: false,
      then: (s) => s.notRequired(),
      otherwise: (s) =>
        s.when("support_type", {
          is: "email",
          then: () =>
            supportEmailSchema.required("Support contact is required"),
          otherwise: () => yup.string().length(0),
        }),
    }),
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
  .noUnknown();

/**
 * for validating the final object when submitting for review
 */
export const localisationFormReviewSubmitSchema = yup
  .object({
    language: yup.string().required("Locale is required"),
    name: appNameSchema.required("Name is required"),
    short_name: appShortNameSchema.when("$isMiniApp", {
      is: true,
      then: (s) => s.required("Short name is required"),
      otherwise: (s) => s.notRequired(),
    }),
    world_app_description: appWorldAppDescriptionSchema.when("$isMiniApp", {
      is: true,
      then: (s) => s.required("App tag line is required"),
      otherwise: (s) => s.notRequired(),
    }),
    description_overview: appDescriptionOverviewSchema.required(
      "Overview is required",
    ),
    meta_tag_image_url: yup.string().notRequired(),
    showcase_img_urls: yup
      .array()
      .of(yup.string())
      .min(1, "At least one showcase image is required for each localisation"),
  })
  .noUnknown();

/**
 * for validating the final object when submitting for review
 * this object does not specify .notUnknown() because it's strictly validated
 * when calling .validate(), specify stripUnknown: true
 */
export const mainAppStoreFormReviewSubmitSchema = yup
  .object({
    name: appNameSchema.required("Name is required"),
    short_name: appShortNameSchema.when("$isMiniApp", {
      is: true,
      then: (s) => s.required("Short name is required"),
      otherwise: (s) => s.notRequired(),
    }),
    logo_img_url: yup.string().required("Logo image is required"),
    content_card_image_url: yup.string().when("$isMiniApp", {
      is: true,
      then: (s) => s.required("Content card image is required"),
      otherwise: (s) => s.notRequired(),
    }),
    category: categorySchema.when("$isMiniApp", {
      is: true,
      then: (s) => s.required("Category is required"),
      otherwise: (s) => s.notRequired(),
    }),
    world_app_description: appWorldAppDescriptionSchema.when("$isMiniApp", {
      is: true,
      then: (s) => s.required("App tag line is required"),
      otherwise: (s) => s.notRequired(),
    }),
    app_website_url: appWebsiteUrlSchema.required("Website URL is required"),
    support_type: yup.string().when("$isMiniApp", {
      is: true,
      then: (s) => s.oneOf(["email", "link"], "Invalid support type"),
      otherwise: (s) => s.notRequired(),
    }),
    support_link: yup.string().when("$isMiniApp", {
      is: false,
      then: (s) => s.notRequired(),
      otherwise: (s) =>
        s.when("support_type", {
          is: "link",
          then: () => supportLinkSchema.required("Support contact is required"),
          otherwise: () => yup.string().length(0),
        }),
    }),
    support_email: yup.string().when("$isMiniApp", {
      is: false,
      then: (s) => s.notRequired(),
      otherwise: (s) =>
        s.when("support_type", {
          is: "email",
          then: () =>
            supportEmailSchema.required("Support contact is required"),
          otherwise: () => yup.string().length(0),
        }),
    }),
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
      .of(localisationFormReviewSubmitSchema)
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
      if (!this.options.context?.isMiniApp) return true;
      const { support_link, support_email } = values || {};
      return !!(support_link || support_email);
    },
  );
