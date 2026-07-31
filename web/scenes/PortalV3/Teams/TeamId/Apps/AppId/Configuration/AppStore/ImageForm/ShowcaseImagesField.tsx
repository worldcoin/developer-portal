import { useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import { FetchImagesDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-images.generated";
import { FetchAppMetadataDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";
import { FetchLocalisationsDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppStore/graphql/client/fetch-localisations.generated";
import { UpsertLocalisedShowcaseImagesDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppStore/graphql/client/upsert-localised-showcase-images.generated";
import { extractImagePathWithExtensionFromActualUrl } from "../utils";
import { ImageUploadField } from "./ImageUploadField";
import { useApolloClient, useMutation, useQuery } from "@apollo/client/react";

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
  onAutosaveError?: (error: any) => void;
  dropZoneClassName?: string;
  dropZoneContent?: React.ReactNode;
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
    onAutosaveError,
    dropZoneClassName,
    dropZoneContent,
  } = props;

  // en is not considered a localization, since we set english properties on app metadata
  const isLocalized = locale !== "en";
  const client = useApolloClient();

  const { data: unverifiedImagesData, loading: isImagesLoading } = useQuery(
    FetchImagesDocument,
    {
      variables: {
        id: appId,
        team_id: teamId,
        locale: isLocalized ? locale : undefined,
      },
    },
  );

  const [upsertShowcaseImages] = useMutation(
    UpsertLocalisedShowcaseImagesDocument,
    {
      onCompleted: () => {
        toast.success("Showcase images saved successfully");
      },
      onError: (error) => {
        console.error("autosave failed:", error);
        toast.error("Failed to auto-save showcase images");
        onAutosaveError?.(error);
      },
    },
  );

  const handleAutosave = useCallback(
    async (urls: string[]) => {
      if (!appMetadataId) {
        throw new Error("App metadata is unavailable");
      }

      const newUrls = urls.map((url) =>
        extractImagePathWithExtensionFromActualUrl(url),
      );

      await upsertShowcaseImages({
        variables: {
          app_metadata_id: appMetadataId,
          showcase_img_urls: newUrls,
          supported_languages: supportedLanguages,
          locale: isLocalized ? locale : undefined,
          is_localized: isLocalized,
        },
      });

      if (isLocalized) {
        client.cache.updateQuery(
          {
            query: FetchLocalisationsDocument,
            variables: { app_metadata_id: appMetadataId },
          },
          (data) =>
            data
              ? {
                  localisations: data.localisations.map((row) =>
                    row.locale === locale
                      ? { ...row, showcase_img_urls: newUrls }
                      : row,
                  ),
                }
              : data,
        );
      } else {
        client.cache.updateQuery(
          { query: FetchAppMetadataDocument, variables: { id: appId } },
          (data) =>
            data
              ? {
                  app: data.app.map((app) => ({
                    ...app,
                    app_metadata: app.app_metadata.map((metadata) =>
                      metadata.id === appMetadataId
                        ? { ...metadata, showcase_img_urls: newUrls }
                        : metadata,
                    ),
                  })),
                }
              : data,
        );
      }
    },
    [
      appMetadataId,
      client,
      appId,
      upsertShowcaseImages,
      supportedLanguages,
      isLocalized,
      locale,
    ],
  );

  const handleUpdateImages = useCallback(
    (paths: string[], uploadedImageUrl?: string) => {
      client.cache.updateQuery(
        {
          query: FetchImagesDocument,
          variables: {
            id: appId,
            team_id: teamId,
            locale: isLocalized ? locale : undefined,
          },
        },
        (data) => {
          if (!data?.unverified_images) return data;
          const currentUrls = data.unverified_images.showcase_img_urls ?? [];
          const showcase_img_urls = uploadedImageUrl
            ? [...currentUrls, uploadedImageUrl]
            : currentUrls.filter((url) =>
                paths.some((path) => url.includes(path)),
              );
          return {
            unverified_images: {
              ...data.unverified_images,
              showcase_img_urls,
            },
          };
        },
      );
    },
    [client, appId, teamId, isLocalized, locale],
  );

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
      onUpdateImages={handleUpdateImages}
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
      dropZoneClassName={dropZoneClassName}
      dropZoneContent={dropZoneContent}
    />
  );
};
