import { appNameSchema, httpsLinkSchema, inferHttps } from "@/lib/schema";
import * as yup from "yup";

export const schema = yup
  .object({
    name: appNameSchema,
    integration_url: yup
      .string()
      .transform(inferHttps)
      .url("Must be a valid https:// URL")
      .matches(/^https:\/\/(\w+-)*\w+(\.\w+)+([\/\w\-._/?%&#=]*)?$/, {
        message: "Link must be a valid HTTPS URL",
        excludeEmptyString: true,
      })
      .required("This field is required"),
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
