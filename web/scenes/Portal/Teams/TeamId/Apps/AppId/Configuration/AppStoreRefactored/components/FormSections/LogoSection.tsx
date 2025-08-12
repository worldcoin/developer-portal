import { useSearchParams } from "next/navigation";
import { FieldErrors } from "react-hook-form";
import { AppStoreFormValues } from "../../FormSchema/types";
import { LogoImageUpload } from "../../LogoImageUpload";
import { AppMetadata, FormSectionProps } from "../../types/AppStoreFormTypes";
import { FormSection } from "../FormFields/FormSection";

type LogoSectionProps = FormSectionProps & {
  appId: string;
  teamId: string;
  appMetadata: AppMetadata;
  errors?: FieldErrors<AppStoreFormValues & { logo_img_url?: string }>;
};

export const LogoSection = ({
  appId,
  teamId,
  appMetadata,
  isEditable,
  errors,
}: LogoSectionProps) => {
  const searchParams = useSearchParams();
  const shouldDefaultOpenLogoEditor = searchParams.get("editLogo") === "true";

  const hasLogoError = Boolean(errors?.logo_img_url);

  return (
    <FormSection
      title="Logo image"
      description="Specify the logo image for your app. Image has to have a 1:1 aspect ratio."
    >
      <LogoImageUpload
        appId={appId}
        appMetadataId={appMetadata.id}
        teamId={teamId}
        isEditable={isEditable}
        isError={hasLogoError}
        logoFile={appMetadata.logo_img_url}
        defaultOpen={shouldDefaultOpenLogoEditor}
      />
    </FormSection>
  );
};
