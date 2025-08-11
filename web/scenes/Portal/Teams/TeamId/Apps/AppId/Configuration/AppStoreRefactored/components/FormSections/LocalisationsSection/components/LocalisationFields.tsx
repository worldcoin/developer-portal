import { Input } from "@/components/Input";
import {
  Control,
  Controller,
  FieldArrayWithId,
  FieldErrors,
} from "react-hook-form";
import { AppStoreFormValues } from "../../../../FormSchema/types";
import { MetaTagImageField } from "../../../../ImageForm/MetaTagImageField";
import { ShowcaseImagesField } from "../../../../ImageForm/ShowcaseImagesField";
import { AppMetadata } from "../../../../types/AppStoreFormTypes";

interface LocalisationFieldsProps {
  control: Control<AppStoreFormValues>;
  errors: FieldErrors<AppStoreFormValues>;
  selectedIndex: number;
  selectedField: FieldArrayWithId<AppStoreFormValues, "localisations", "id">;
  isEditable: boolean;
  isEnoughPermissions: boolean;
  appId: string;
  teamId: string;
  appMetadata: AppMetadata;
  supportedLanguages: string[];
  onAutosaveSuccess: () => void;
  onAutosaveError: (error: any) => void;
}

export const LocalisationFields = ({
  control,
  errors,
  selectedIndex,
  selectedField,
  isEditable,
  isEnoughPermissions,
  appId,
  teamId,
  appMetadata,
  supportedLanguages,
  onAutosaveSuccess,
  onAutosaveError,
}: LocalisationFieldsProps) => {
  const disabled = !isEditable || !isEnoughPermissions;
  const fieldErrors = errors.localisations?.[selectedIndex];

  return (
    <div className="grid gap-y-4">
      {/* name */}
      <Controller
        control={control}
        name={`localisations.${selectedIndex}.name`}
        render={({ field }) => (
          <Input
            label="App Name"
            placeholder="Enter app name"
            value={field.value || ""}
            onChange={field.onChange}
            disabled={disabled}
            errors={fieldErrors?.name}
          />
        )}
      />

      {/* short_name */}
      <Controller
        control={control}
        name={`localisations.${selectedIndex}.short_name`}
        render={({ field }) => (
          <Input
            label="Short Name"
            placeholder="Enter short name"
            value={field.value || ""}
            onChange={field.onChange}
            disabled={disabled}
            errors={fieldErrors?.name}
          />
        )}
      />

      {/* world_app_description */}
      <Controller
        control={control}
        name={`localisations.${selectedIndex}.world_app_description`}
        render={({ field: descField }) => (
          <Input
            label="App Tag Line"
            placeholder="Enter app tag line"
            value={descField.value || ""}
            onChange={descField.onChange}
            disabled={!isEditable || !isEnoughPermissions}
            errors={
              errors.localisations?.[selectedIndex]?.world_app_description
            }
          />
        )}
      />

      {/* description_overview */}
      <Controller
        control={control}
        name={`localisations.${selectedIndex}.description_overview`}
        render={({ field: overviewField }) => (
          <Input
            label="Description"
            placeholder="Enter description"
            value={overviewField.value || ""}
            onChange={overviewField.onChange}
            disabled={!isEditable || !isEnoughPermissions}
            errors={errors.localisations?.[selectedIndex]?.description_overview}
          />
        )}
      />

      {/* meta tag image field */}
      <Controller
        control={control}
        name={`localisations.${selectedIndex}.meta_tag_image_url`}
        render={({ field }) => (
          <MetaTagImageField
            value={field.value}
            onChange={field.onChange}
            disabled={disabled}
            appId={appId}
            teamId={teamId}
            locale={selectedField.language}
            isAppVerified={appMetadata?.verification_status === "verified"}
            appMetadataId={appMetadata.id}
            supportedLanguages={supportedLanguages}
            error={fieldErrors?.meta_tag_image_url?.message}
            onAutosaveSuccess={onAutosaveSuccess}
            onAutosaveError={onAutosaveError}
          />
        )}
      />

      {/* showcase images field */}
      <Controller
        control={control}
        name={`localisations.${selectedIndex}.showcase_img_urls`}
        render={({ field }) => (
          <ShowcaseImagesField
            value={(field.value || []).filter((url): url is string =>
              Boolean(url),
            )}
            onChange={field.onChange}
            disabled={disabled}
            appId={appId}
            teamId={teamId}
            locale={selectedField.language}
            isAppVerified={appMetadata?.verification_status === "verified"}
            appMetadataId={appMetadata.id}
            supportedLanguages={supportedLanguages}
            error={fieldErrors?.showcase_img_urls?.message}
            onAutosaveSuccess={onAutosaveSuccess}
            onAutosaveError={onAutosaveError}
          />
        )}
      />
    </div>
  );
};
