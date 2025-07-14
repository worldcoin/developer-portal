import { AppMode } from "@/lib/constants";
import * as yup from "yup";
const appModeSchema = yup
  .string()
  .oneOf(
    Object.keys(AppMode) as (keyof typeof AppMode)[],
    "App mode has to be a valid value",
  );

export const schema = yup
  .object()
  .shape({
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
    contracts: yup
      .string()
      .test(
        "is-valid-eth-address-list",
        "Each value must be a valid Worldchain address",
        function (value) {
          if (!value) return true;
          const addresses = value.split(",").map((addr) => addr.trim());
          const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
          return addresses.every((address) => ethAddressRegex.test(address));
        },
      )
      .nullable(),
    permit2_tokens: yup
      .string()
      .test(
        "is-valid-eth-address-list",
        "Each value must be a valid Worldchain address",
        function (value) {
          if (!value) return true;

          const addresses = value.split(",").map((addr) => addr.trim());
          const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
          return addresses.every((address) => ethAddressRegex.test(address));
        },
      )
      .nullable(),
    max_notifications_per_day: yup
      .mixed<number | string>()
      .oneOf([0, 1, 2, "unlimited"])
      .required(),
    can_import_all_contacts: yup.boolean().required(),
    is_allowed_unlimited_notifications: yup.boolean().required(),
  })
  .noUnknown();

export const updateSetupInitialSchema = schema
  .shape({
    app_mode: appModeSchema.required(),
  })
  .noUnknown();

export type UpdateSetupInitialSchema = yup.Asserts<
  typeof updateSetupInitialSchema
>;
