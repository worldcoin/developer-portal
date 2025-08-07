import { useSearchParams } from "next/navigation";
import { LogoImageUpload } from "../../LogoImageUpload";
import { AppMetadata } from "../../types/AppStoreFormTypes";
import { FormSection } from "../FormFields/FormSection";

type LogoSectionProps = {
  appId: string;
  teamId: string;
  appMetadata: AppMetadata;
  isEditable: boolean;
};

export const LogoSection = ({
  appId,
  teamId,
  appMetadata,
  isEditable,
}: LogoSectionProps) => {
  const searchParams = useSearchParams();
  const shouldDefaultOpenLogoEditor = searchParams.get("editLogo") === "true";
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
        isError={false}
        logoFile={appMetadata.logo_img_url}
        defaultOpen={shouldDefaultOpenLogoEditor}
      />
    </FormSection>
  );
};
