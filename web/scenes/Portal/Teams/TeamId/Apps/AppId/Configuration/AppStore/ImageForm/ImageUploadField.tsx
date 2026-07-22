import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import { TrashIcon } from "@/components/Icons/TrashIcon";
import { ImageDropZone } from "@/components/ImageDropZone";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { getCDNImageUrl } from "@/lib/utils";
import { Dialog as HeadlessDialog, Transition } from "@headlessui/react";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
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
      // Flips once S3 accepts the file: aborts after this point are unmount
      // bookkeeping (e.g. the keyed provider remounting and killing an
      // in-flight refetch), NOT a cancelled upload — don't toast for them.
      let s3UploadCompleted = false;

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
        s3UploadCompleted = true;
        // File is on S3 — don't let unmount abort() invent a cancel toast
        // while getImage / autosave bookkeeping finishes.
        abortControllerRef.current = null;

        const imageUrl = await getImage(
          fileTypeEnding,
          appId,
          teamId,
          imageType,
          isLocalized ? locale : undefined,
        );

        // S3 has the file from here on — the remaining steps are bookkeeping
        // and must run even if this instance unmounts mid-flight (the form
        // provider is keyed on metadata id + view mode and can remount during
        // autosave). Persistence is ownerless; only UI updates are gated.
        const extractedPath =
          extractImagePathWithExtensionFromActualUrl(imageUrl);
        const newUrls =
          maxImages === 1 ? [extractedPath] : [...value, extractedPath];

        await onAutosave(newUrls);
        // Writes into the shared Apollo cache, so a remounted successor
        // instance watching the same query re-renders with the new image.
        await onRefetchImages();

        if (isMountedRef.current) {
          onChange(newUrls);
        }
        // Parent toast / bookkeeping — must not be skipped on remount mid-upload.
        onUploadSuccess?.();
      } catch (error) {
        const isAbort = error instanceof Error && error.name === "AbortError";
        if (isAbort) {
          // Abort only comes from unmount cleanup. By then isMountedRef is
          // false — never toast "cancelled" for remount-after-success. Only
          // toast if we're somehow still mounted and S3 never got the file.
          if (isMountedRef.current && !s3UploadCompleted) {
            toast.error("Upload was cancelled", { autoClose: 5000 });
          }
          return;
        }

        console.error("error uploading image:", error);
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
          className="h-[168px] rounded-xl!"
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
                  onClick={() => handleDelete(imagePath)}
                  disabled={disabled}
                  className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full border border-grey-200 bg-white shadow-xs transition-colors hover:bg-grey-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <TrashIcon className="text-grey-500" />
                </Button>
              </div>
            );
          })}
          {isUploading && (
            <div style={previewStyle}>
              <ImageLoader
                name={imageTypeNamer(value.length)}
                className="size-full"
              />
            </div>
          )}
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
                  onClick={() => handleDelete(imagePath)}
                  disabled={disabled}
                  className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full border border-grey-200 bg-white shadow-xs transition-colors hover:bg-grey-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <TrashIcon className="text-grey-500" />
                </Button>
              </div>
            );
          })}

          {/* uploading loader occupies next slot */}
          {isUploading && (
            <div style={previewStyle}>
              <ImageLoader
                name={imageTypeNamer(value.length)}
                className="size-full"
              />
            </div>
          )}

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
