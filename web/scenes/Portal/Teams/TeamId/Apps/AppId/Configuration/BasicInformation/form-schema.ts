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
    // name uses appNameSchema as-is, which is .required() — so an empty app
    // name fails f.trigger() inside the autosave loop and the save is blocked
    // (both the debounced autosave and the Save button's flushAll path).
    name: appNameSchema,
    integration_url: integrationUrlSchema.notRequired(),
    app_website_url: yup
      .string()
      .transform(inferHttps)
      .concat(
        httpsLinkSchema({
          message: "App Website URL must be a valid https URL",
          excludeEmptyString: true,
        }),
      )
      .notRequired(),
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
