import { CategoryNameIterable } from "@/lib/categories";
import * as yup from "yup";

export const BUILD_TYPES = ["staging", "production"] as const;
export const VERIFICATION_TYPES = ["cloud", "on-chain"] as const;

export const createAppSchema = yup.object({
  name: yup.string().required("This field is required"),
  build: yup.string().oneOf(BUILD_TYPES).default("production"),
  category: yup.string().oneOf(CategoryNameIterable).required(),
  integration_url: yup.string().url("Must be a valid URL").optional(),
  verification: yup.string().oneOf(VERIFICATION_TYPES).default("cloud"),
  app_mode: yup
    .string()
    .oneOf(["mini-app", "external", "native"])
    .default("mini-app"),
});
export type CreateAppSchema = yup.InferType<typeof createAppSchema>;
