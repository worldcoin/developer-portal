"use client";

import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Control, Controller } from "react-hook-form";
import { FormSection } from "../../AppStore/components/FormFields/FormSection";
import { AppStoreFormValues } from "../../AppStore/FormSchema/types";
import { MetaTagImageField } from "../../AppStore/ImageForm/MetaTagImageField";
import { ShowcaseImagesField } from "../../AppStore/ImageForm/ShowcaseImagesField";
import { AppMetadata } from "../../AppStore/types/AppStoreFormTypes";

type ShowcaseStepProps = {
  control: Control<AppStoreFormValues>;
  appId: string;
  teamId: string;
  appMetadata: AppMetadata;
  isEditable: boolean;
  isEnoughPermissions: boolean;
  supportedLanguages: string[];
  enIndex: number;
  onAutosaveSuccess: () => void;
};

/**
 * Step 2 — showcase + meta-tag images for the primary (English) locale. This is
 * the exact wiring <LocalisationsSection> uses, scoped to the en localisation;
 * per-locale images are edited later in the Localization step.
 */
export const ShowcaseStep = ({
  control,
  appId,
  teamId,
  appMetadata,
  isEditable,
  isEnoughPermissions,
  supportedLanguages,
  enIndex,
  onAutosaveSuccess,
}: ShowcaseStepProps) => {
  const isAppVerified = appMetadata.verification_status === "verified";
  const disabled = !isEditable || !isEnoughPermissions;

  return (
    <div className="grid gap-y-10">
      <div className="grid gap-y-2">
        <Typography variant={TYPOGRAPHY.H6} className="font-normal">
          Showcase images
        </Typography>
        <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
          Upload up to 3 images that show off your app.
        </Typography>
      </div>

      <FormSection
        title="Showcase Images"
        description="Upload up to 3 images to showcase your application."
        titleVariant={TYPOGRAPHY.S3}
      >
        <Controller
          control={control}
          name={`localisations.${enIndex}.showcase_img_urls`}
          render={({ field, fieldState }) => (
            <ShowcaseImagesField
              value={(field.value || []).filter((url): url is string =>
                Boolean(url),
              )}
              onChange={field.onChange}
              disabled={disabled}
              appId={appId}
              teamId={teamId}
              locale="en"
              isAppVerified={isAppVerified}
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
        description="Displayed as the opengraph meta tag image when linking your app. Falls back to your app's logo if not provided."
        isRequiredAsterisk={false}
        titleVariant={TYPOGRAPHY.S3}
      >
        <Controller
          control={control}
          name={`localisations.${enIndex}.meta_tag_image_url`}
          render={({ field, fieldState }) => (
            <MetaTagImageField
              value={field.value}
              onChange={field.onChange}
              disabled={disabled}
              appId={appId}
              teamId={teamId}
              locale="en"
              isAppVerified={isAppVerified}
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
  );
};
