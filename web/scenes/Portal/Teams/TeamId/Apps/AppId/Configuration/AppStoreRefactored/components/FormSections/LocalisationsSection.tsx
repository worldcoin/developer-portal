import { Input } from "@/components/Input";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { formLanguagesList } from "@/lib/languages";
import { useRefetchQueries } from "@/lib/use-refetch-queries";
import {
  Control,
  Controller,
  FieldArrayWithId,
  FieldErrors,
  useWatch,
} from "react-hook-form";
import { FetchAppMetadataDocument } from "../../../graphql/client/fetch-app-metadata.generated";
import { AppStoreFormValues } from "../../form-schema";
import { FetchLocalisationsDocument } from "../../graphql/client/fetch-localisations.generated";
import { MetaTagImageField } from "../../ImageForm/MetaTagImageField";
import { ShowcaseImagesField } from "../../ImageForm/ShowcaseImagesField";
import { AppMetadata, FormSectionProps } from "../../types/AppStoreFormTypes";
import { FormSection } from "../FormFields/FormSection";

type LocalisationsSectionProps = FormSectionProps & {
  control: Control<AppStoreFormValues>;
  errors: FieldErrors<AppStoreFormValues>;
  localisations: FieldArrayWithId<AppStoreFormValues, "localisations", "id">[];
  appId: string;
  teamId: string;
  appMetadata: AppMetadata;
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
  const allPossibleLanguages = formLanguagesList;

  const { refetch: refetchAppMetadata } = useRefetchQueries(
    FetchAppMetadataDocument,
    { id: appId },
  );
  const { refetch: refetchLocalisations } = useRefetchQueries(
    FetchLocalisationsDocument,
    { app_metadata_id: appMetadata.id },
  );

  const supportedLanguages = useWatch({
    control,
    name: "supported_languages",
  });

  return (
    <FormSection
      title="Localisations *"
      description="Provide localized content for each supported language."
      className="grid gap-y-5"
    >
      <div className="max-h-[60vh] space-y-5 overflow-y-scroll rounded-lg border border-grey-200 p-4">
        {localisations.map((field, index) => {
          const languageLabel =
            allPossibleLanguages.find((lang) => lang.value === field.language)
              ?.label || field.language;

          return (
            <div key={field.id} className="grid gap-y-4 p-4">
              <Typography variant={TYPOGRAPHY.H7} className={"text-grey-700"}>
                {languageLabel}
              </Typography>

              <div className="grid gap-y-4">
                {/* name */}
                <Controller
                  control={control}
                  name={`localisations.${index}.name`}
                  render={({ field: nameField }) => (
                    <Input
                      label="App Name"
                      placeholder="Enter app name"
                      value={nameField.value || ""}
                      onChange={nameField.onChange}
                      disabled={!isEditable || !isEnoughPermissions}
                      errors={errors.localisations?.[index]?.name}
                    />
                  )}
                />

                {/* short_name */}
                <Controller
                  control={control}
                  name={`localisations.${index}.short_name`}
                  render={({ field: shortNameField }) => (
                    <Input
                      label="Short Name"
                      placeholder="Enter short name"
                      value={shortNameField.value || ""}
                      onChange={shortNameField.onChange}
                      disabled={!isEditable || !isEnoughPermissions}
                      errors={errors.localisations?.[index]?.short_name}
                    />
                  )}
                />

                {/* world_app_description */}
                <Controller
                  control={control}
                  name={`localisations.${index}.world_app_description`}
                  render={({ field: descField }) => (
                    <Input
                      label="App Tag Line"
                      placeholder="Enter app tag line"
                      value={descField.value || ""}
                      onChange={descField.onChange}
                      disabled={!isEditable || !isEnoughPermissions}
                      errors={
                        errors.localisations?.[index]?.world_app_description
                      }
                    />
                  )}
                />

                {/* description_overview */}
                <Controller
                  control={control}
                  name={`localisations.${index}.description_overview`}
                  render={({ field: overviewField }) => (
                    <Input
                      label="Description"
                      placeholder="Enter description"
                      value={overviewField.value || ""}
                      onChange={overviewField.onChange}
                      disabled={!isEditable || !isEnoughPermissions}
                      errors={
                        errors.localisations?.[index]?.description_overview
                      }
                    />
                  )}
                />

                {/* meta_tag_image_url */}
                <Controller
                  control={control}
                  name={`localisations.${index}.meta_tag_image_url`}
                  render={({ field: imageField }) => (
                    <MetaTagImageField
                      value={imageField.value}
                      onChange={imageField.onChange}
                      disabled={!isEditable || !isEnoughPermissions}
                      appId={appId}
                      teamId={teamId}
                      locale={field.language}
                      isAppVerified={
                        appMetadata?.verification_status === "verified"
                      }
                      appMetadataId={appMetadata.id}
                      supportedLanguages={supportedLanguages}
                      onAutosaveSuccess={() => {
                        refetchAppMetadata();
                        refetchLocalisations();
                      }}
                      onAutosaveError={(error) => {
                        console.error("Meta tag image autosave failed:", error);
                      }}
                    />
                  )}
                />

                {/* showcase_img_urls */}
                <Controller
                  control={control}
                  name={`localisations.${index}.showcase_img_urls`}
                  render={({ field: showcaseField }) => (
                    <ShowcaseImagesField
                      value={(showcaseField.value || []).filter(
                        (url): url is string => Boolean(url),
                      )}
                      onChange={showcaseField.onChange}
                      disabled={!isEditable || !isEnoughPermissions}
                      appId={appId}
                      teamId={teamId}
                      locale={field.language}
                      isAppVerified={
                        appMetadata?.verification_status === "verified"
                      }
                      appMetadataId={appMetadata.id}
                      supportedLanguages={supportedLanguages}
                      onAutosaveSuccess={() => {
                        refetchAppMetadata();
                        refetchLocalisations();
                      }}
                      onAutosaveError={(error) => {
                        console.error(
                          "Showcase images autosave failed:",
                          error,
                        );
                      }}
                    />
                  )}
                />
              </div>
            </div>
          );
        })}
      </div>
    </FormSection>
  );
};
