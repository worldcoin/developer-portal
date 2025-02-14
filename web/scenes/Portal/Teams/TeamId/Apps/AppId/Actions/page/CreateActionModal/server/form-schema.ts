import {
  allowedCommonCharactersRegex,
  allowedTitleCharactersRegex,
} from "@/lib/schema";
import * as yup from "yup";

export const createActionSchema = yup.object().shape({
  name: yup
    .string()
    .required("Name is required")
    .matches(
      allowedTitleCharactersRegex,
      "Name must contain only common characters",
    ),
  description: yup
    .string()
    .matches(
      allowedCommonCharactersRegex,
      "Description must contain only common characters",
    )
    .nullable(),
  action: yup.string().required("Action is required"),
  app_id: yup.string().required("App ID is required"),
  max_verifications: yup.number().required("Max verifications is required"),
  flow: yup
    .string()
    .oneOf(["VERIFY", "PARTNER"])
    .required("This field is required"),
  webhook_uri: yup.string().optional().url("Must be a valid URL"),
  webhook_pem: yup.string().when("webhook_uri", {
    is: (value: string) => !!value,
    then: (schema) =>
      schema.required("PEM is required when a webhook URL is provided"),
    otherwise: (schema) => schema.optional(),
  }),
});

export type CreateActionSchema = yup.Asserts<typeof createActionSchema>;
