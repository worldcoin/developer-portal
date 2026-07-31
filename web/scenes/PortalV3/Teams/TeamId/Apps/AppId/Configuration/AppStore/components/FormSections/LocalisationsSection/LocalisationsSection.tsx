import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useUnverifiedImages } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppStore/hooks/use-localised-image-field";
import {
  Control,
  Controller,
  FieldArrayWithId,
  FieldErrors,
  FieldPath,
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
  installCommittedValue: (
    name: FieldPath<AppStoreFormValues>,
    value: unknown,
  ) => void;
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
  installCommittedValue,
}: LocalisationsSectionProps) => {
  const {
    selectedLanguage,
    setSelectedLanguage,
    selectedIndex,
    selectedField,
  } = useLanguageSelection(localisations);

  // One images subscription for both image fields of the selected locale.
  const { unverifiedImages, isImagesLoading } = useUnverifiedImages({
    appId,
    teamId,
    locale: selectedLanguage,
  });

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
            titleVariant={TYPOGRAPHY.S3}
          >
            <Controller
              control={control}
              name={`localisations.${selectedIndex}.showcase_img_urls`}
              render={({ field, fieldState }) => (
                <ShowcaseImagesField
                  value={(field.value || []).filter((url): url is string =>
                    Boolean(url),
                  )}
                  onCommittedValueChange={(urls) =>
                    installCommittedValue(
                      `localisations.${selectedIndex}.showcase_img_urls`,
                      urls,
                    )
                  }
                  disabled={!isEditable || !isEnoughPermissions}
                  appId={appId}
                  teamId={teamId}
                  locale={selectedLanguage}
                  isAppVerified={appMetadata.verification_status === "verified"}
                  appMetadataId={appMetadata.id}
                  supportedLanguages={supportedLanguages}
                  unverifiedImages={unverifiedImages}
                  isImagesLoading={isImagesLoading}
                  error={fieldState.error?.message}
                />
              )}
            />
          </FormSection>

          <FormSection
            title="Meta Tag Image"
            description="This image will be displayed as the opengraph meta tags image when linking your app. Fallback to your app's logo image if not provided."
            isRequiredAsterisk={false}
            titleVariant={TYPOGRAPHY.S3}
          >
            <Controller
              control={control}
              name={`localisations.${selectedIndex}.meta_tag_image_url`}
              render={({ field, fieldState }) => (
                <MetaTagImageField
                  value={field.value}
                  onCommittedValueChange={(url) =>
                    installCommittedValue(
                      `localisations.${selectedIndex}.meta_tag_image_url`,
                      url ?? "",
                    )
                  }
                  disabled={!isEditable || !isEnoughPermissions}
                  appId={appId}
                  teamId={teamId}
                  locale={selectedLanguage}
                  isAppVerified={appMetadata.verification_status === "verified"}
                  appMetadataId={appMetadata.id}
                  supportedLanguages={supportedLanguages}
                  unverifiedImages={unverifiedImages}
                  isImagesLoading={isImagesLoading}
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
