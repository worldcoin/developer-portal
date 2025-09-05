import { FieldErrors } from "react-hook-form";
import { ContentCardImageUpload } from "../../ContentCardImageUpload";
import { AppStoreFormValues } from "../../FormSchema/types";
import { AppMetadata, FormSectionProps } from "../../types/AppStoreFormTypes";
import { FormSection } from "../FormFields/FormSection";

type ContentCardImageSectionProps = FormSectionProps & {
  appId: string;
  teamId: string;
  appMetadata: AppMetadata;
  errors?: FieldErrors<
    AppStoreFormValues & { content_card_image_url?: string }
  >;
};

export const ContentCardImageSection = ({
  appId,
  teamId,
  appMetadata,
  isEditable,
  errors,
}: ContentCardImageSectionProps) => {
  const hasContentCardError = Boolean(errors?.content_card_image_url);

  return (
    <FormSection
      title="Content card image"
      description="This image will be used when featuring your app in the Mini App Store. Required aspect ratio is 345px width and 240px height."
    >
      <ContentCardImageUpload
        appId={appId}
        appMetadataId={appMetadata.id}
        teamId={teamId}
        isEditable={isEditable}
        isError={hasContentCardError}
        contentCardImageFile={appMetadata.content_card_image_url}
        defaultOpen={false}
      />
    </FormSection>
  );
};
