import { useCallback, useEffect, useMemo, useRef } from "react";
import { toast } from "react-toastify";
import { FetchImagesDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-images.generated";
import { UpsertLocalisedShowcaseImagesDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppStore/graphql/client/upsert-localised-showcase-images.generated";
import { extractImagePathWithExtensionFromActualUrl } from "../utils";
import { ImageUploadField } from "./ImageUploadField";
import { useMutation, useQuery } from "@apollo/client/react";
import { appendLocalisationToCache } from "../utils/update-localisations-cache";
import { useImageSaveStatus } from "./use-image-save-status";

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
  onAutosaveSuccess?: (urls: string[]) => void;
  onAutosaveError?: (error: any) => void;
  dropZoneClassName?: string;
  dropZoneContent?: React.ReactNode;
}

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
    useImageSaveStatus(`image:showcase:${locale}`);

  const [upsertShowcaseImages] = useMutation(
    UpsertLocalisedShowcaseImagesDocument,
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

      const newUrls = urls.map((url) =>
        extractImagePathWithExtensionFromActualUrl(url),
      );

      reportSaving();
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
        reportSaved();
        onAutosaveSuccess?.(urls);
      } catch (error) {
        // The file is already on S3 and only the database write failed, so
        // retrying exactly this save can succeed.
        console.error("showcase images autosave failed", {
          appMetadataId,
          locale,
          isLocalized,
          imageCount: newUrls.length,
          error,
        });
        reportError(
          error instanceof Error
            ? error
            : new Error("Failed to save showcase images"),
          () => void handleAutosaveRef.current?.(urls),
        );
        onAutosaveError?.(error);
      }
    },
    [
      appMetadataId,
      upsertShowcaseImages,
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
      console.error("showcase image upload failed", {
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
      onUploadError={handleUploadError}
      onUploadCancelled={reportIdle}
      error={error}
      dropZoneClassName={dropZoneClassName}
      dropZoneContent={dropZoneContent}
    />
  );
};
