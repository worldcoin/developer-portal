import { appNameSchema, httpsUrlSchema } from "@/lib/schema";
import * as yup from "yup";

export const schema = yup
  .object({
    name: appNameSchema,
    integration_url: httpsUrlSchema({ required: true }),
  })
  .noUnknown();
export type BasicInformationFormValues = yup.Asserts<typeof schema>;
