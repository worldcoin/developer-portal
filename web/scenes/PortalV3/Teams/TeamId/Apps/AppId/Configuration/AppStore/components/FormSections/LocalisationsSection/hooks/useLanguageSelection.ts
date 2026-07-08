import { FormLanguage } from "@/lib/languages";
import { atom, useAtom } from "jotai";
import { useEffect } from "react";
import { FieldArrayWithId } from "react-hook-form";
import { AppStoreFormValues } from "../../../../FormSchema/types";

// Owned here (the language tabs drive it) but shared: the rail's LivePreview
// follows whichever locale is being edited.
export const selectedLanguageAtom = atom<FormLanguage>("en");

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
  const [storedLanguage, setSelectedLanguage] = useAtom(selectedLanguageAtom);

  // The atom can briefly hold a language this app doesn't have (app switch,
  // language removed) — resolve to a valid selection for this render and let
  // the effect below normalize the atom.
  const storedLanguageExists = localisations.some(
    (l) => l.language === storedLanguage,
  );
  const selectedLanguage =
    storedLanguageExists || localisations.length === 0
      ? storedLanguage
      : getDefaultLanguage(localisations);

  useEffect(() => {
    if (!storedLanguageExists && localisations.length > 0) {
      setSelectedLanguage(getDefaultLanguage(localisations));
    }
  }, [localisations, storedLanguageExists, setSelectedLanguage]);

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
