import { CategoryNameIterable } from "@/lib/categories";
import * as yup from "yup";

export const createAppSchemaV2 = yup
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
        schema
          .oneOf(CategoryNameIterable)
          .required("This field is required"),
      otherwise: (schema) => schema.optional(),
    }),
    // Keep these for backend compatibility but don't show in form
    build: yup.string().default("production"),
    verification: yup.string().default("cloud"),
    app_mode: yup
      .string()
      .oneOf(["mini-app", "external", "native"])
      .default("external"),
  })
  .noUnknown();
export type CreateAppSchemaV2 = yup.InferType<typeof createAppSchemaV2>;
