import * as yup from "yup";

const rsaPublicKeyRegex =
  /^-----BEGIN RSA PUBLIC KEY-----\s+([A-Za-z0-9+/=\s]+)-----END RSA PUBLIC KEY-----\s*$/;

export const updateActionSchema = yup
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
    webhook_uri: yup.string().optional().url("Must be a valid URL"),
    webhook_pem: yup.string().optional().matches(rsaPublicKeyRegex, {
      message:
        "Must be a valid RSA public key in PEM format (BEGIN/END lines, base64 data).",
      excludeEmptyString: true,
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

export type UpdateActionSchema = yup.Asserts<typeof updateActionSchema>;
