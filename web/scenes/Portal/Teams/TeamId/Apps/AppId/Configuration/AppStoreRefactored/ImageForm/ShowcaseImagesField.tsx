import { Button } from "@/components/Button";
import { TrashIcon } from "@/components/Icons/TrashIcon";
import { UploadIcon } from "@/components/Icons/UploadIcon";
import { ImageDropZone } from "@/components/ImageDropZone";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { getCDNImageUrl } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { toast } from "react-toastify";
import { useFetchImagesQuery } from "../../graphql/client/fetch-images.generated";
import { ImageValidationError, useImage } from "../../hook/use-image";
import { useUpsertLocalisedShowcaseImagesMutation } from "../graphql/client/upsert-localised-showcase-images.generated";
import { extractImagePathWithExtensionFromActualUrl } from "../utils";
import { ImageDisplay } from "./ImageDisplay";
import ImageLoader from "./ImageLoader";

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
  const [isUploading, setIsUploading] = useState(false);
  const isMountedRef = useRef(true);
  // en is not considered a localization, since we set english properties on app metadata
  const isLocalized = locale !== "en";

  const { validateImageAspectRatio, uploadViaPresignedPost, getImage } =
    useImage();

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

  const performAutosave = useCallback(
    async (possiblyActualUrls: string[]) => {
      if (!appMetadataId) return;
      const newUrls = possiblyActualUrls.map((url) =>
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
      locale,
      upsertShowcaseImages,
      supportedLanguages,
      isLocalized,
    ],
  );

  // cleanup on unmount
  const handleUnmount = useCallback(() => {
    isMountedRef.current = false;
  }, []);

  const uploadImage = useCallback(
    async (_imageType: string, file: File, height: number, width: number) => {
      if (!file || !(file.type === "image/png" || file.type === "image/jpeg")) {
        return;
      }

      if (value.length >= 3) {
        toast.error("maximum of 3 showcase images allowed");
        return;
      }

      const fileTypeEnding = file.type.split("/")[1];

      try {
        // validate first, before showing any progress
        await validateImageAspectRatio(file, width, height);

        // only start showing progress after validation passes
        setIsUploading(true);

        toast.info("Uploading showcase image", {
          toastId: "upload_showcase_toast",
          autoClose: false,
        });

        toast.dismiss("ImageValidationError");

        // use showcase_img_N format for image type
        const showcaseImageType = `showcase_img_${value.length + 1}`;

        await uploadViaPresignedPost(
          file,
          appId,
          teamId,
          showcaseImageType,
          isLocalized ? locale : undefined,
        );

        const imageUrl = await getImage(
          fileTypeEnding,
          appId,
          teamId,
          showcaseImageType,
          isLocalized ? locale : undefined,
        );

        // check if component is still mounted/valid before updating
        if (!isMountedRef.current) {
          toast.dismiss("upload_showcase_toast");
          toast.warning("Upload completed but localization was removed", {
            autoClose: 3000,
          });
          return;
        }
        const extractedPath =
          extractImagePathWithExtensionFromActualUrl(imageUrl);
        const newUrls = [...value, extractedPath];

        await performAutosave(newUrls);
        await refetchUnverifiedImages();
        onChange(newUrls);
        toast.update("upload_showcase_toast", {
          type: "success",
          render: "Showcase image uploaded successfully",
          autoClose: 1000,
        });
      } catch (error) {
        console.error("error uploading showcase image:", error);

        if (error instanceof ImageValidationError) {
          toast.dismiss("upload_showcase_toast");
        } else {
          toast.update("upload_showcase_toast", {
            type: "error",
            render: "Error uploading showcase image",
            autoClose: 1000,
          });
        }
      } finally {
        if (isMountedRef.current) {
          setIsUploading(false);
        }
      }
    },
    [
      value,
      validateImageAspectRatio,
      uploadViaPresignedPost,
      appId,
      teamId,
      isLocalized,
      locale,
      getImage,
      performAutosave,
      refetchUnverifiedImages,
      onChange,
    ],
  );

  const handleDelete = useCallback(
    async (imagePath: string) => {
      const newUrls = value.filter((url) => !url.includes(imagePath));
      onChange(newUrls);

      await performAutosave(newUrls);
      await refetchUnverifiedImages();
    },
    [value, onChange, performAutosave, refetchUnverifiedImages],
  );

  // set cleanup function
  useEffect(() => {
    return handleUnmount;
  }, [handleUnmount]);

  const canUploadMore = value.length < 3;

  const showcaseImgUrls = useMemo(() => {
    if (isAppVerified) {
      const urls = value;
      return urls?.map((url: string) =>
        getCDNImageUrl(appId, url, true, locale),
      );
    } else {
      return unverifiedImagesData?.unverified_images?.showcase_img_urls || [];
    }
  }, [
    isAppVerified,
    locale,
    value,
    unverifiedImagesData?.unverified_images?.showcase_img_urls,
    appId,
  ]);

  return (
    <div className="grid gap-y-3">
      <Typography variant={TYPOGRAPHY.H7} className="text-grey-700">
        Showcase Images <span className="text-system-error-500">*</span>
      </Typography>
      <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
        upload up to 3 images to showcase your application.
      </Typography>

      {/* existing images */}
      {value.length > 0 && !isImagesLoading && (
        <div className="grid gap-4 md:grid-cols-3">
          {value.map((url) => {
            const imagePath = extractImagePathWithExtensionFromActualUrl(url);
            return (
              <div key={imagePath} className="relative size-fit">
                <ImageDisplay
                  src={
                    showcaseImgUrls?.find((showcaseImg) =>
                      showcaseImg.includes(imagePath),
                    ) || ""
                  }
                  type="original"
                  width={150}
                  height={150}
                  className="h-auto w-32 rounded-lg"
                />
                <Button
                  type="button"
                  onClick={() => handleDelete(imagePath)}
                  disabled={disabled}
                  className="absolute -right-3 -top-3 flex size-8 items-center justify-center rounded-full bg-grey-100 hover:bg-grey-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <TrashIcon />
                </Button>
              </div>
            );
          })}

          {/* upload loader */}
          {isUploading && (
            <ImageLoader
              name={`showcase_image_${value.length + 1}`}
              className="h-[128px] w-32"
            />
          )}
        </div>
      )}

      {/* show skeleton when loading and have images */}
      {value.length > 0 && isImagesLoading && (
        <div className="grid gap-4 md:grid-cols-3">
          {value.map((url, index) => (
            <Skeleton
              key={`${url}-${index}`}
              height={128}
              className="w-32 rounded-lg"
            />
          ))}
        </div>
      )}

      {/* upload zone */}
      {canUploadMore && !isUploading && !isImagesLoading && (
        <ImageDropZone
          width={1080}
          height={1080}
          disabled={disabled || isUploading || !canUploadMore}
          uploadImage={uploadImage}
          imageType={`showcase_img_${value.length + 1}`}
          error={error}
        >
          <UploadIcon className="size-12 text-blue-500" />
          <div className="gap-y-2">
            <div className="text-center">
              <Typography variant={TYPOGRAPHY.M3} className="text-blue-500">
                Click to upload
              </Typography>{" "}
              <Typography variant={TYPOGRAPHY.R3} className="text-grey-700">
                or drag and drop
              </Typography>
            </div>
            <Typography variant={TYPOGRAPHY.R5} className="text-grey-500">
              JPG or PNG (max 500kb), required aspect ratio 1:1.{"\n"}
              Recommended size: 1080x1080px
            </Typography>
          </div>
        </ImageDropZone>
      )}

      {/* show skeleton when loading and no images yet */}
      {value.length === 0 && !isUploading && isImagesLoading && (
        <Skeleton height={200} className="rounded-lg" />
      )}

      {/* show loader when no images yet */}
      {value.length === 0 && isUploading && (
        <ImageLoader name="showcase_image_1" className="h-[200px]" />
      )}
    </div>
  );
};
