import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import { TrashIcon } from "@/components/Icons/TrashIcon";
import { ImageDropZone } from "@/components/ImageDropZone";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { getCDNImageUrl } from "@/lib/utils";
import { Dialog as HeadlessDialog, Transition } from "@headlessui/react";
import { Fragment, useCallback, useMemo, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { toast } from "react-toastify";
import { ImageValidationError, useImage } from "../../hook/use-image";
import { extractImagePathWithExtensionFromActualUrl } from "../utils";
import { ImageDisplay } from "./ImageDisplay";
import ImageLoader from "./ImageLoader";

const PREVIEW_HEIGHT_PX = 200;

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
}

interface ImageUploadFieldProps extends ImageUploadFieldConfig {
  /** Committed metadata paths (e.g. "showcase_img_1.png"). */
  value: string[];
  disabled?: boolean;
  appId: string;
  locale?: string;
  isAppVerified: boolean;
  /** Signed preview URLs for the unverified images. */
  previewUrls: string[];
  isImagesLoading: boolean;
  /** True while the upload transaction is in flight. */
  isUploading: boolean;
  /** Blob URL of the file being uploaded — shown immediately as a preview. */
  pendingPreviewUrl: string | null;
  /** Runs the full upload transaction (S3 → mutation → local state). */
  onUploadFile: (file: File) => Promise<unknown>;
  onDelete: (imagePath: string) => Promise<unknown> | void;
  error?: string | null;
}

export const ImageUploadField = (props: ImageUploadFieldProps) => {
  const {
    value = [],
    disabled = false,
    appId,
    locale,
    isAppVerified,
    previewUrls,
    isImagesLoading,
    isUploading,
    pendingPreviewUrl,
    onUploadFile,
    onDelete,
    maxImages,
    imageConstraints,
    imageTypeNamer,
    error,
  } = props;

  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const { validateImageAspectRatio } = useImage();

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

      try {
        // validate first, before showing any progress
        await validateImageAspectRatio(file, width, height);
      } catch (error) {
        // validation surfaces its own toast
        return;
      }

      toast.dismiss(ImageValidationError.prototype.toastId);
      await onUploadFile(file);
    },
    [value.length, maxImages, validateImageAspectRatio, onUploadFile],
  );

  const canUploadMore = value.length < maxImages;

  const previewStyle = {
    height: `${PREVIEW_HEIGHT_PX}px`,
    width: `${(PREVIEW_HEIGHT_PX * imageConstraints.width) / imageConstraints.height}px`,
  };

  const resolvedImageUrls = useMemo(() => {
    if (isAppVerified) {
      return value.map((url: string) =>
        getCDNImageUrl(appId, url, true, locale),
      );
    } else {
      return previewUrls;
    }
  }, [isAppVerified, value, previewUrls, appId, locale]);

  // The in-flight upload's slot: the local blob renders as the preview the
  // moment the file is accepted, before any network promise settles.
  const uploadingTile = (
    <div className="relative overflow-hidden rounded-xl" style={previewStyle}>
      {pendingPreviewUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pendingPreviewUrl}
            alt="upload preview"
            className="size-full rounded-xl object-contain"
          />
          <div className="absolute inset-0 animate-pulse rounded-xl bg-white/40" />
        </>
      ) : (
        <ImageLoader
          name={imageTypeNamer(value.length)}
          className="size-full"
        />
      )}
    </div>
  );

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
          className="h-[168px] rounded-xl!"
        >
          {dropZoneChildren}
        </ImageDropZone>
      )}

      {/* 0 images: skeleton */}
      {value.length === 0 && !isUploading && isImagesLoading && (
        <Skeleton height={168} className="rounded-lg" />
      )}

      {/* 0 images: uploading preview */}
      {value.length === 0 && isUploading && uploadingTile}

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
                style={previewStyle}
              >
                <button
                  type="button"
                  onClick={() => setLightboxUrl(resolvedUrl)}
                  className="block size-full cursor-zoom-in"
                  aria-label="View full resolution"
                >
                  <ImageDisplay
                    src={resolvedUrl}
                    type="original"
                    width={imageConstraints.width}
                    height={imageConstraints.height}
                    className="size-full rounded-xl object-contain"
                  />
                </button>
                <Button
                  type="button"
                  onClick={() => onDelete(imagePath)}
                  disabled={disabled}
                  aria-label={`Delete ${imagePath}`}
                  className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full border border-grey-200 bg-white shadow-xs transition-colors hover:bg-grey-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <TrashIcon className="text-grey-500" />
                </Button>
              </div>
            );
          })}
          {isUploading && uploadingTile}
        </>
      )}

      {/* maxImages === 1: skeleton */}
      {value.length > 0 && maxImages === 1 && isImagesLoading && (
        <div
          className="animate-pulse rounded-xl bg-grey-100"
          style={previewStyle}
        />
      )}

      {/* ── maxImages > 1: thumbnails + drop zone inline ── */}
      {value.length > 0 && maxImages > 1 && !isImagesLoading && (
        <div className="flex flex-wrap gap-3">
          {value.map((url) => {
            const imagePath = extractImagePathWithExtensionFromActualUrl(url);
            const resolvedUrl =
              resolvedImageUrls?.find((imgUrl) => imgUrl.includes(imagePath)) ||
              "";
            return (
              <div
                key={imagePath}
                className="relative overflow-hidden rounded-xl"
                style={previewStyle}
              >
                <button
                  type="button"
                  onClick={() => setLightboxUrl(resolvedUrl)}
                  className="block size-full cursor-zoom-in"
                  aria-label="View full resolution"
                >
                  <ImageDisplay
                    src={resolvedUrl}
                    type="original"
                    width={imageConstraints.width}
                    height={imageConstraints.height}
                    className="size-full rounded-xl object-contain"
                  />
                </button>
                <Button
                  type="button"
                  onClick={() => onDelete(imagePath)}
                  disabled={disabled}
                  aria-label={`Delete ${imagePath}`}
                  className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full border border-grey-200 bg-white shadow-xs transition-colors hover:bg-grey-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <TrashIcon className="text-grey-500" />
                </Button>
              </div>
            );
          })}

          {/* uploading preview occupies next slot */}
          {isUploading && uploadingTile}

          {/* drop zone occupies next slot */}
          {canUploadMore && !isUploading && (
            <div style={previewStyle}>
              <ImageDropZone
                width={imageConstraints.width}
                height={imageConstraints.height}
                disabled={disabled || !canUploadMore}
                uploadImage={uploadImage}
                imageType={imageTypeNamer(value.length)}
                error={error}
                className="h-full rounded-xl!"
              >
                {dropZoneChildren}
              </ImageDropZone>
            </div>
          )}
        </div>
      )}

      {/* maxImages > 1: skeleton */}
      {value.length > 0 && maxImages > 1 && isImagesLoading && (
        <div className="flex flex-wrap gap-3">
          {value.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="animate-pulse rounded-xl bg-grey-100"
              style={previewStyle}
            />
          ))}
        </div>
      )}

      <Dialog open={!!lightboxUrl} onClose={() => setLightboxUrl(null)}>
        <DialogOverlay />
        <Transition.Child
          enter="transition duration-200 ease"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="transition duration-150 ease"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
          as={Fragment}
        >
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <HeadlessDialog.Panel className="relative">
              {lightboxUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={lightboxUrl}
                  alt="Full resolution preview"
                  className="block max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
                />
              )}
              <button
                type="button"
                onClick={() => setLightboxUrl(null)}
                className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-white/95 text-grey-700 shadow-md transition-colors hover:bg-white"
                aria-label="Close"
              >
                <CloseIcon className="size-4" />
              </button>
            </HeadlessDialog.Panel>
          </div>
        </Transition.Child>
      </Dialog>
    </div>
  );
};
