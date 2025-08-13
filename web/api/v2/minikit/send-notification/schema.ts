import { formLanguagesList } from "@/lib/languages";
import {
  notificationMessageSchema,
  notificationTitleSchema,
} from "@/lib/schema";
import * as yup from "yup";

const USERNAME_SPECIAL_STRING = "${username}";

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
    mini_app_path: yup
      .string()
      .strict()
      .required()
      .test(
        "contains-app-id",
        "mini_app_path must include the app_id and be a valid WorldApp deeplink",
        function (value) {
          const { app_id } = this.parent;
          return value.startsWith(`worldapp://mini-app?app_id=${app_id}`);
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
        "contains-app-id",
        "mini_app_path must include the app_id and be a valid WorldApp deeplink starting with 'worldapp://mini-app?app_id='",
        function (value) {
          const { app_id } = this.parent;
          return value.startsWith(`worldapp://mini-app?app_id=${app_id}`);
        },
      ),
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
