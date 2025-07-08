import { useMemo } from "react";
import { AppStoreFormValues } from "../form-schema";
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

  return {
    defaultValues,
  };
};
