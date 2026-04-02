import { Button } from "@/components/Button";
import { TrashIcon } from "@/components/Icons/TrashIcon";
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
  error?: string | null;
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
    error,
  } = props;

  const [isUploading, setIsUploading] = useState(false);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
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

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

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
          abortController.signal,
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

        if (error instanceof Error && error.name === "AbortError") {
          toast.error("Upload was cancelled", { autoClose: 5000 });
          return;
        }

        if (!(error instanceof ImageValidationError)) {
          onUploadError?.(error);
        }
      } finally {
        abortControllerRef.current = null;
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

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const dropZoneChildren = (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="size-6 text-grey-500"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
        />
      </svg>
      <div className="flex flex-col items-center gap-y-1">
        <Typography
          variant={TYPOGRAPHY.B3}
          className="text-center text-grey-500"
        >
          Drop image here to upload
        </Typography>
        <Typography
          variant={TYPOGRAPHY.B3}
          className="text-center text-grey-500"
        >
          or <span className="font-semibold text-grey-700">browse files</span>
        </Typography>
      </div>
    </>
  );

  return (
    <div className="grid gap-y-4">
      {/* ── 0 images: full-width drop zone ── */}
      {value.length === 0 && !isUploading && !isImagesLoading && (
        <ImageDropZone
          width={imageConstraints.width}
          height={imageConstraints.height}
          disabled={disabled || !canUploadMore}
          uploadImage={uploadImage}
          imageType={imageTypeNamer(0)}
          error={error}
          className="h-[168px] !rounded-xl"
        >
          {dropZoneChildren}
        </ImageDropZone>
      )}

      {/* 0 images: skeleton */}
      {value.length === 0 && !isUploading && isImagesLoading && (
        <Skeleton height={168} className="rounded-lg" />
      )}

      {/* 0 images: uploading loader */}
      {value.length === 0 && isUploading && (
        <ImageLoader name={imageTypeNamer(0)} className="h-[168px]" />
      )}

      {/* ── maxImages === 1: single image, full-width box ── */}
      {value.length > 0 && maxImages === 1 && !isImagesLoading && (
        <>
          {value.map((url) => {
            const imagePath = extractImagePathWithExtensionFromActualUrl(url);
            const resolvedUrl =
              resolvedImageUrls?.find((imgUrl) => imgUrl.includes(imagePath)) ||
              "";
            return (
              <div
                key={imagePath}
                className="relative overflow-hidden rounded-xl"
              >
                <ImageDisplay
                  src={resolvedUrl}
                  type="original"
                  width={imageConstraints.width}
                  height={imageConstraints.height}
                  className="h-[200px] w-full rounded-xl object-cover"
                />
                <Button
                  type="button"
                  onClick={() => handleDelete(imagePath)}
                  disabled={disabled}
                  className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full border border-grey-200 bg-white shadow-sm transition-colors hover:bg-grey-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <TrashIcon className="text-grey-500" />
                </Button>
              </div>
            );
          })}
          {isUploading && (
            <ImageLoader
              name={imageTypeNamer(value.length)}
              className="h-[200px]"
            />
          )}
        </>
      )}

      {/* maxImages === 1: skeleton */}
      {value.length > 0 && maxImages === 1 && isImagesLoading && (
        <Skeleton height={200} className="rounded-xl" />
      )}

      {/* ── maxImages > 1: 2-column grid — images + drop zone inline ── */}
      {value.length > 0 && maxImages > 1 && !isImagesLoading && (
        <div className="grid grid-cols-2 gap-3">
          {value.map((url) => {
            const imagePath = extractImagePathWithExtensionFromActualUrl(url);
            const resolvedUrl =
              resolvedImageUrls?.find((imgUrl) => imgUrl.includes(imagePath)) ||
              "";
            return (
              <div
                key={imagePath}
                className="relative overflow-hidden rounded-xl"
              >
                <ImageDisplay
                  src={resolvedUrl}
                  type="original"
                  width={imageConstraints.width}
                  height={imageConstraints.height}
                  className="h-[200px] w-full rounded-xl object-cover"
                />
                <Button
                  type="button"
                  onClick={() => handleDelete(imagePath)}
                  disabled={disabled}
                  className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full border border-grey-200 bg-white shadow-sm transition-colors hover:bg-grey-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <TrashIcon className="text-grey-500" />
                </Button>
              </div>
            );
          })}

          {/* uploading loader occupies next grid slot */}
          {isUploading && (
            <ImageLoader
              name={imageTypeNamer(value.length)}
              className="h-[200px]"
            />
          )}

          {/* drop zone occupies next grid slot */}
          {canUploadMore && !isUploading && (
            <ImageDropZone
              width={imageConstraints.width}
              height={imageConstraints.height}
              disabled={disabled || !canUploadMore}
              uploadImage={uploadImage}
              imageType={imageTypeNamer(value.length)}
              error={error}
              className="h-[200px] !rounded-xl"
            >
              {dropZoneChildren}
            </ImageDropZone>
          )}
        </div>
      )}

      {/* maxImages > 1: skeleton */}
      {value.length > 0 && maxImages > 1 && isImagesLoading && (
        <div className="grid grid-cols-2 gap-3">
          {value.map((url, index) => (
            <Skeleton
              key={`${url}-${index}`}
              height={200}
              className="rounded-xl"
            />
          ))}
        </div>
      )}
    </div>
  );
};
