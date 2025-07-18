import { useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import { useFetchImagesQuery } from "../../graphql/client/fetch-images.generated";
import { useUpsertLocalisedShowcaseImagesMutation } from "../graphql/client/upsert-localised-showcase-images.generated";
import { extractImagePathWithExtensionFromActualUrl } from "../utils";
import { ImageUploadField } from "./ImageUploadField";

interface ShowcaseImagesFieldProps {
  value?: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
  appId: string;
  teamId: string;
  locale: string; // for non-english localizations
  isAppVerified: boolean;
  appMetadataId?: string;
  supportedLanguages: string[];
  error?: string | null;
  onAutosaveSuccess?: () => void;
  onAutosaveError?: (error: any) => void;
}

const TOAST_ID = "upload_showcase_toast";

export const ShowcaseImagesField = (props: ShowcaseImagesFieldProps) => {
  const {
    value = [],
    onChange,
    disabled = false,
    appId,
    teamId,
    locale,
    isAppVerified,
    appMetadataId,
    supportedLanguages,
    error,
    onAutosaveSuccess,
    onAutosaveError,
  } = props;

  // en is not considered a localization, since we set english properties on app metadata
  const isLocalized = locale !== "en";

  const {
    data: unverifiedImagesData,
    loading: isImagesLoading,
    refetch: refetchUnverifiedImages,
  } = useFetchImagesQuery({
    variables: {
      id: appId,
      team_id: teamId,
      locale: isLocalized ? locale : undefined,
    },
  });

  const [upsertShowcaseImages] = useUpsertLocalisedShowcaseImagesMutation({
    onCompleted: (data) => {
      console.log("autosave successful", data);
      toast.success("Showcase images saved successfully");
      onAutosaveSuccess?.();
    },
    onError: (error) => {
      console.error("autosave failed:", error);
      toast.error("Failed to auto-save showcase images");
      onAutosaveError?.(error);
    },
  });

  const handleAutosave = useCallback(
    async (urls: string[]) => {
      if (!appMetadataId) return;

      const newUrls = urls.map((url) =>
        extractImagePathWithExtensionFromActualUrl(url),
      );

      try {
        await upsertShowcaseImages({
          variables: {
            app_metadata_id: appMetadataId,
            showcase_img_urls: newUrls,
            supported_languages: supportedLanguages,
            locale: isLocalized ? locale : undefined,
            is_localized: isLocalized,
          },
        });
      } catch (error) {
        // error is already handled by the mutation's onError callback
        console.error("autosave error:", error);
      }
    },
    [
      appMetadataId,
      upsertShowcaseImages,
      supportedLanguages,
      isLocalized,
      locale,
    ],
  );

  const handleRefetchImages = useCallback(async () => {
    await refetchUnverifiedImages();
  }, [refetchUnverifiedImages]);

  const handleUploadStart = useCallback(() => {
    toast.info("Uploading showcase image", {
      toastId: TOAST_ID,
      autoClose: false,
    });
  }, []);

  const handleUploadSuccess = useCallback(() => {
    toast.update(TOAST_ID, {
      type: "success",
      render: "Showcase image uploaded successfully",
      autoClose: 2000,
    });
  }, []);

  const handleUploadError = useCallback((error: any) => {
    toast.update(TOAST_ID, {
      type: "error",
      render: "Error uploading showcase image",
      autoClose: 2000,
    });
  }, []);

  // extract unverified image URLs for base component
  const unverifiedImageUrls = useMemo(() => {
    return unverifiedImagesData?.unverified_images?.showcase_img_urls || [];
  }, [unverifiedImagesData?.unverified_images?.showcase_img_urls]);

  // image type namer for showcase images
  const imageTypeNamer = useCallback((currentCount: number) => {
    return `showcase_img_${currentCount + 1}`;
  }, []);

  return (
    <ImageUploadField
      value={value}
      onChange={onChange}
      onAutosave={handleAutosave}
      disabled={disabled}
      appId={appId}
      teamId={teamId}
      locale={locale}
      isAppVerified={isAppVerified}
      unverifiedImageUrls={unverifiedImageUrls}
      isImagesLoading={isImagesLoading}
      onRefetchImages={handleRefetchImages}
      maxImages={3}
      imageConstraints={{
        width: 1080,
        height: 1080,
        aspectRatio: "1:1",
        recommendedSize: "1080x1080px",
      }}
      imageTypeNamer={imageTypeNamer}
      title="Showcase Images"
      description="Upload up to 3 images to showcase your application."
      required={true}
      onUploadStart={handleUploadStart}
      onUploadSuccess={handleUploadSuccess}
      onUploadError={handleUploadError}
      error={error}
    />
  );
};
