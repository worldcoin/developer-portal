import { formLanguagesList } from "@/lib/languages";
import * as yup from "yup";
import {
  sendNotificationBodySchemaV1,
  sendNotificationBodySchemaV2,
} from "./schema";

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
    [
      "deep face app link as mini_app_path",
      {
        ...notificationBody,
        mini_app_path:
          "https://world.org/verify?t=deepface&i=550e8400-e29b-41d4-a716-446655440000&k=dGVzdC1rZXk%3D",
        localisations: [
          {
            language: "en",
            title: "This is a title",
            message: "This is a message",
          },
        ],
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
    [
      "deep face link missing t=deepface param",
      {
        ...notificationBody,
        mini_app_path:
          "https://world.org/verify?i=550e8400-e29b-41d4-a716-446655440000&k=dGVzdC1rZXk",
        localisations: [
          {
            language: "en",
            title: "This is a title",
            message: "This is a message",
          },
        ],
      },
    ],
    [
      "deep face link missing i param",
      {
        ...notificationBody,
        mini_app_path: "https://world.org/verify?t=deepface&k=dGVzdC1rZXk",
        localisations: [
          {
            language: "en",
            title: "This is a title",
            message: "This is a message",
          },
        ],
      },
    ],
    [
      "deep face link missing k param",
      {
        ...notificationBody,
        mini_app_path:
          "https://world.org/verify?t=deepface&i=550e8400-e29b-41d4-a716-446655440000",
        localisations: [
          {
            language: "en",
            title: "This is a title",
            message: "This is a message",
          },
        ],
      },
    ],
    [
      "deep face link with wrong domain",
      {
        ...notificationBody,
        mini_app_path:
          "https://evil.org/verify?t=deepface&i=550e8400-e29b-41d4-a716-446655440000&k=dGVzdC1rZXk",
        localisations: [
          {
            language: "en",
            title: "This is a title",
            message: "This is a message",
          },
        ],
      },
    ],
    [
      "deep face link with wrong path",
      {
        ...notificationBody,
        mini_app_path:
          "https://world.org/other?t=deepface&i=550e8400-e29b-41d4-a716-446655440000&k=dGVzdC1rZXk",
        localisations: [
          {
            language: "en",
            title: "This is a title",
            message: "This is a message",
          },
        ],
      },
    ],
    [
      "random https URL as mini_app_path",
      {
        ...notificationBody,
        mini_app_path: "https://example.com/some-path",
        localisations: [
          {
            language: "en",
            title: "This is a title",
            message: "This is a message",
          },
        ],
      },
    ],
    [
      "deep face link with empty i param",
      {
        ...notificationBody,
        mini_app_path: "https://world.org/verify?t=deepface&i=&k=dGVzdC1rZXk",
        localisations: [
          {
            language: "en",
            title: "This is a title",
            message: "This is a message",
          },
        ],
      },
    ],
    [
      "deep face link with empty k param",
      {
        ...notificationBody,
        mini_app_path:
          "https://world.org/verify?t=deepface&i=550e8400-e29b-41d4-a716-446655440000&k=",
        localisations: [
          {
            language: "en",
            title: "This is a title",
            message: "This is a message",
          },
        ],
      },
    ],
  ];

  test.each(validTestCases)("should accept %s", (_, input) => {
    expect(sendNotificationBodySchemaV2.isValidSync(input)).toBe(true);
  });

  test("accepts v1 without draft_id", () => {
    expect(
      sendNotificationBodySchemaV1.isValidSync({
        ...notificationBody,
        title: "This is a title",
        message: "This is a message",
      }),
    ).toBe(true);
  });

  test("preserves draft_id through v1 schema validation", async () => {
    const input = {
      ...notificationBody,
      draft_id: "meta_abc123draft",
      title: "This is a title",
      message: "This is a message",
    };
    const result = await sendNotificationBodySchemaV1.validate(input);
    expect(result.draft_id).toBe("meta_abc123draft");
  });

  test("preserves draft_id through v2 schema validation", async () => {
    const input = {
      ...notificationBody,
      draft_id: "meta_abc123draft",
      localisations: [
        {
          language: "en",
          title: "This is a title",
          message: "This is a message",
        },
      ],
    };
    const result = await sendNotificationBodySchemaV2.validate(input);
    expect(result.draft_id).toBe("meta_abc123draft");
  });

  test.each(invalidTestCases)("should reject %s", (_, input) => {
    expect(sendNotificationBodySchemaV2.isValidSync(input)).toBe(false);
  });
});

describe("V1 schema mini_app_path validation", () => {
  const v1Body = {
    app_id: testAppId,
    wallet_addresses: ["0x000000000000000000000000000000000000dead"],
    title: "This is a title",
    message: "This is a message",
  };

  test("should accept worldapp deeplink", () => {
    expect(
      sendNotificationBodySchemaV1.isValidSync({
        ...v1Body,
        mini_app_path: `worldapp://mini-app?app_id=${testAppId}`,
      }),
    ).toBe(true);
  });

  test("should accept deep face app link", () => {
    expect(
      sendNotificationBodySchemaV1.isValidSync({
        ...v1Body,
        mini_app_path:
          "https://world.org/verify?t=deepface&i=550e8400-e29b-41d4-a716-446655440000&k=dGVzdC1rZXk%3D",
      }),
    ).toBe(true);
  });

  test("should reject random URL", () => {
    expect(
      sendNotificationBodySchemaV1.isValidSync({
        ...v1Body,
        mini_app_path: "https://example.com",
      }),
    ).toBe(false);
  });
});
