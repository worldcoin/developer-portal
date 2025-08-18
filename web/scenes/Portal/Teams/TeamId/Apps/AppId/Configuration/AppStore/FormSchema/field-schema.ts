import { httpsLinkSchema as getHttpsLinkSchema } from "@/lib/schema";
import * as yup from "yup";

export const appWebsiteUrlSchema = getHttpsLinkSchema({
  message: "App Website URL must be a valid https URL",
}).required("App Website URL is required");

export const supportEmailSchema = yup.string().email("Invalid email address");

export const supportLinkSchema = yup
  .string()
  .test(
    "is-valid-support-link",
    "Must be a valid https URL or a miniapp deeplink (worldapp://mini-app?app_id=)",
    (value) => {
      if (!value) return true;

      // miniapp deeplink
      if (value.startsWith("worldapp://mini-app?app_id=")) {
        return true;
      }

      // https url
      if (
        getHttpsLinkSchema({
          message: "Support Link must be a valid https URL",
        }).isValidSync(value)
      ) {
        return true;
      }

      return false;
    },
  );

export const supportedCountriesSchema = yup
  .array(
    yup
      .string()
      .required("This field is required required")
      .length(2, "Invalid country code"),
  )
  .min(1, "Supported Countries is required")
  .required("Supported Countries is required")
  .default([]);
export const categorySchema = yup.string().optional();
export const isAndroidOnlySchema = yup
  .boolean()
  .typeError("This field is required")
  .required("This field is required");
export const isForHumansOnlySchema = yup
  .boolean()
  .typeError("This field is required")
  .required("This field is required");

export const appMetadataIdSchema = yup
  .string()
  .required("App metadata id is required");
