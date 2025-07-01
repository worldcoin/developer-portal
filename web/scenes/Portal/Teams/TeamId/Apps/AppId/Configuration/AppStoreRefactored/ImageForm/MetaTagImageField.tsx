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
import { useUpsertLocalisedMetaTagImageMutation } from "../graphql/client/upsert-localised-meta-tag-image.generated";
import { extractImagePathWithExtensionFromActualUrl } from "../utils";
import { ImageDisplay } from "./ImageDisplay";
import ImageLoader from "./ImageLoader";

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
  const [isUploading, setIsUploading] = useState(false);
  const isMountedRef = useRef(true);
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
  const { validateImageAspectRatio, uploadViaPresignedPost, getImage } =
    useImage();

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

  const performAutosave = useCallback(
    async (possiblyActualUrl: string | null) => {
      if (!appMetadataId) return;
      const newUrl =
        extractImagePathWithExtensionFromActualUrl(possiblyActualUrl);
      try {
        await upsertLocalisedMetaTagImage({
          variables: {
            app_metadata_id: appMetadataId,
            meta_tag_image_url: newUrl,
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

  // cleanup on unmount
  const handleUnmount = useCallback(() => {
    isMountedRef.current = false;
  }, []);

  const uploadImage = useCallback(
    async (_imageType: string, file: File, height: number, width: number) => {
      if (!file || !(file.type === "image/png" || file.type === "image/jpeg")) {
        return;
      }

      const fileTypeEnding = file.type.split("/")[1];

      try {
        // validate first, before showing any progress
        await validateImageAspectRatio(file, width, height);

        // only start showing progress after validation passes
        setIsUploading(true);

        toast.info("Uploading meta tag image", {
          toastId: "upload_meta_tag_toast",
          autoClose: false,
        });

        toast.dismiss("ImageValidationError");

        await uploadViaPresignedPost(
          file,
          appId,
          teamId,
          "meta_tag_image",
          isLocalized ? locale : undefined,
        );

        const imageUrl = await getImage(
          fileTypeEnding,
          appId,
          teamId,
          "meta_tag_image",
          isLocalized ? locale : undefined,
        );

        // check if component is still mounted/valid before updating
        if (!isMountedRef.current) {
          toast.dismiss("upload_meta_tag_toast");
          toast.warning("Upload completed but localization was removed", {
            autoClose: 3000,
          });
          return;
        }
        const newUrl = extractImagePathWithExtensionFromActualUrl(imageUrl);

        await performAutosave(newUrl);
        await refetchUnverifiedImages();
        onChange(newUrl);
        toast.update("upload_meta_tag_toast", {
          type: "success",
          render: "Meta tag image uploaded successfully",
          autoClose: 1000,
        });
      } catch (error) {
        console.error("error uploading meta tag image:", error);

        if (error instanceof ImageValidationError) {
          toast.dismiss("upload_meta_tag_toast");
        } else {
          toast.update("upload_meta_tag_toast", {
            type: "error",
            render: "Error uploading meta tag image",
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

  const handleDelete = useCallback(async () => {
    await performAutosave(null);
    onChange(null);
    await refetchUnverifiedImages();
  }, [onChange, performAutosave, refetchUnverifiedImages]);

  // set cleanup function
  useEffect(() => {
    return handleUnmount;
  }, [handleUnmount]);

  const metaTagImage = useMemo(() => {
    if (isAppVerified) {
      if (!value) return null;

      return getCDNImageUrl(appId, value, true, locale);
    } else {
      return (
        unverifiedImagesData?.unverified_images?.meta_tag_image_url || null
      );
    }
  }, [
    isAppVerified,
    locale,
    value,
    unverifiedImagesData?.unverified_images?.meta_tag_image_url,
    appId,
  ]);

  return (
    <div className="grid gap-y-3">
      <Typography variant={TYPOGRAPHY.H7} className="text-grey-700">
        Meta Tag Image
      </Typography>
      <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
        this image will be displayed as the opengraph meta tags image when
        linking your app. fallback to your app&apos;s logo image if not
        provided.
      </Typography>

      {!value && !isUploading && !isImagesLoading && (
        <ImageDropZone
          width={1200}
          height={600}
          disabled={disabled || isUploading}
          uploadImage={uploadImage}
          imageType="meta_tag_image"
        >
          <UploadIcon className="size-12 text-blue-500" />
          <div className="gap-y-2">
            <div className="text-center">
              <Typography variant={TYPOGRAPHY.M3} className="text-blue-500">
                click to upload
              </Typography>{" "}
              <Typography variant={TYPOGRAPHY.R3} className="text-grey-700">
                or drag and drop
              </Typography>
            </div>
            <Typography variant={TYPOGRAPHY.R5} className="text-grey-500">
              jpg or png (max 500kb), required aspect ratio 2:1.{"\n"}
              recommended size: 1200x600px
            </Typography>
          </div>
        </ImageDropZone>
      )}

      {!metaTagImage && !isUploading && isImagesLoading && (
        <Skeleton height={150} className="w-64 rounded-lg" />
      )}

      {value && !isUploading && !isImagesLoading && metaTagImage && (
        <div className="relative size-fit">
          <ImageDisplay
            src={metaTagImage}
            type="original"
            width={300}
            height={150}
            className="h-auto w-64 rounded-lg"
          />
          <Button
            type="button"
            onClick={handleDelete}
            disabled={disabled}
            className="absolute -right-3 -top-3 flex size-8 items-center justify-center rounded-full bg-grey-100 hover:bg-grey-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <TrashIcon />
          </Button>
        </div>
      )}

      {isUploading && (
        <ImageLoader name="meta_tag_image" className="h-[150px]" />
      )}
    </div>
  );
};
