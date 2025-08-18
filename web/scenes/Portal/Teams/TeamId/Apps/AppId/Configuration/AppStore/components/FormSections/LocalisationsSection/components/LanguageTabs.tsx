import { CountryBadge } from "@/components/CountryBadge";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { FormLanguage, languageMap } from "@/lib/languages";
import { FieldArrayWithId, FieldErrors } from "react-hook-form";
import { AppStoreFormValues } from "../../../../FormSchema/types";

interface LanguageTabsProps {
  localisations: FieldArrayWithId<AppStoreFormValues, "localisations", "id">[];
  selectedLanguage: FormLanguage;
  onLanguageSelect: (language: FormLanguage) => void;
  errors: FieldErrors<AppStoreFormValues>;
}

export const LanguageTabs = ({
  localisations,
  selectedLanguage,
  onLanguageSelect,
  errors,
}: LanguageTabsProps) => {
  return (
    <div className="mb-2 flex max-w-full flex-wrap gap-2 border-grey-200">
      {localisations.map((field, index) => {
        const language =
          languageMap[field.language as keyof typeof languageMap];
        const countryCode = language?.country_code;
        const languageLabel = language?.label || field.language;

        const hasError = Boolean(errors.localisations?.[index]);
        const isSelected = selectedLanguage === field.language;

        return (
          <CountryBadge
            key={field.language}
            onClick={() => onLanguageSelect(field.language as FormLanguage)}
            focused={isSelected}
            isError={hasError}
          >
            <img
              width={20}
              height={20}
              className="size-5"
              src={`${process.env.NEXT_PUBLIC_APP_URL}/icons/flags/${countryCode}.svg`}
              alt={`lang flag`}
            />
            <Typography variant={TYPOGRAPHY.R5}>{languageLabel}</Typography>
          </CountryBadge>
        );
      })}
    </div>
  );
};
