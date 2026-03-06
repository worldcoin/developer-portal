import { formLanguagesList } from "@/lib/languages";
import {
  notificationMessageSchema,
  notificationTitleSchema,
} from "@/lib/schema";
import * as yup from "yup";

const USERNAME_SPECIAL_STRING = "${username}";

const isProduction = process.env.NEXT_PUBLIC_APP_ENV === "production";

const ALLOWED_UNIVERSAL_LINK_ORIGINS = isProduction
  ? ["https://world.org"]
  : ["https://staging.world.org"];

const isValidUniversalLink = (value: string): boolean => {
  try {
    const url = new URL(value);
    const isAllowedOrigin = ALLOWED_UNIVERSAL_LINK_ORIGINS.includes(url.origin);

    return (
      isAllowedOrigin &&
      url.pathname === "/verify" &&
      url.searchParams.get("t") === "deepface"
    );
  } catch {
    return false;
  }
};

const DEEP_FACE_DEEPLINK_PREFIX = "worldapp://verify?";

const isValidDeepFaceDeepLink = (value: string): boolean => {
  if (!value.startsWith(DEEP_FACE_DEEPLINK_PREFIX)) return false;
  try {
    const params = new URLSearchParams(
      value.slice(DEEP_FACE_DEEPLINK_PREFIX.length),
    );

    return params.get("t") === "deepface";
  } catch {
    return false;
  }
};

const isValidMiniAppDeepLink = (
  value: string | undefined,
  app_id: string,
): boolean => {
  if (!value) return false;
  return value.startsWith(`worldapp://mini-app?app_id=${app_id}`);
};

export const sendNotificationBodySchemaV1 = yup
  .object({
    app_id: yup.string().strict().required(),
    wallet_addresses: yup
      .array()
      .of(yup.string().length(42).required())
      .min(1)
      .max(1000)
      .required("wallet_addresses is required"),
    message: notificationMessageSchema,
    title: notificationTitleSchema,
    draft_id: yup.string().optional(),
    mini_app_path: yup
      .string()
      .strict()
      .required()
      .test(
        "valid-mini-app-path",
        "mini_app_path must be a valid WorldApp deeplink (worldapp://mini-app?app_id=), a Deep Face Universal Link (https://world.org/verify?t=deepface), or a Deep Face deeplink (worldapp://verify?t=deepface)",
        function (value) {
          const { app_id } = this.parent;
          return (
            isValidMiniAppDeepLink(value, app_id) ||
            isValidUniversalLink(value ?? "") ||
            isValidDeepFaceDeepLink(value ?? "")
          );
        },
      ),
  })
  .test(
    "title-length",
    "Title with substituted username cannot exceed 16 characters.",
    (value) => {
      // title can be 30 chars long max, username can be 14 chars long max
      if (value?.title?.includes(USERNAME_SPECIAL_STRING)) {
        const titleWithoutUsername = value.title.replace(
          USERNAME_SPECIAL_STRING,
          "",
        );

        return titleWithoutUsername.length <= 16;
      }
      return true;
    },
  )
  .noUnknown();

/** this validator is strict and will throw on unknown keys
 */
export const sendNotificationBodySchemaV2 = yup
  .object({
    app_id: yup.string().strict().required(),
    wallet_addresses: yup
      .array()
      .of(yup.string().length(42).required().strict())
      .min(1)
      .max(1000)
      .strict()
      .required("wallet_addresses is required"),
    mini_app_path: yup
      .string()
      .strict()
      .required()
      .test(
        "valid-mini-app-path",
        "mini_app_path must be a valid WorldApp deeplink (worldapp://mini-app?app_id=), a Deep Face Universal Link (https://world.org/verify?t=deepface), or a Deep Face deeplink (worldapp://verify?t=deepface)",
        function (value) {
          const { app_id } = this.parent;
          return (
            isValidMiniAppDeepLink(value, app_id) ||
            isValidUniversalLink(value ?? "") ||
            isValidDeepFaceDeepLink(value ?? "")
          );
        },
      ),
    draft_id: yup.string().optional(),
    localisations: yup
      .array()
      .of(
        yup.object({
          language: yup
            .string()
            .oneOf(formLanguagesList.map(({ value }) => value))
            .strict()
            .required(),
          title: notificationTitleSchema.test(
            "title-length",
            "Title with substituted username cannot exceed 16 characters.",
            (value) => {
              // title can be 30 chars long max, username can be 14 chars long max
              if (value?.includes(USERNAME_SPECIAL_STRING)) {
                const titleWithoutUsername = value.replace(
                  USERNAME_SPECIAL_STRING,
                  "",
                );

                return titleWithoutUsername.length <= 16;
              }
              return true;
            },
          ),
          message: notificationMessageSchema,
        }),
      )
      .strict()
      .required()
      .test("contains-en", "localisations must contain en locale", (value) => {
        return Boolean(value?.find(({ language }) => language === "en"));
      }),
  })
  .noUnknown();
