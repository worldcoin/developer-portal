import { useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import {
  useLocalisedImageField,
  type UnverifiedImages,
} from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppStore/hooks/use-localised-image-field";
import { ImageUploadField } from "./ImageUploadField";

interface ShowcaseImagesFieldProps {
  value?: string[];
  /** Installs the committed value without scheduling the form autosave. */
  onCommittedValueChange: (urls: string[]) => void;
  disabled?: boolean;
  appId: string;
  teamId: string;
  locale: string; // for non-english localizations
  isAppVerified: boolean;
  appMetadataId?: string;
  supportedLanguages: string[];
  unverifiedImages: UnverifiedImages | null;
  isImagesLoading: boolean;
  error?: string | null;
}

const TOAST_ID = "upload_showcase_toast";

export const ShowcaseImagesField = (props: ShowcaseImagesFieldProps) => {
  const {
    value = [],
    onCommittedValueChange,
    disabled = false,
    appId,
    teamId,
    locale,
    isAppVerified,
    appMetadataId,
    supportedLanguages,
    unverifiedImages,
    isImagesLoading,
    error,
  } = props;

  const handleUploadError = useCallback(() => {
    toast.update(TOAST_ID, {
      type: "error",
      render: "Error uploading showcase image",
      autoClose: 2000,
    });
  }, []);

  const handlePersistSuccess = useCallback(() => {
    toast.success("Showcase images saved successfully");
  }, []);

  const handlePersistError = useCallback((error: unknown) => {
    console.error("autosave failed:", error);
    toast.error("Failed to auto-save showcase images");
  }, []);

  const { isUploading, pendingPreviewUrl, uploadFile, deleteImage } =
    useLocalisedImageField({
      kind: "showcase",
      appId,
      teamId,
      locale,
      appMetadataId,
      supportedLanguages,
      value,
      installValue: onCommittedValueChange,
      onUploadError: handleUploadError,
      onPersistSuccess: handlePersistSuccess,
      onPersistError: handlePersistError,
    });

  const handleUploadFile = useCallback(
    async (file: File) => {
      toast.info("Uploading showcase image", {
        toastId: TOAST_ID,
        autoClose: false,
      });
      const succeeded = await uploadFile(
        file,
        `showcase_img_${value.length + 1}`,
      );
      if (succeeded) {
        toast.update(TOAST_ID, {
          type: "success",
          render: "Showcase image uploaded successfully",
          autoClose: 2000,
        });
      }
      return succeeded;
    },
    [uploadFile, value.length],
  );

  // extract unverified image URLs for base component
  const previewUrls = useMemo(() => {
    return unverifiedImages?.showcase_img_urls ?? [];
  }, [unverifiedImages]);

  // image type namer for showcase images
  const imageTypeNamer = useCallback((currentCount: number) => {
    return `showcase_img_${currentCount + 1}`;
  }, []);

  return (
    <ImageUploadField
      value={value}
      disabled={disabled}
      appId={appId}
      locale={locale}
      isAppVerified={isAppVerified}
      previewUrls={previewUrls}
      isImagesLoading={isImagesLoading}
      isUploading={isUploading}
      pendingPreviewUrl={pendingPreviewUrl}
      onUploadFile={handleUploadFile}
      onDelete={deleteImage}
      maxImages={3}
      imageConstraints={{
        width: 1080,
        height: 1080,
        aspectRatio: "1:1",
        recommendedSize: "1080x1080px",
      }}
      imageTypeNamer={imageTypeNamer}
      title="Showcase Images"
      error={error}
    />
  );
};
