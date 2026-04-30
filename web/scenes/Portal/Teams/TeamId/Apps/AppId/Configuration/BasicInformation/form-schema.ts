import { appNameSchema, httpsLinkSchema, inferHttps } from "@/lib/schema";
import * as yup from "yup";

const integrationUrlSchema = yup
  .string()
  .transform(inferHttps)
  .url("Must be a valid https:// URL")
  .matches(/^https:\/\//, {
    message: "Link must be a valid HTTPS URL",
    excludeEmptyString: true,
  });

export const schema = yup
  .object({
    name: appNameSchema.optional(),
    integration_url: integrationUrlSchema.optional(),
    app_website_url: yup
      .string()
      .transform(inferHttps)
      .concat(
        httpsLinkSchema({
          message: "App Website URL must be a valid https URL",
          excludeEmptyString: true,
        }),
      )
      .optional(),
  })
  .noUnknown();
export type BasicInformationFormValues = yup.Asserts<typeof schema>;

export const reviewSchema = schema.shape({
  name: appNameSchema.required("App name is required"),
  integration_url: integrationUrlSchema.required("This field is required"),
  app_website_url: yup
    .string()
    .transform(inferHttps)
    .concat(
      httpsLinkSchema({
        message: "App Website URL must be a valid https URL",
        excludeEmptyString: false,
      }),
    )
    .required("Website URL is required"),
});
