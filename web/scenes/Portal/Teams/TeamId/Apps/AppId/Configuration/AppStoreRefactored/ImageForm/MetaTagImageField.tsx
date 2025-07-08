import { useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import { useFetchImagesQuery } from "../../graphql/client/fetch-images.generated";
import { useUpsertLocalisedMetaTagImageMutation } from "../graphql/client/upsert-localised-meta-tag-image.generated";
import { extractImagePathWithExtensionFromActualUrl } from "../utils";
import { ImageUploadField } from "./ImageUploadField";

interface MetaTagImageFieldProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
  appId: string;
  teamId: string;
  locale?: string; // for non-english localizations
  isAppVerified: boolean;
  appMetadataId?: string;
  supportedLanguages: string[];
  onAutosaveSuccess?: () => void;
  onAutosaveError?: (error: any) => void;
}

const TOAST_ID = "upload_meta_tag_toast";

export const MetaTagImageField = (props: MetaTagImageFieldProps) => {
  const {
    value,
    onChange,
    disabled = false,
    appId,
    teamId,
    locale,
    isAppVerified,
    appMetadataId,
    supportedLanguages,
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

  const [upsertLocalisedMetaTagImage] = useUpsertLocalisedMetaTagImageMutation({
    onCompleted: (data) => {
      console.log("autosave successful", data);
      toast.success("Meta tag image saved successfully");
      onAutosaveSuccess?.();
    },
    onError: (error) => {
      console.error("autosave failed:", error);
      toast.error("Failed to auto-save meta tag image");
      onAutosaveError?.(error);
    },
  });

  const handleAutosave = useCallback(
    async (urls: string[]) => {
      if (!appMetadataId) return;

      const newUrl = urls.length > 0 ? urls[0] : null;
      const extractedUrl = extractImagePathWithExtensionFromActualUrl(newUrl);

      try {
        await upsertLocalisedMetaTagImage({
          variables: {
            app_metadata_id: appMetadataId,
            meta_tag_image_url: extractedUrl,
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
      upsertLocalisedMetaTagImage,
      supportedLanguages,
      isLocalized,
      locale,
    ],
  );

  const handleRefetchImages = useCallback(async () => {
    await refetchUnverifiedImages();
  }, [refetchUnverifiedImages]);

  const handleUploadStart = useCallback(() => {
    toast.info("Uploading meta tag image", {
      toastId: TOAST_ID,
      autoClose: false,
    });
  }, []);

  const handleUploadSuccess = useCallback(() => {
    toast.update(TOAST_ID, {
      type: "success",
      render: "Meta tag image uploaded successfully",
      autoClose: 2000,
    });
  }, []);

  const handleUploadError = useCallback((error: any) => {
    toast.update(TOAST_ID, {
      type: "error",
      render: "Error uploading meta tag image",
      autoClose: 2000,
    });
  }, []);

  // convert single image to array format for base component
  const arrayValue = useMemo(() => {
    return value && typeof value === "string" ? [value] : [];
  }, [value]);

  // convert array format back to single image
  const handleChange = useCallback(
    (urls: string[]) => {
      onChange(urls.length > 0 ? urls[0] : null);
    },
    [onChange],
  );

  // extract unverified image URL for base component
  const unverifiedImageUrls = useMemo(() => {
    const metaTagUrl =
      unverifiedImagesData?.unverified_images?.meta_tag_image_url;
    return metaTagUrl ? [metaTagUrl] : [];
  }, [unverifiedImagesData?.unverified_images?.meta_tag_image_url]);

  return (
    <ImageUploadField
      value={arrayValue}
      onChange={handleChange}
      onAutosave={handleAutosave}
      disabled={disabled}
      appId={appId}
      teamId={teamId}
      locale={locale}
      isAppVerified={isAppVerified}
      unverifiedImageUrls={unverifiedImageUrls}
      isImagesLoading={isImagesLoading}
      onRefetchImages={handleRefetchImages}
      maxImages={1}
      imageConstraints={{
        width: 1200,
        height: 600,
        aspectRatio: "2:1",
        recommendedSize: "1200x600px",
      }}
      imageTypeNamer={() => "meta_tag_image"}
      title="Meta Tag Image"
      description="This image will be displayed as the opengraph meta tags image when linking your app. fallback to your app's logo image if not provided."
      required={false}
      onUploadStart={handleUploadStart}
      onUploadSuccess={handleUploadSuccess}
      onUploadError={handleUploadError}
    />
  );
};

// keep the legacy export for backwards compatibility
export const ImageDropUpload = () => {};
