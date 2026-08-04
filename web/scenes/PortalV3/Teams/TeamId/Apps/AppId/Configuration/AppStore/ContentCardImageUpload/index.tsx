import { useCallback, useEffect, useMemo, useState } from "react";
import { useAtomValue } from "jotai";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "react-toastify";
import { UpdateContentCardImageDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppStore/ContentCardImageUpload/graphql/client/update-content-card-image.generated";
import { FetchImagesDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-images.generated";
import { viewModeAtom } from "../../layout/ImagesProvider";
import { ImageUploadField } from "../ImageForm/ImageUploadField";
import { extractImagePathWithExtensionFromActualUrl } from "../utils";

type ContentCardImageUploadProps = {
  appId: string;
  appMetadataId: string;
  teamId: string;
  isEditable: boolean;
  isError: boolean;
  contentCardImageFile?: string;
};

/**
 * Single-image adapter for the shared upload pipeline. The mutation persists
 * the stable object key while FetchImages supplies a fresh signed URL for
 * every unverified preview consumer.
 */
export const ContentCardImageUpload = (props: ContentCardImageUploadProps) => {
  const {
    appId,
    appMetadataId,
    teamId,
    isEditable,
    isError,
    contentCardImageFile,
  } = props;
  const viewMode = useAtomValue(viewModeAtom);
  const isAppVerified = viewMode === "verified";
  const [updateContentCardImage] = useMutation(UpdateContentCardImageDocument);
  const {
    data: unverifiedImagesData,
    loading: isImagesLoading,
    refetch: refetchUnverifiedImages,
  } = useQuery(FetchImagesDocument, {
    variables: { id: appId, team_id: teamId },
    skip: isAppVerified,
  });

  const saveContentCardImage = useCallback(
    async (urls: string[]) => {
      await updateContentCardImage({
        variables: {
          id: appMetadataId,
          fileName: extractImagePathWithExtensionFromActualUrl(urls[0]),
        },
      });
    },
    [appMetadataId, updateContentCardImage],
  );

  const handleRefetchImages = useCallback(async () => {
    await refetchUnverifiedImages();
  }, [refetchUnverifiedImages]);

  const handleUploadError = useCallback(
    (error: unknown) => {
      console.error("content card image upload failed", {
        appMetadataId,
        error,
      });
      toast.error("Couldn't upload that image. Please try again.");
    },
    [appMetadataId],
  );

  const persistedValue = useMemo(
    () => (contentCardImageFile ? [contentCardImageFile] : []),
    [contentCardImageFile],
  );
  const [value, setValue] = useState(persistedValue);

  useEffect(() => {
    setValue(persistedValue);
  }, [persistedValue]);
  const unverifiedImageUrls = useMemo(() => {
    const contentCardImageUrl =
      unverifiedImagesData?.unverified_images?.content_card_image_url;
    return contentCardImageUrl ? [contentCardImageUrl] : [];
  }, [unverifiedImagesData?.unverified_images?.content_card_image_url]);

  return (
    <ImageUploadField
      value={value}
      // Keep this field responsive while the normalized app_metadata cache
      // propagates the same persisted value to its parent.
      onChange={setValue}
      onAutosave={saveContentCardImage}
      disabled={!isEditable || isAppVerified}
      appId={appId}
      teamId={teamId}
      isAppVerified={isAppVerified}
      unverifiedImageUrls={unverifiedImageUrls}
      isImagesLoading={isImagesLoading}
      onRefetchImages={handleRefetchImages}
      maxImages={1}
      imageConstraints={{
        width: 345,
        height: 240,
        aspectRatio: "345:240",
        recommendedSize: "345x240px",
      }}
      imageTypeNamer={() => "content_card_image"}
      title="Content Card Image"
      description="This image will be used when featuring your app in the Mini App Store."
      required
      onUploadError={handleUploadError}
      error={
        isError
          ? "Content card image is required. Required aspect ratio is 345:240."
          : undefined
      }
    />
  );
};
