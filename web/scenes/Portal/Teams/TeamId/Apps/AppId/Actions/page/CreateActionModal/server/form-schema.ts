import { validatePublicKey } from "@/lib/crypto.server";
import {
  allowedCommonCharactersRegex,
  allowedTitleCharactersRegex,
} from "@/lib/schema";
import { validateUrl } from "@/lib/utils";
import * as yup from "yup";

// Check if not in production
export type ActionContext = {
  isProduction: boolean;
};

// Create a schema factory function that accepts the context
export const createActionSchema = (context: ActionContext) => {
  return yup
    .object({
      name: yup
        .string()
        .matches(
          allowedTitleCharactersRegex,
          "Name must contain only common characters",
        )
        .required("This field is required"),
      description: yup
        .string()
        .matches(
          allowedCommonCharactersRegex,
          "Description must contain only common characters",
        )
        .required(),
      action: yup.string().required("This field is required"),
      app_flow_on_complete: yup
        .string()
        .oneOf(["NONE", "VERIFY"])
        .required("This field is required"),
      max_verifications: yup
        .number()
        .typeError("Max verifications must be a number")
        .required("This field is required"),
      webhook_uri: yup
        .string()
        .optional()
        .test("is-url", "Must be a valid URL", (value) => {
          if (!value || !context.isProduction) return true;
          return validateUrl(value, !context.isProduction);
        }),
      webhook_pem: yup
        .string()
        .optional()
        .test({
          name: "is-valid-pem",
          message: "Must be a valid RSA public key in PEM format",
          test: (value) => {
            if (!value) return true;
            return validatePublicKey(value);
          },
        }),
      post_action_deep_link_ios: yup
        .string()
        .optional()
        .test("is-url", "Must be a valid URL", (value) => {
          if (!value || !context.isProduction) return true;
          return validateUrl(value, !context.isProduction);
        }),
      post_action_deep_link_android: yup
        .string()
        .optional()
        .test("is-url", "Must be a valid URL", (value) => {
          if (!value || !context.isProduction) return true;
          return validateUrl(value, !context.isProduction);
        }),
    })
    .noUnknown()
    .test(
      "webhook-fields",
      "Both webhook URL and PEM must be provided or removed",
      function (values) {
        const { webhook_uri, webhook_pem, app_flow_on_complete } = values;
        if (app_flow_on_complete === "NONE") return true;

        if ((webhook_uri && !webhook_pem) || (!webhook_uri && webhook_pem)) {
          const errorPath = !webhook_uri ? "webhook_uri" : "webhook_pem";
          return this.createError({
            path: errorPath,
            message: "Both webhook URL and PEM must be provided or removed",
          });
        }
        return true;
      },
    );
};

export type CreateActionSchema = yup.InferType<
  ReturnType<typeof createActionSchema>
>;
