import { TYPOGRAPHY, Typography } from "@/components/Typography";
import {
  Control,
  Controller,
  FieldArrayWithId,
  FieldErrors,
} from "react-hook-form";
import { AppStoreFormValues } from "../../../FormSchema/types";
import {
  AppMetadata,
  FormSectionProps,
} from "../../../types/AppStoreFormTypes";
import { FormSection } from "../../FormFields/FormSection";
import { MetaTagImageField } from "../../../ImageForm/MetaTagImageField";
import { ShowcaseImagesField } from "../../../ImageForm/ShowcaseImagesField";
import { LanguageTabs } from "./components/LanguageTabs";
import { LocalisationFields } from "./components/LocalisationFields";
import { useLanguageSelection } from "./hooks/useLanguageSelection";

interface LocalisationsSectionProps extends FormSectionProps {
  control: Control<AppStoreFormValues>;
  errors: FieldErrors<AppStoreFormValues>;
  localisations: FieldArrayWithId<AppStoreFormValues, "localisations", "id">[];
  appMetadata: AppMetadata;
  appId: string;
  teamId: string;
  supportedLanguages: string[];
  onAutosaveSuccess: () => void;
}

export const LocalisationsSection = ({
  control,
  errors,
  localisations,
  isEditable,
  isEnoughPermissions,
  appMetadata,
  appId,
  teamId,
  supportedLanguages,
  onAutosaveSuccess,
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

          <FormSection
            title="Showcase Images"
            description="Upload up to 3 images to showcase your application."
          >
            <Controller
              control={control}
              name={`localisations.${selectedIndex}.showcase_img_urls`}
              render={({ field, fieldState }) => (
                <ShowcaseImagesField
                  value={(field.value || []).filter((url): url is string =>
                    Boolean(url),
                  )}
                  onChange={field.onChange}
                  disabled={!isEditable || !isEnoughPermissions}
                  appId={appId}
                  teamId={teamId}
                  locale={selectedLanguage}
                  isAppVerified={appMetadata.verification_status === "verified"}
                  appMetadataId={appMetadata.id}
                  supportedLanguages={supportedLanguages}
                  onAutosaveSuccess={onAutosaveSuccess}
                  onAutosaveError={() => {}}
                  error={fieldState.error?.message}
                />
              )}
            />
          </FormSection>

          <FormSection
            title="Meta Tag Image"
            description="This image will be displayed as the opengraph meta tags image when linking your app. Fallback to your app's logo image if not provided."
            isRequiredAsterisk={false}
          >
            <Controller
              control={control}
              name={`localisations.${selectedIndex}.meta_tag_image_url`}
              render={({ field, fieldState }) => (
                <MetaTagImageField
                  value={field.value}
                  onChange={field.onChange}
                  disabled={!isEditable || !isEnoughPermissions}
                  appId={appId}
                  teamId={teamId}
                  locale={selectedLanguage}
                  isAppVerified={appMetadata.verification_status === "verified"}
                  appMetadataId={appMetadata.id}
                  supportedLanguages={supportedLanguages}
                  onAutosaveSuccess={onAutosaveSuccess}
                  onAutosaveError={() => {}}
                  error={fieldState.error?.message}
                />
              )}
            />
          </FormSection>
        </div>
      )}
    </FormSection>
  );
};
