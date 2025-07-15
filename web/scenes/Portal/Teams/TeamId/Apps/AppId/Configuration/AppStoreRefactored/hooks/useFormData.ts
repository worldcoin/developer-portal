import { useMemo } from "react";
import { AppStoreFormValues } from "../FormSchema/types";
import { AppMetadata, LocalisationData } from "../types/AppStoreFormTypes";
import {
  getLocalisationFormValues,
  transformMailtoToRawEmail,
} from "../utils/dataTransforms";

export const useFormData = (
  appMetadata: AppMetadata,
  localisationsData: LocalisationData,
) => {
  const defaultValues = useMemo((): Partial<AppStoreFormValues> => {
    const isSupportEmailDefault =
      appMetadata?.support_link?.startsWith("mailto:");

    return {
      ...appMetadata,
      // don't set these boolean fields from appMetadata so they start unchecked
      is_android_only: undefined,
      is_for_humans_only: undefined,
      supported_countries: appMetadata.supported_countries || [],
      supported_languages: appMetadata.supported_languages || ["en"],
      support_email: isSupportEmailDefault
        ? transformMailtoToRawEmail(appMetadata.support_link)
        : undefined,
      support_link: isSupportEmailDefault
        ? undefined
        : appMetadata.support_link,
      support_type: isSupportEmailDefault ? "email" : "link",
      localisations: getLocalisationFormValues(appMetadata, localisationsData),
    };
  }, [appMetadata, localisationsData]);

  const isEditable = appMetadata?.verification_status === "unverified";

  return {
    defaultValues,
    isEditable,
  };
};
