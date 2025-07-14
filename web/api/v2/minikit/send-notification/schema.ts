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
      .of(yup.string().length(42))
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
  );
