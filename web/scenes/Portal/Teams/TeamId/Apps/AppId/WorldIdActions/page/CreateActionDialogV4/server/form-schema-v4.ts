import { allowedCommonCharactersRegex } from "@/lib/schema";
import * as yup from "yup";

export const createActionSchemaV4 = yup
  .object({
    action: yup
      .string()
      .required("Identifier is required")
      .max(32, "Identifier must be 32 characters or less")
      .matches(
        /^[a-z0-9-]+$/,
        "Identifier must be lowercase letters, numbers, and hyphens only",
      ),
    description: yup
      .string()
      .transform((value) => (value === "" ? undefined : value))
      .max(150, "Description must be 150 characters or less")
      .matches(
        allowedCommonCharactersRegex,
        "Description must contain only common characters",
      )
      .optional(),
    environment: yup.string().oneOf(["production"]).default("production"),
  })
  .noUnknown();

export type CreateActionSchemaV4 = yup.InferType<typeof createActionSchemaV4>;
