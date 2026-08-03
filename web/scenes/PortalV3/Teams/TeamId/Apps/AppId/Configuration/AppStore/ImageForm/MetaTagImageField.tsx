import { useCallback, useEffect, useMemo, useRef } from "react";
import { toast } from "react-toastify";
import { FetchImagesDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-images.generated";
import { UpsertLocalisedMetaTagImageDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppStore/graphql/client/upsert-localised-meta-tag-image.generated";
import { extractImagePathWithExtensionFromActualUrl } from "../utils";
import { ImageUploadField } from "./ImageUploadField";
import { useMutation, useQuery } from "@apollo/client/react";
import { appendLocalisationToCache } from "../utils/update-localisations-cache";
import { useImageSaveStatus } from "./use-image-save-status";

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
  error?: string | null;
  onAutosaveSuccess?: () => void;
  onAutosaveError?: (error: any) => void;
  dropZoneClassName?: string;
  dropZoneContent?: React.ReactNode;
}

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
    error,
    dropZoneClassName,
    dropZoneContent,
  } = props;

  // en is not considered a localization, since we set english properties on app metadata
  const isLocalized = locale !== "en";

  const {
    data: unverifiedImagesData,
    loading: isImagesLoading,
    refetch: refetchUnverifiedImages,
  } = useQuery(FetchImagesDocument, {
    variables: {
      id: appId,
      team_id: teamId,
      locale: isLocalized ? locale : undefined,
    },
  });

  const { reportSaving, reportSaved, reportError, reportIdle } =
    useImageSaveStatus(`image:meta-tag:${locale ?? "en"}`);

  const [upsertLocalisedMetaTagImage] = useMutation(
    UpsertLocalisedMetaTagImageDocument,
    {
      // Field values merge themselves through normalization; only list
      // membership for a row that did not exist yet needs handling.
      update: (cache, result, { variables }) => {
        const inserted = result.data?.insert_localisations?.returning?.[0];
        if (!variables?.is_localized || !inserted) return;

        appendLocalisationToCache(cache, variables.app_metadata_id, inserted);
      },
    },
  );

  // Retry re-runs this same save; a ref breaks the self-reference cycle.
  const handleAutosaveRef = useRef<((urls: string[]) => Promise<void>) | null>(
    null,
  );

  // Both uploads and deletions route through here, so it is the one place that
  // reports save state.
  const handleAutosave = useCallback(
    async (urls: string[]) => {
      if (!appMetadataId) return;

      const newUrl = urls.length > 0 ? urls[0] : null;
      const extractedUrl = extractImagePathWithExtensionFromActualUrl(newUrl);

      reportSaving();
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
        reportSaved();
        onAutosaveSuccess?.();
      } catch (error) {
        // The file is already on S3 and only the database write failed, so
        // retrying exactly this save can succeed.
        console.error("meta tag image autosave failed", {
          appMetadataId,
          locale,
          isLocalized,
          error,
        });
        reportError(
          error instanceof Error
            ? error
            : new Error("Failed to save meta tag image"),
          () => void handleAutosaveRef.current?.(urls),
        );
        onAutosaveError?.(error);
      }
    },
    [
      appMetadataId,
      upsertLocalisedMetaTagImage,
      supportedLanguages,
      isLocalized,
      locale,
      reportSaving,
      reportSaved,
      reportError,
      onAutosaveSuccess,
      onAutosaveError,
    ],
  );

  useEffect(() => {
    handleAutosaveRef.current = handleAutosave;
  }, [handleAutosave]);

  const handleRefetchImages = useCallback(async () => {
    await refetchUnverifiedImages();
  }, [refetchUnverifiedImages]);

  // The upload is the slow half of saving an image, so the pill goes to
  // "Saving…" here rather than waiting for the mutation.
  const handleUploadStart = reportSaving;

  // Nothing was saved and there is nothing to retry, so this surfaces as a
  // toast rather than the pill. Copy stays generic because validation failures
  // (dimensions, size, type) already report their real reason from use-image.
  const handleUploadError = useCallback(
    (error: unknown) => {
      console.error("meta tag image upload failed", {
        appMetadataId,
        locale,
        isLocalized,
        error,
      });
      reportIdle();
      toast.error("Couldn't upload that image. Please try again.");
    },
    [appMetadataId, locale, isLocalized, reportIdle],
  );

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
      onUploadError={handleUploadError}
      onUploadCancelled={reportIdle}
      error={error}
      dropZoneClassName={dropZoneClassName}
      dropZoneContent={dropZoneContent}
    />
  );
};

// keep the legacy export for backwards compatibility
export const ImageDropUpload = () => {};
