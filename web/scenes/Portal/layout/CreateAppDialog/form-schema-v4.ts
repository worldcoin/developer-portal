import { CategoryNameIterable } from "@/lib/categories";
import * as yup from "yup";

export const createAppSchemaV4 = yup
  .object({
    name: yup.string().required("This field is required"),
    integration_url: yup
      .string()
      .url("Must be a valid URL")
      .matches(/^https:\/\/(\w+-)*\w+(\.\w+)+([\/\w\-._/?%&#=]*)?$/, {
        message: "URL must use HTTPS (e.g., https://example.com)",
        excludeEmptyString: true,
      })
      .optional(),
    is_miniapp: yup.boolean().default(false),
    category: yup.string().when("is_miniapp", {
      is: true,
      then: (schema) =>
        schema.oneOf(CategoryNameIterable).required("This field is required"),
      otherwise: (schema) => schema.optional(),
    }),
    build: yup.string().default("production"),
    verification: yup.string().default("cloud"),
  })
  .noUnknown();
export type CreateAppSchemaV4 = yup.InferType<typeof createAppSchemaV4>;
