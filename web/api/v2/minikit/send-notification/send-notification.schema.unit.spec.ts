import * as yup from "yup";
import { sendNotificationBodySchemaV2 } from "./schema";

const testAppId = "app_testid";
const notificationBody = {
  app_id: testAppId,
  mini_app_path: `worldapp://mini-app?app_id=${testAppId}`,
  wallet_addresses: [
    "0x000000000000000000000000000000000000dead",
    "0x000000000000000000000000000000000001dead",
    "0x000000000000000000000000000000000002dead",
  ],
};
describe("notifications", () => {
  const validTestCases: [
    string,
    yup.InferType<typeof sendNotificationBodySchemaV2>,
  ][] = [
    [
      "en language notification",
      {
        ...notificationBody,
        localized_data: {
          en: {
            title: "This is a title ${username}",
            message: "This is a message ${username}",
          },
        },
      },
    ],
    [
      "multiple language notification",
      {
        ...notificationBody,
        localized_data: {
          en: {
            title: "This is a title",
            message: "This is a message",
          },
          pl: {
            title: "To jest tytuł",
            message: "To jest wiadomość",
          },
          fr: {
            title: "Tämä on otsikko",
            message: "Tämä on tekstiviesti",
          },
        },
      },
    ],
    [
      "with username placeholder in title",
      {
        ...notificationBody,
        localized_data: {
          en: {
            title: "This is a title ${username}",
            message: "This is a message",
          },
          pl: {
            title: "To jest tytuł",
            message: "To jest wiadomość ${username}",
          },
          fr: {
            title: "Tämä on otsikko ${username}",
            message: "Tämä on tekstiviesti ${username}",
          },
        },
      },
    ],
    [
      "only username placeholder",
      {
        ...notificationBody,
        localized_data: {
          en: {
            title: "${username}",
            message: "${username}",
          },
        },
      },
    ],
  ];

  const invalidTestCases = [
    [
      "empty localized_data",
      { ...notificationBody, localized_data: {} } as yup.InferType<
        typeof sendNotificationBodySchemaV2
      >,
    ],
    [
      "too long with username",
      {
        ...notificationBody,
        localized_data: {
          en: {
            title: "${username}" + "x".repeat(20),
            message: "${username}" + "x".repeat(20),
          },
        },
      },
    ],
    [
      "invalid characters",
      {
        ...notificationBody,
        localized_data: {
          en: {
            title: "${username} {invalid}",
            message: "${username}",
          },
        },
      },
    ],
  ];

  test.each(validTestCases)("should accept %s", (_, input) => {
    expect(sendNotificationBodySchemaV2.isValidSync(input)).toBe(true);
  });

  test.each(invalidTestCases)("should reject %s", (_, input) => {
    expect(sendNotificationBodySchemaV2.isValidSync(input)).toBe(false);
  });
});
