import { appNameSchema } from "@/lib/schema";
import * as yup from "yup";

export const schema = yup
  .object({
    name: appNameSchema,
    integration_url: yup
      .string()
      .url("Must be a valid https:// URL")
      .matches(/^https:\/\/(\w+-)*\w+(\.\w+)+([\/\w\-._/?%&#=]*)?$/, {
        message: "Link must be a valid HTTPS URL",
        excludeEmptyString: true,
      })
      .required("This field is required"),
  })
  .noUnknown();
export type BasicInformationFormValues = yup.Asserts<typeof schema>;
