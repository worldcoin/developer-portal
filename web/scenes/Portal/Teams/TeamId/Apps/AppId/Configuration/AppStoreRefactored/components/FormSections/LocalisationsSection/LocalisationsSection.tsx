import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { formLanguagesList } from "@/lib/languages";
import { useRefetchQueries } from "@/lib/use-refetch-queries";
import { useCallback } from "react";
import {
  Control,
  FieldArrayWithId,
  FieldErrors,
  useWatch,
} from "react-hook-form";
import { FetchAppMetadataDocument } from "../../../../graphql/client/fetch-app-metadata.generated";
import { AppStoreFormValues } from "../../../FormSchema/types";
import { FetchLocalisationsDocument } from "../../../graphql/client/fetch-localisations.generated";
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
  appId: string;
  teamId: string;
  appMetadata: AppMetadata;
}

// get language label for header
const getLanguageLabel = (language: string) => {
  return (
    formLanguagesList.find((lang) => lang.value === language)?.label || language
  );
};

export const LocalisationsSection = ({
  control,
  errors,
  localisations,
  isEditable,
  isEnoughPermissions,
  appId,
  teamId,
  appMetadata,
}: LocalisationsSectionProps) => {
  const {
    selectedLanguage,
    setSelectedLanguage,
    selectedIndex,
    selectedField,
  } = useLanguageSelection(localisations);

  const supportedLanguages = useWatch({
    control,
    name: "supported_languages",
  });

  const { refetch: refetchAppMetadata } = useRefetchQueries(
    FetchAppMetadataDocument,
    { id: appId },
  );
  const { refetch: refetchLocalisations } = useRefetchQueries(
    FetchLocalisationsDocument,
    { app_metadata_id: appMetadata.id },
  );

  const handleAutosaveSuccess = useCallback(() => {
    refetchAppMetadata();
    refetchLocalisations();
  }, [refetchAppMetadata, refetchLocalisations]);

  const handleAutosaveError = useCallback((error: any) => {
    console.error("Autosave failed:", error);
  }, []);

  // fail-safe for empty state
  // en should always be defined
  if (localisations.length === 0) {
    return (
      <FormSection
        title="Localisations"
        description="Provide localized content for each supported language."
        className="grid gap-y-5"
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
      {/* language selection tabs */}
      <LanguageTabs
        localisations={localisations}
        selectedLanguage={selectedLanguage}
        onLanguageSelect={setSelectedLanguage}
        errors={errors}
      />

      {/* selected language content */}
      {selectedField && selectedIndex !== -1 && (
        <div key={selectedLanguage} className="grid gap-y-4">
          <LocalisationFields
            control={control}
            errors={errors}
            selectedIndex={selectedIndex}
            selectedField={selectedField}
            isEditable={isEditable}
            isEnoughPermissions={isEnoughPermissions}
            appId={appId}
            teamId={teamId}
            appMetadata={appMetadata}
            supportedLanguages={supportedLanguages}
            onAutosaveSuccess={handleAutosaveSuccess}
            onAutosaveError={handleAutosaveError}
          />
        </div>
      )}
    </FormSection>
  );
};
