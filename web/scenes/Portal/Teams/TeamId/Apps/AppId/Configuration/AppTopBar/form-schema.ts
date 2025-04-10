import {
  appChangelogSchema,
  appDescriptionConnectSchema,
  appDescriptionHowItWorksSchema,
  appDescriptionOverviewSchema,
  appNameSchema,
  appShortNameSchema,
  appWorldAppDescriptionSchema,
  httpsLinkSchema,
} from "@/lib/schema";
import * as yup from "yup";
const urlSchema = httpsLinkSchema();
export const submitAppForReviewSchema = yup.object().shape({
  name: appNameSchema,
  short_name: appShortNameSchema,
  description_overview: appDescriptionOverviewSchema,
  description_how_it_works: appDescriptionHowItWorksSchema,
  description_connect: appDescriptionConnectSchema,
  world_app_description: appWorldAppDescriptionSchema,
  logo_img_url: yup.string().required("A logo image is required"),
  hero_image_url: yup.string().optional(),
  showcase_img_urls: yup.array().nullable().optional(),
  integration_url: urlSchema.required("App URL is required"),
  app_website_url: urlSchema.optional(),
  category: yup.string().required("Category is required"),
  is_developer_allow_listing: yup.boolean(),
});
export type SubmitAppForReviewSchema = yup.Asserts<
  typeof submitAppForReviewSchema
>;

export const submitAppSchema = yup.object().shape({
  app_metadata_id: yup.string().required("App metadata ID is required"),
  team_id: yup.string().required("Team ID is required"),
  is_developer_allow_listing: yup.boolean(),
  changelog: appChangelogSchema,
  is_higher_risk: yup.boolean(),
});
export type SubmitAppSchema = yup.Asserts<typeof submitAppSchema>;
