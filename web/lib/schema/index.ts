// a place for common schema definitions that should remain uniform across the app

import getEmojiRegex from "emoji-regex";
import * as yup from "yup";

/** use for entity ids (gen_random_friendly_id) */
export const entityIdSchema = yup
  .string()
  .matches(/^[a-zA-Z0-9]+_[a-zA-Z0-9]{32}$/, "Invalid id format");

/** use for app IDs */
export const appIdRegex = /^app_[a-f0-9]{32}$/;
export const appIdSchema = yup
  .string()
  .matches(appIdRegex, "app_id must be in format app_{32 hex chars}")
  .required();

/**
 * use for long form text
 *
 * a short overview of this lovely regex:
 *
 * \u3000-\u303F: CJK symbols and punctuation
 *
 * \u4E00-\u9FFF: CJK unified ideographs
 *
 * \u3040-\u309F: Hiragana
 *
 * \u30A0-\u30FF: Katakana
 *
 * \uFF00-\uFFEF: Halfwidth and fullwidth forms
 *
 * \p{Letter}: any letter in any language
 *
 * \p{Mark}: a character intended to be combined with another character (e.g. accents, umlauts, enclosing boxes, etc.).
 *
 * https://www.regular-expressions.info/unicode.html
 */
export const allowedCommonCharactersRegex =
  /^[\u3000-\u303F\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\p{Letter}\p{Mark}\p{Punctuation}\s0-9+$]*[^{\\}]$/u;

/** use for titles */
export const allowedTitleCharactersRegex =
  /^[\u3000-\u303F\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\p{Letter}\p{Mark}\p{Other_Punctuation}\s0-9+$]+$/u;

const emojiRegex = getEmojiRegex();

/** use for common characters and emojis */
export const allowCommonCharactersAndEmojisRegex = {
  test: function (value?: string | undefined) {
    if (!value) return true;

    // remove all emojis first
    let str = value;
    str = str.replace(emojiRegex, "");

    // if string is empty after removing emojis, it's valid
    if (str.length === 0) return true;

    // check if remaining characters match allowed common characters
    return allowedCommonCharactersRegex.test(str);
  },
};

/**
 * use for titles with emojis
 */
export const allowTitleAndEmojisRegex = {
  test: function (value?: string | undefined) {
    if (!value) return true;

    // remove all emojis first
    let str = value;
    str = str.replace(emojiRegex, "");

    // if string is empty after removing emojis, it's valid
    if (str.length === 0) return true;

    // check if remaining characters match allowed title characters
    return allowedTitleCharactersRegex.test(str);
  },
};

export const httpsLinkSchema = ({
  excludeEmptyString = false,
  message = "Must be a valid https URL",
}: {
  excludeEmptyString?: boolean;
  message?: string;
} = {}) =>
  yup
    .string()
    .url("Invalid URL")
    .matches(/^https:\/\/[\w-]+(\.\w+)+([\/\w\-\+._/?%&#=]*)?$/, {
      message,
      excludeEmptyString,
    });

/**
 * Schema for HTTPS URLs that:
 * - Transforms URLs without protocol to add https://
 * - Rejects non-HTTPS protocols (http://, ftp://, etc.)
 * - Validates HTTPS URL format
 */
export const httpsUrlSchema = ({
  required = false,
}: {
  required?: boolean;
} = {}) => {
  let schema = yup
    .string()
    .transform((value) => {
      if (!value || value.trim() === "") return value;
      if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value)) return value;
      return `https://${value}`;
    })
    .test(
      "no-non-https-protocol",
      "URL must use HTTPS (e.g., https://example.com)",
      function (value) {
        if (!value || value.trim() === "") return true;
        const hasProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value);
        return !hasProtocol || value.startsWith("https://");
      },
    )
    .url("Must be a valid URL")
    .matches(/^https:\/\/(\w+-)*\w+(\.\w+)+([\/\w\-._/?%&#=]*)?$/, {
      message: "URL must use HTTPS (e.g., https://example.com)",
      excludeEmptyString: true,
    });

  if (required) {
    schema = schema.required("This field is required");
  } else {
    schema = schema.optional();
  }

  return schema;
};

function noLinks(value: string | undefined) {
  if (!value) return true;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return !urlRegex.test(value);
}

/** */
/** app/app metadata schemas */
/** */
export const appNameSchema = yup
  .string()
  .required("App name is required")
  .max(50, "App name cannot exceed 50 characters")
  .matches(allowedTitleCharactersRegex, {
    message: "App name can only contain letters, numbers and spaces",
    excludeEmptyString: true,
  });

export const appShortNameSchema = yup
  .string()
  .required("Short name is required")
  .max(11, "Short name cannot exceed 11 characters")
  .matches(allowedTitleCharactersRegex, {
    message: "Short Name can only contain letters, numbers and spaces",
    excludeEmptyString: true,
  });

export const appWorldAppButtonTextSchema = yup
  .string()
  .max(25, "Content cannot exceed 25 characters")
  .matches(allowedCommonCharactersRegex, {
    message:
      "Button text can only contain letters, numbers and certain special characters.",
    excludeEmptyString: true,
  })
  .optional();

export const appWorldAppDescriptionSchema = yup
  .string()
  .max(40, "Annotation cannot exceed 40 characters")
  .test("no-links", "Links not allowed here", noLinks)
  .matches(allowedCommonCharactersRegex, {
    message:
      "App Tag Line can only contain letters, numbers and certain special characters.",
    excludeEmptyString: true,
  })
  .required("App Tag Line is a required field");

export const appDescriptionOverviewSchema = yup
  .string()
  .max(1500, "Overview cannot exceed 1500 characters")
  .test("no-links", "Links not allowed here", noLinks)
  .matches(allowedCommonCharactersRegex, {
    message:
      "Overview can only contain letters, numbers and certain special characters.",
    excludeEmptyString: true,
  })
  .required("Description is required");

export const appDescriptionHowItWorksSchema = yup
  .string()
  .max(1500, "How it works cannot exceed 1500 characters")
  .test("no-links", "Links not allowed here", noLinks)
  .matches(allowedCommonCharactersRegex, {
    message:
      "How it works can only contain letters, numbers and certain special characters.",
    excludeEmptyString: true,
  })
  .optional();

export const appDescriptionConnectSchema = yup
  .string()
  .max(1500, "How to connect cannot exceed 1500 characters")
  .test("no-links", "Links not allowed here", noLinks)
  .matches(allowedCommonCharactersRegex, {
    message:
      "How to connect can only contain letters, numbers and certain special characters.",
    excludeEmptyString: true,
  })
  .optional();
export const appChangelogSchema = yup
  .string()
  .matches(allowedCommonCharactersRegex, {
    message:
      "Changelog can only contain letters, numbers and certain special characters.",
  })
  .min(10, "Provide a changelog, 10 characters minimum")
  .max(1500, "Changelog cannot exceed 1500 characters")
  .required("Changelog is required");

export const appStoreImageSchema = yup
  .string()
  .matches(
    /^[a-zA-Z]{2}\/[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/,
    "Invalid image format",
  );

/** this should be allowed, later on replaced by actual username */
const NOTIFICATION_USERNAME_SPECIAL_STRING = "${username}";

/** use for common characters and emojis */
export const notificationMessageSchema = yup
  .string()
  .strict()
  .required()
  .max(200)
  .test(
    "valid-message-with-emojis",
    "Message can only contain letters, numbers, punctuation, emojis, spaces or special strings",
    (value: string | undefined) => {
      // fail on empty string
      if (!value) return false;

      // remove special string and check if the remainder is valid
      const valueWithoutSpecialString = value.replace(
        NOTIFICATION_USERNAME_SPECIAL_STRING,
        "",
      );

      return allowCommonCharactersAndEmojisRegex.test(
        valueWithoutSpecialString,
      );
    },
  );

export const notificationTitleSchema = yup
  .string()
  .required()
  .max(30)
  .strict()
  .test(
    "valid-title-with-emojis",
    "Title can only contain letters, numbers, punctuation, emojis, and spaces",
    (value: string | undefined) => {
      if (!value) return false;

      // remove special string and check if the remainder is valid
      const valueWithoutSpecialString = value.replace(
        NOTIFICATION_USERNAME_SPECIAL_STRING,
        "",
      );

      return allowTitleAndEmojisRegex.test(valueWithoutSpecialString);
    },
  );

export const teamNameSchema = yup
  .string()
  .required("Please enter a team name")
  .max(128, "Team name must be 128 characters or less")
  .matches(allowedTitleCharactersRegex, {
    message: "Team name can only contain letters, numbers and spaces",
    excludeEmptyString: true,
  });
