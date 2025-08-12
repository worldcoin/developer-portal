import { FormLanguage, languageMap } from "@/lib/languages";
import { FieldError, FieldErrors } from "react-hook-form";
import { AppStoreFormValues } from "../FormSchema/types";

/**
 * extracts the localisation index from a react-hook-form ref name
 * @example "localisations.2.name" -> 2
 */
function extractLocalisationIndex(refName?: string): number | null {
  if (!refName) return null;

  const parts = refName.split(".");
  const indexStr = parts.at(-2);
  const index = Number(indexStr);

  return Number.isFinite(index) ? index : null;
}

/**
 * formats an error message with the language label prefix
 */
function formatLocalisationErrorMessage(
  fieldError: FieldError,
  localisations: AppStoreFormValues["localisations"],
): string | null {
  const localisationIndex = extractLocalisationIndex(fieldError?.ref?.name);

  if (localisationIndex !== null && localisations[localisationIndex]) {
    const language = localisations[localisationIndex].language as FormLanguage;
    const languageLabel = languageMap[language].label;
    return fieldError.message
      ? `${languageLabel}: ${fieldError.message}`
      : null;
  }

  return fieldError?.message || null;
}

/**
 * extracts the first error from localisation field errors
 */
function extractLocalisationError(
  localisationErrors: FieldErrors<AppStoreFormValues>["localisations"],
  localisations: AppStoreFormValues["localisations"],
): string | null {
  if (!Array.isArray(localisationErrors)) {
    return null;
  }

  for (const localisationError of localisationErrors) {
    if (!localisationError || typeof localisationError !== "object") {
      continue;
    }

    const errorFields = Object.keys(localisationError);

    if (errorFields.length > 1) {
      return "There are multiple errors in the form";
    }

    for (const field of errorFields) {
      const fieldError = localisationError[
        field as keyof typeof localisationError
      ] as FieldError;

      if (fieldError) {
        const errorMessage = formatLocalisationErrorMessage(
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
    return "There are multiple errors in the form";
  }

  for (const [field, error] of errorsIterable) {
    if (field === "localisations") {
      continue;
    }
    if (error?.message) {
      return error.message;
    }
  }

  // check nested localisation errors
  if (errors.localisations) {
    const localisationError = extractLocalisationError(
      errors.localisations,
      localisations,
    );
    if (localisationError) {
      return localisationError;
    }
  }

  return null;
};
