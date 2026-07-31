import { useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import {
  useLocalisedImageField,
  type UnverifiedImages,
} from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppStore/hooks/use-localised-image-field";
import { ImageUploadField } from "./ImageUploadField";

interface MetaTagImageFieldProps {
  value?: string | null;
  /** Installs the committed value without scheduling the form autosave. */
  onCommittedValueChange: (url: string | null) => void;
  disabled?: boolean;
  appId: string;
  teamId: string;
  locale?: string; // for non-english localizations
  isAppVerified: boolean;
  appMetadataId?: string;
  supportedLanguages: string[];
  unverifiedImages: UnverifiedImages | null;
  isImagesLoading: boolean;
  error?: string | null;
}

const TOAST_ID = "upload_meta_tag_toast";

export const MetaTagImageField = (props: MetaTagImageFieldProps) => {
  const {
    value,
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

  // convert single image to array format for base component
  const arrayValue = useMemo(() => {
    return value && typeof value === "string" ? [value] : [];
  }, [value]);

  const installValue = useCallback(
    (paths: string[]) => {
      onCommittedValueChange(paths[0] ?? null);
    },
    [onCommittedValueChange],
  );

  const handleUploadError = useCallback(() => {
    toast.update(TOAST_ID, {
      type: "error",
      render: "Error uploading meta tag image",
      autoClose: 2000,
    });
  }, []);

  const handlePersistSuccess = useCallback(() => {
    toast.success("Meta tag image saved successfully");
  }, []);

  const handlePersistError = useCallback((error: unknown) => {
    console.error("autosave failed:", error);
    toast.error("Failed to auto-save meta tag image");
  }, []);

  const { isUploading, pendingPreviewUrl, uploadFile, deleteImage } =
    useLocalisedImageField({
      kind: "meta_tag",
      appId,
      teamId,
      locale: locale ?? "en",
      appMetadataId,
      supportedLanguages,
      value: arrayValue,
      installValue,
      onUploadError: handleUploadError,
      onPersistSuccess: handlePersistSuccess,
      onPersistError: handlePersistError,
    });

  const handleUploadFile = useCallback(
    async (file: File) => {
      toast.info("Uploading meta tag image", {
        toastId: TOAST_ID,
        autoClose: false,
      });
      const succeeded = await uploadFile(file, "meta_tag_image");
      if (succeeded) {
        toast.update(TOAST_ID, {
          type: "success",
          render: "Meta tag image uploaded successfully",
          autoClose: 2000,
        });
      }
      return succeeded;
    },
    [uploadFile],
  );

  // extract unverified image URL for base component
  const previewUrls = useMemo(() => {
    const metaTagUrl = unverifiedImages?.meta_tag_image_url;
    return metaTagUrl ? [metaTagUrl] : [];
  }, [unverifiedImages]);

  return (
    <ImageUploadField
      value={arrayValue}
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
      maxImages={1}
      imageConstraints={{
        width: 1200,
        height: 600,
        aspectRatio: "2:1",
        recommendedSize: "1200x600px",
      }}
      imageTypeNamer={() => "meta_tag_image"}
      title="Meta Tag Image"
      error={error}
    />
  );
};
