"use client";

import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { FieldErrors } from "react-hook-form";
import { ContentCardImageSection } from "../../AppStore/components/FormSections/ContentCardImageSection";
import { FormSection } from "../../AppStore/components/FormFields/FormSection";
import { AppStoreFormValues } from "../../AppStore/FormSchema/types";
import { AppMetadata } from "../../AppStore/types/AppStoreFormTypes";
import { LogoImageUpload } from "../../AppTopBar/LogoImageUpload";

type AppIconStepProps = {
  appId: string;
  teamId: string;
  appMetadata: AppMetadata;
  isEditable: boolean;
  isEnoughPermissions: boolean;
  isMiniApp: boolean;
  errors: FieldErrors<AppStoreFormValues & { logo_img_url?: string }>;
};

/**
 * Step 1 — the app icon (the "hero" users see first). Reuses the same
 * <LogoImageUpload> as the header, plus the store content card for mini apps.
 */
export const AppIconStep = ({
  appId,
  teamId,
  appMetadata,
  isEditable,
  isEnoughPermissions,
  isMiniApp,
  errors,
}: AppIconStepProps) => {
  return (
    <div className="grid gap-y-10">
      <div className="grid gap-y-2">
        <Typography variant={TYPOGRAPHY.H6} className="font-normal">
          App icon
        </Typography>
        <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
          This is your hero — the first thing people see. Upload a square PNG or
          JPG under 500&nbsp;kb.
        </Typography>
      </div>

      <FormSection title="App icon" description="Required aspect ratio 1:1.">
        <LogoImageUpload
          appId={appId}
          appMetadataId={appMetadata.id}
          teamId={teamId}
          editable={isEditable}
          isError={Boolean(errors.logo_img_url)}
          logoFile={appMetadata.logo_img_url}
        />
      </FormSection>

      {isMiniApp && (
        <ContentCardImageSection
          appId={appId}
          teamId={teamId}
          appMetadata={appMetadata}
          isEditable={isEditable}
          isEnoughPermissions={isEnoughPermissions}
          errors={errors}
        />
      )}
    </div>
  );
};
