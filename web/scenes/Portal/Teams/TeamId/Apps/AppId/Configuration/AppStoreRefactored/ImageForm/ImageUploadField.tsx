import { Button } from "@/components/Button";
import { TrashIcon } from "@/components/Icons/TrashIcon";
import { UploadIcon } from "@/components/Icons/UploadIcon";
import { ImageDropZone } from "@/components/ImageDropZone";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { getCDNImageUrl } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { toast } from "react-toastify";
import { ImageValidationError, useImage } from "../../hook/use-image";
import { extractImagePathWithExtensionFromActualUrl } from "../utils";
import { ImageDisplay } from "./ImageDisplay";
import ImageLoader from "./ImageLoader";

interface ImageConstraints {
  width: number;
  height: number;
  aspectRatio: string;
  recommendedSize: string;
}

interface ImageUploadFieldConfig {
  maxImages: number;
  imageConstraints: ImageConstraints;
  imageTypeNamer: (currentCount: number) => string;
  title: string;
  description: string;
  required?: boolean;
  onUploadStart?: () => void;
  onUploadSuccess?: () => void;
  onUploadError?: (error: any) => void;
}

interface ImageUploadFieldProps extends ImageUploadFieldConfig {
  value: string[];
  onChange: (urls: string[]) => void;
  onAutosave: (urls: string[]) => Promise<void>;
  disabled?: boolean;
  appId: string;
  teamId: string;
  locale?: string;
  isAppVerified: boolean;
  unverifiedImageUrls: string[];
  isImagesLoading: boolean;
  onRefetchImages: () => Promise<void>;
}

export const ImageUploadField = (props: ImageUploadFieldProps) => {
  const {
    value = [],
    onChange,
    onAutosave,
    disabled = false,
    appId,
    teamId,
    locale,
    isAppVerified,
    unverifiedImageUrls,
    isImagesLoading,
    onRefetchImages,
    maxImages,
    imageConstraints,
    imageTypeNamer,
    title,
    description,
    required = false,
    onUploadStart,
    onUploadSuccess,
    onUploadError,
  } = props;

  const [isUploading, setIsUploading] = useState(false);
  const isMountedRef = useRef(true);
  const isLocalized = locale !== "en";

  const { validateImageAspectRatio, uploadViaPresignedPost, getImage } =
    useImage();

  const uploadImage = useCallback(
    async (_imageType: string, file: File, height: number, width: number) => {
      if (!file || !(file.type === "image/png" || file.type === "image/jpeg")) {
        return;
      }

      if (value.length >= maxImages) {
        toast.error(
          `maximum of ${maxImages} image${maxImages > 1 ? "s" : ""} allowed`,
        );
        return;
      }

      const fileTypeEnding = file.type.split("/")[1];

      try {
        // validate first, before showing any progress
        await validateImageAspectRatio(file, width, height);

        // only start showing progress after validation passes
        setIsUploading(true);
        onUploadStart?.();

        toast.dismiss(ImageValidationError.prototype.toastId);

        const imageType = imageTypeNamer(value.length);

        await uploadViaPresignedPost(
          file,
          appId,
          teamId,
          imageType,
          isLocalized ? locale : undefined,
        );

        const imageUrl = await getImage(
          fileTypeEnding,
          appId,
          teamId,
          imageType,
          isLocalized ? locale : undefined,
        );

        // check if component is still mounted/valid before updating
        if (!isMountedRef.current) {
          return;
        }

        const extractedPath =
          extractImagePathWithExtensionFromActualUrl(imageUrl);
        const newUrls =
          maxImages === 1 ? [extractedPath] : [...value, extractedPath];

        await onAutosave(newUrls);
        await onRefetchImages();
        onChange(newUrls);

        onUploadSuccess?.();
      } catch (error) {
        console.error("error uploading image:", error);

        if (error instanceof ImageValidationError) {
          // validation errors are already handled by the hook
        } else {
          onUploadError?.(error);
        }
      } finally {
        if (isMountedRef.current) {
          setIsUploading(false);
        }
      }
    },
    [
      value,
      maxImages,
      validateImageAspectRatio,
      onUploadStart,
      imageTypeNamer,
      uploadViaPresignedPost,
      appId,
      teamId,
      isLocalized,
      locale,
      getImage,
      onAutosave,
      onRefetchImages,
      onChange,
      onUploadSuccess,
      onUploadError,
    ],
  );

  const handleDelete = useCallback(
    async (imagePath: string) => {
      const newUrls = value.filter((url) => !url.includes(imagePath));
      onChange(newUrls);
      await onAutosave(newUrls);
      await onRefetchImages();
    },
    [value, onChange, onAutosave, onRefetchImages],
  );

  const canUploadMore = value.length < maxImages;

  const resolvedImageUrls = useMemo(() => {
    if (isAppVerified) {
      return value.map((url: string) =>
        getCDNImageUrl(appId, url, true, locale),
      );
    } else {
      return unverifiedImageUrls;
    }
  }, [isAppVerified, value, unverifiedImageUrls, appId, locale]);

  const handleUnmount = useCallback(() => {
    isMountedRef.current = false;
  }, []);

  useEffect(() => {
    return handleUnmount;
  }, [handleUnmount]);

  return (
    <div className="grid gap-y-3">
      <Typography variant={TYPOGRAPHY.H7} className="text-grey-700">
        {title} {required && <span className="text-system-error-500">*</span>}
      </Typography>
      <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
        {description}
      </Typography>

      {/* existing images */}
      {value.length > 0 && !isImagesLoading && (
        <div
          className={
            maxImages > 1 ? "grid gap-4 md:grid-cols-3" : "relative size-fit"
          }
        >
          {value.map((url) => {
            const imagePath = extractImagePathWithExtensionFromActualUrl(url);
            const resolvedUrl =
              resolvedImageUrls?.find((imgUrl) => imgUrl.includes(imagePath)) ||
              "";

            return (
              <div key={imagePath} className="relative size-fit">
                <ImageDisplay
                  src={resolvedUrl}
                  type="original"
                  width={maxImages === 1 ? 300 : 150}
                  height={maxImages === 1 ? 150 : 150}
                  className={
                    maxImages === 1
                      ? "h-auto w-64 rounded-lg"
                      : "h-auto w-32 rounded-lg"
                  }
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
              name={imageTypeNamer(value.length)}
              className={maxImages === 1 ? "h-[150px]" : "h-[128px] w-32"}
            />
          )}
        </div>
      )}

      {/* show skeleton when loading and have images */}
      {value.length > 0 && isImagesLoading && (
        <div className={maxImages > 1 ? "grid gap-4 md:grid-cols-3" : ""}>
          {value.map((url, index) => (
            <Skeleton
              key={`${url}-${index}`}
              height={maxImages === 1 ? 150 : 128}
              className={
                maxImages === 1 ? "w-64 rounded-lg" : "w-32 rounded-lg"
              }
            />
          ))}
        </div>
      )}

      {/* upload zone */}
      {canUploadMore && !isUploading && !isImagesLoading && (
        <ImageDropZone
          width={imageConstraints.width}
          height={imageConstraints.height}
          disabled={disabled || isUploading || !canUploadMore}
          uploadImage={uploadImage}
          imageType={imageTypeNamer(value.length)}
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
              JPG or PNG (max 500kb), required aspect ratio{" "}
              {imageConstraints.aspectRatio}.{"\n"}
              Recommended size: {imageConstraints.recommendedSize}
            </Typography>
          </div>
        </ImageDropZone>
      )}

      {/* show skeleton when loading and no images yet */}
      {value.length === 0 && !isUploading && isImagesLoading && (
        <Skeleton height={maxImages === 1 ? 150 : 200} className="rounded-lg" />
      )}

      {/* show loader when no images yet */}
      {value.length === 0 && isUploading && (
        <ImageLoader
          name={imageTypeNamer(0)}
          className={maxImages === 1 ? "h-[150px]" : "h-[200px]"}
        />
      )}
    </div>
  );
};
