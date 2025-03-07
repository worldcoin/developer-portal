import { validatePublicKey } from "@/lib/crypto.server";
import { validateUrl } from "@/lib/utils";
import * as yup from "yup";

export type ActionContext = {
  is_not_production: boolean;
};

// Create a schema factory function that accepts the context
export const createUpdateActionSchema = (context: ActionContext) => {
  return yup
    .object({
      name: yup.string().required("This field is required"),
      description: yup.string().required(),
      action: yup.string().required("This field is required"),
      max_verifications: yup
        .number()
        .typeError("Max verifications must be a number")
        .required("This field is required"),
      app_flow_on_complete: yup
        .string()
        .oneOf(["NONE", "VERIFY"])
        .required("This field is required"),
      webhook_uri: yup
        .string()
        .optional()
        .test("is-url", "Must be a valid URL", (value) => {
          if (!value) return true;
          return validateUrl(value, context.is_not_production);
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
};

export type UpdateActionSchema = yup.InferType<
  ReturnType<typeof createUpdateActionSchema>
>;
