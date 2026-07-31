import { useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import { FetchImagesDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-images.generated";
import { FetchAppMetadataDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";
import { FetchLocalisationsDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppStore/graphql/client/fetch-localisations.generated";
import { UpsertLocalisedMetaTagImageDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppStore/graphql/client/upsert-localised-meta-tag-image.generated";
import { extractImagePathWithExtensionFromActualUrl } from "../utils";
import { ImageUploadField } from "./ImageUploadField";
import { useApolloClient, useMutation, useQuery } from "@apollo/client/react";

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
  onAutosaveError?: (error: any) => void;
  dropZoneClassName?: string;
  dropZoneContent?: React.ReactNode;
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
    onAutosaveError,
    error,
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

  const [upsertLocalisedMetaTagImage] = useMutation(
    UpsertLocalisedMetaTagImageDocument,
    {
      onCompleted: () => {
        toast.success("Meta tag image saved successfully");
      },
      onError: (error) => {
        console.error("autosave failed:", error);
        toast.error("Failed to auto-save meta tag image");
        onAutosaveError?.(error);
      },
    },
  );

  const handleAutosave = useCallback(
    async (urls: string[]) => {
      if (!appMetadataId) {
        throw new Error("App metadata is unavailable");
      }

      const newUrl = urls.length > 0 ? urls[0] : null;
      const extractedUrl = extractImagePathWithExtensionFromActualUrl(newUrl);

      await upsertLocalisedMetaTagImage({
        variables: {
          app_metadata_id: appMetadataId,
          meta_tag_image_url: extractedUrl,
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
                      ? { ...row, meta_tag_image_url: extractedUrl }
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
                        ? { ...metadata, meta_tag_image_url: extractedUrl }
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
      upsertLocalisedMetaTagImage,
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
          const currentUrl = data.unverified_images.meta_tag_image_url;
          const meta_tag_image_url = uploadedImageUrl
            ? uploadedImageUrl
            : currentUrl && paths.some((path) => currentUrl.includes(path))
              ? currentUrl
              : null;
          return {
            unverified_images: {
              ...data.unverified_images,
              meta_tag_image_url,
            },
          };
        },
      );
    },
    [client, appId, teamId, isLocalized, locale],
  );

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
      onUpdateImages={handleUpdateImages}
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
      error={error}
      dropZoneClassName={dropZoneClassName}
      dropZoneContent={dropZoneContent}
    />
  );
};

// keep the legacy export for backwards compatibility
export const ImageDropUpload = () => {};
