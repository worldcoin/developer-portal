import { AppMode } from "@/lib/constants";
import * as yup from "yup";
const appModeSchema = yup
  .string()
  .oneOf(
    Object.keys(AppMode) as (keyof typeof AppMode)[],
    "App mode has to be a valid value",
  );

export const schema = yup.object().shape({
  app_mode: appModeSchema,
  whitelisted_addresses: yup.string().nullable(),
  is_whitelist_disabled: yup.boolean(),
  associated_domains: yup
    .string()
    .test(
      "is-valid-https-url-list",
      "Each value must be a valid HTTPS URL",
      function (value) {
        if (!value) return true;

        const domains = value.split(",").map((domain) => domain.trim());
        const httpsUrlRegex = /^https:\/\/[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/;
        return domains.every((domain) => httpsUrlRegex.test(domain));
      },
    )
    .nullable(),
  contracts: yup.string().nullable(),
  permit2_tokens: yup.string().nullable(),
});

export const updateSetupInitialSchema = schema.shape({
  app_mode: appModeSchema.required(),
});

export type UpdateSetupInitialSchema = yup.Asserts<
  typeof updateSetupInitialSchema
>;
// const associated_domains =
// values.associated_domains && values.associated_domains.length > 0
//   ? formatMultipleStringInput(values.associated_domains)
//   : null;

// const contracts =
// values.contracts && values.contracts.length > 0
//   ? formatMultipleStringInput(values.contracts)
//   : null;

// const permit2_tokens =
// values.permit2_tokens && values.permit2_tokens.length > 0
//   ? formatMultipleStringInput(values.permit2_tokens)
//   : null;

// // If the user disabled the whitelist, we should set the whitelisted_addresses to null
// const whitelistedAddresses = values.is_whitelist_disabled
// ? null
// : formatMultipleStringInput(values.whitelisted_addresses);
