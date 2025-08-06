import { formLanguagesList } from "@/lib/languages";
import {
  notificationMessageSchema,
  notificationTitleSchema,
} from "@/lib/schema";
import * as yup from "yup";

const USERNAME_SPECIAL_STRING = "${username}";

export const sendNotificationBodySchema = yup
  .object({
    app_id: yup.string().strict().required(),
    wallet_addresses: yup
      .array()
      .of(yup.string().length(42).required())
      .min(1)
      .max(1000)
      .required("wallet_addresses is required")
      .test("unique-addresses", "wallet_addresses must be unique", (value) => {
        return new Set(value).size === value.length;
      }),
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
  );

const notificationLocalizedDataSchema = yup
  .object({
    title: notificationTitleSchema,
    message: notificationMessageSchema,
  })
  .optional()
  .strict();

const supportedLanguages = formLanguagesList.map(({ value }) => value);
const sendNotificationLocalizedDataMap = supportedLanguages.reduce(
  (acc, language) => {
    acc[language] = notificationLocalizedDataSchema;
    return acc;
  },
  {} as Record<
    (typeof supportedLanguages)[number],
    typeof notificationLocalizedDataSchema
  >,
);

/** this validator is strict and will throw on unknown keys
 */
export const sendNotificationBodySchemaV2 = yup
  .object({
    localized_data: yup
      .object(sendNotificationLocalizedDataMap)
      .strict()
      .optional()
      .noUnknown()
      .required()
      .test("contains-en", "localized_data must contain en locale", (value) => {
        return Boolean(value?.en?.title && value?.en?.message);
      }),
    app_id: yup.string().strict().required(),
    wallet_addresses: yup
      .array()
      .of(yup.string().length(42).strict())
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
  })
  .test(
    "titles-length",
    "Title with substituted username cannot exceed 16 characters.",
    function (this, value) {
      const localizedData = value?.localized_data ?? {};
      const keys = Object.keys(localizedData) as (keyof typeof localizedData)[];

      for (const key of keys) {
        const title = localizedData[key]?.title;

        // title can be 30 chars long max, username can be 14 chars long max
        if (title?.includes(USERNAME_SPECIAL_STRING)) {
          const titleWithoutUsername = title.replace(
            USERNAME_SPECIAL_STRING,
            "",
          );

          if (!titleWithoutUsername) {
            return;
          }

          if (titleWithoutUsername?.length > 16) {
            this.createError({
              message:
                "Titles with substituted username cannot exceed 16 characters.",
              path: `localized_data.${key}.title`,
            });
            return;
          }
        }
      }
      return true;
    },
  )
  .noUnknown()
  .strict();
