import { validatePublicKey } from "@/lib/crypto.server";
import {
  allowedCommonCharactersRegex,
  allowedTitleCharactersRegex,
} from "@/lib/schema";
import * as yup from "yup";

export const createActionSchema = yup
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
    webhook_uri: yup.string().optional().url("Must be a valid URL"),
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
  })
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

export type CreateActionSchema = yup.Asserts<typeof createActionSchema>;
