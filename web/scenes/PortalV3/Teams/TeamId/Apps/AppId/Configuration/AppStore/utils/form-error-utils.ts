import { FormLanguage, languageMap } from "@/lib/languages";
import { FieldError, FieldErrors } from "react-hook-form";
import { AppStoreFormValues } from "../FormSchema/types";

export const MULTIPLE_ERRORS_TOAST_MESSAGE =
  "There are multiple errors in the form";

/**
 * extracts the localization index from a react-hook-form ref name
 * @example "localizations.2.name" -> 2
 */
function extractLocalizationIndex(refName?: string): number | null {
  if (!refName) return null;

  const parts = refName.split(".");
  const indexStr = parts.at(-2);
  const index = Number(indexStr);

  return Number.isFinite(index) ? index : null;
}

/**
 * formats an error message with the language label prefix
 */
function formatLocalizationErrorMessage(
  fieldError: FieldError,
  localisations: AppStoreFormValues["localisations"],
): string | null {
  const localizationIndex = extractLocalizationIndex(fieldError?.ref?.name);

  if (localizationIndex !== null && localisations[localizationIndex]) {
    const language = localisations[localizationIndex].language as FormLanguage;
    const languageLabel = languageMap[language].label;
    return fieldError.message
      ? `${languageLabel}: ${fieldError.message}`
      : null;
  }

  return fieldError?.message || null;
}

/**
 * extracts the first error from localization field errors
 */
function extractLocalizationError(
  localizationErrors: FieldErrors<AppStoreFormValues>["localisations"],
  localisations: AppStoreFormValues["localisations"],
): string | null {
  if (!Array.isArray(localizationErrors)) {
    return null;
  }

  // filters out undefined elements
  if (localizationErrors.filter(Boolean).length > 1) {
    return MULTIPLE_ERRORS_TOAST_MESSAGE;
  }

  for (const localizationError of localizationErrors) {
    if (!localizationError || typeof localizationError !== "object") {
      continue;
    }
    const errorFields = Object.keys(localizationError);

    if (errorFields.length > 1) {
      return MULTIPLE_ERRORS_TOAST_MESSAGE;
    }

    for (const field of errorFields) {
      const fieldError = localizationError[
        field as keyof typeof localizationError
      ] as FieldError;

      if (fieldError) {
        const errorMessage = formatLocalizationErrorMessage(
          fieldError,
          localisations,
        );
        if (errorMessage) {
          return errorMessage;
        }
      }
    }
  }

  return null;
}

/**
 * extracts the first error message from app store form for toast notification
 */
export const getFirstFormError = (
  errors: FieldErrors<AppStoreFormValues>,
  localisations: AppStoreFormValues["localisations"],
): string | null => {
  // check top level field errors
  const errorsIterable = Object.entries(errors) as [
    keyof AppStoreFormValues,
    FieldError,
  ][];

  if (errorsIterable.length > 1) {
    return MULTIPLE_ERRORS_TOAST_MESSAGE;
  }

  for (const [field, error] of errorsIterable) {
    if (field === "localisations") {
      continue;
    }
    if (error?.message) {
      return error.message;
    }
  }

  // check nested localization errors
  if (errors.localisations) {
    const localizationError = extractLocalizationError(
      errors.localisations,
      localisations,
    );
    if (localizationError) {
      return localizationError;
    }
  }

  return null;
};
