import { FormLanguage } from "@/lib/languages";
import { useEffect, useState } from "react";
import { FieldArrayWithId } from "react-hook-form";
import { AppStoreFormValues } from "../../../../FormSchema/types";

const getDefaultLanguage = (
  localisations: FieldArrayWithId<AppStoreFormValues, "localisations", "id">[],
): FormLanguage => {
  const englishLocalisation = localisations.find((l) => l.language === "en");
  return englishLocalisation
    ? "en"
    : (localisations[0]?.language as FormLanguage) || "en";
};

export const useLanguageSelection = (
  localisations: FieldArrayWithId<AppStoreFormValues, "localisations", "id">[],
) => {
  const [selectedLanguage, setSelectedLanguage] = useState<FormLanguage>(
    getDefaultLanguage(localisations),
  );

  // handle when selected language is removed
  useEffect(() => {
    const currentLanguageExists = localisations.some(
      (l) => l.language === selectedLanguage,
    );

    if (!currentLanguageExists && localisations.length > 0) {
      setSelectedLanguage(getDefaultLanguage(localisations));
    }
  }, [localisations, selectedLanguage]);

  const selectedIndex = localisations.findIndex(
    (field) => field.language === selectedLanguage,
  );
  const selectedField = localisations[selectedIndex];

  return {
    selectedLanguage,
    setSelectedLanguage,
    selectedIndex,
    selectedField,
  };
};
