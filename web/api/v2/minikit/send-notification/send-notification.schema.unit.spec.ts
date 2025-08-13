import { formLanguagesList } from "@/lib/languages";
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
const allSupportedLocalisations = formLanguagesList.map(({ value }) => ({
  language: value,
  title: "This is a title",
  message: "This is a message",
}));

describe("notifications", () => {
  const validTestCases: [
    string,
    yup.InferType<typeof sendNotificationBodySchemaV2>,
  ][] = [
    [
      "en language notification",
      {
        ...notificationBody,
        localisations: [
          {
            language: "en",
            title: "This is a title ${username}",
            message: "This is a message ${username}",
          },
        ],
      },
    ],
    [
      "multiple language notification",
      {
        ...notificationBody,
        localisations: [
          {
            language: "en",
            title: "This is a title",
            message: "This is a message",
          },
          {
            language: "pl",
            title: "To jest tytuł",
            message: "To jest wiadomość",
          },
          {
            language: "fr",
            title: "Tämä on otsikko",
            message: "Tämä on tekstiviesti",
          },
        ],
      },
    ],
    [
      "with username placeholder in title",
      {
        ...notificationBody,
        localisations: [
          {
            language: "en",
            title: "This is a title ${username}",
            message: "This is a message",
          },
          {
            language: "pl",
            title: "To jest tytuł",
            message: "To jest wiadomość ${username}",
          },
          {
            language: "fr",
            title: "Tämä on otsikko ${username}",
            message: "Tämä on tekstiviesti ${username}",
          },
        ],
      },
    ],
    [
      "all supported languages",
      {
        ...notificationBody,
        localisations: allSupportedLocalisations,
      },
    ],
  ];

  const invalidTestCases = [
    [
      "empty localisations",
      { ...notificationBody, localisations: {} } as yup.InferType<
        typeof sendNotificationBodySchemaV2
      >,
    ],
    [
      "missing en localisation",
      {
        ...notificationBody,
        localisations: [
          {
            language: "pl",
            title: "To jest tytuł",
            message: "To jest wiadomość",
          },
        ],
      } as yup.InferType<typeof sendNotificationBodySchemaV2>,
    ],
    [
      "too long title",
      {
        ...notificationBody,
        localisations: [
          {
            language: "en",
            title: "x".repeat(45),
            message: "x".repeat(45),
          },
        ],
      },
    ],
    [
      "too long with username",
      {
        ...notificationBody,
        localisations: [
          {
            language: "en",
            title: "${username}" + "x".repeat(20),
            message: "${username}" + "x".repeat(20),
          },
        ],
      },
    ],
    [
      "invalid characters",
      {
        ...notificationBody,
        localisations: [
          {
            language: "en",
            title: "${username} {invalid}",
            message: "${username}",
          },
        ],
      },
    ],
    [
      "unsupported localisation",
      {
        ...notificationBody,
        localisations: [
          {
            language: "en",
            title: "This is a title",
            message: "This is a message",
          },
          {
            language: "xx",
            title: "This is a title",
            message: "This is a message",
          },
        ],
      } as any,
    ],
  ];

  test.each(validTestCases)("should accept %s", (_, input) => {
    expect(sendNotificationBodySchemaV2.isValidSync(input)).toBe(true);
  });

  test.each(invalidTestCases)("should reject %s", (_, input) => {
    expect(sendNotificationBodySchemaV2.isValidSync(input)).toBe(false);
  });
});
