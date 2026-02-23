import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Control, FieldArrayWithId, FieldErrors } from "react-hook-form";
import { AppStoreFormValues } from "../../../FormSchema/types";
import {
  AppMetadata,
  FormSectionProps,
} from "../../../types/AppStoreFormTypes";
import { FormSection } from "../../FormFields/FormSection";
import { LanguageTabs } from "./components/LanguageTabs";
import { LocalisationFields } from "./components/LocalisationFields";
import { useLanguageSelection } from "./hooks/useLanguageSelection";

interface LocalisationsSectionProps extends FormSectionProps {
  control: Control<AppStoreFormValues>;
  errors: FieldErrors<AppStoreFormValues>;
  localisations: FieldArrayWithId<AppStoreFormValues, "localisations", "id">[];
  appMetadata: AppMetadata;
}

export const LocalisationsSection = ({
  control,
  errors,
  localisations,
  isEditable,
  isEnoughPermissions,
  appMetadata,
}: LocalisationsSectionProps) => {
  const {
    selectedLanguage,
    setSelectedLanguage,
    selectedIndex,
    selectedField,
  } = useLanguageSelection(localisations);

  // fail-safe for empty state
  // en should always be defined
  if (localisations.length === 0) {
    return (
      <FormSection
        title="Localisations"
        description="Provide localized content for each supported language."
      >
        <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
          No languages selected. Please add languages in the Supported Languages
          section.
        </Typography>
      </FormSection>
    );
  }

  return (
    <FormSection
      title="Localisations"
      description="Provide localized content for each supported language."
      className="grid gap-y-5"
    >
      <LanguageTabs
        localisations={localisations}
        selectedLanguage={selectedLanguage}
        onLanguageSelect={setSelectedLanguage}
        errors={errors}
      />

      {selectedField && selectedIndex !== -1 && (
        <div key={selectedLanguage} className="grid gap-y-4">
          <LocalisationFields
            control={control}
            errors={errors}
            selectedIndex={selectedIndex}
            isEditable={isEditable}
            isEnoughPermissions={isEnoughPermissions}
            isMiniApp={appMetadata.app_mode === "mini-app"}
          />
        </div>
      )}
    </FormSection>
  );
};
