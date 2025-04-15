// a place for common schema definitions that should remain uniform across the app

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
  /^[\u3000-\u303F\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\p{Letter}\p{Mark}\s0-9!,:/+&$._-]+$/u;

/** use for common characters and emojis */
export const allowCommonCharactersAndEmojisRegex =
  /^[\u{1F000}-\u{1F9FF}\u3000-\u303F\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\p{Letter}\p{Mark}\p{Punctuation}\s0-9+$]*[^{\\}]$/u;

/** use for titles with emojis */
export const allowTitleAndEmojisRegex =
  /^[\u{1F000}-\u{1F9FF}/^[\u3000-\u303F\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\p{Letter}\p{Mark}\s0-9!,:/+&$._-]+$/u;

export const httpsLinkSchema = ({
  excludeEmptyString = false,
}: {
  excludeEmptyString?: boolean;
} = {}) =>
  yup
    .string()
    .url("Invalid URL")
    .matches(/^https:\/\/(\w+-)*\w+(\.\w+)+([\/\w\-\+._/?%&#=]*)?$/, {
      message: "Must be a valid https URL",
      excludeEmptyString,
    });

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
  .max(11)
  .matches(allowedTitleCharactersRegex, {
    message: "App name can only contain letters, numbers and spaces",
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
  .max(35, "Annotation cannot exceed 35 characters")
  .test("no-links", "Links not allowed here", noLinks)
  .matches(allowedCommonCharactersRegex, {
    message:
      "Description can only contain letters, numbers and certain special characters.",
    excludeEmptyString: true,
  })
  .required();

export const appDescriptionOverviewSchema = yup
  .string()
  .max(1500, "Overview cannot exceed 1500 characters")
  .test("no-links", "Links not allowed here", noLinks)
  .matches(allowedCommonCharactersRegex, {
    message:
      "Overview can only contain letters, numbers and certain special characters.",
    excludeEmptyString: true,
  })
  .required("This section is required");

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
