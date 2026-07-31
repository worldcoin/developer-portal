import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import { TrashIcon } from "@/components/Icons/TrashIcon";
import { WorldIcon } from "@/components/Icons/WorldIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { getCDNImageUrl } from "@/lib/utils";
import { Dialog as HeadlessDialog, Transition } from "@headlessui/react";
import clsx from "clsx";
import { useAtom } from "jotai";
import Image from "next/image";
import { ChangeEvent, Fragment, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useAppImageUpload } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/hook/use-app-image-upload";
import { useCroppedImageUpload } from "../../hook/use-image";
import { ImageCropDialog } from "../ImageForm/ImageCropDialog";
import ImageLoader from "../ImageForm/ImageLoader";
import { unverifiedImageAtom, viewModeAtom } from "../../layout/ImagesProvider";
import { UpdateContentCardImageDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppStore/ContentCardImageUpload/graphql/client/update-content-card-image.generated";
import { useMutation } from "@apollo/client/react";

const PREVIEW_HEIGHT_PX = 200;
const previewStyle = {
  height: `${PREVIEW_HEIGHT_PX}px`,
  width: `${(PREVIEW_HEIGHT_PX * 345) / 240}px`,
};

// 345:240 defines the required aspect ratio only — crops export at native
// resolution, constrained by nothing but the byte limit.
const TARGET_WIDTH_PX = 345;
const TARGET_HEIGHT_PX = 240;

type ContentCardImageUploadProps = {
  appId: string;
  appMetadataId: string;
  teamId: string;
  isEditable: boolean;
  isError: boolean;
  contentCardImageFile?: string;
};

export const ContentCardImageUpload = (props: ContentCardImageUploadProps) => {
  const {
    appId,
    appMetadataId,
    teamId,
    isEditable,
    isError,
    contentCardImageFile,
  } = props;
  const [verifiedImageError, setVerifiedImageError] = useState(false);
  const [disabled] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [viewMode] = useAtom(viewModeAtom);
  const [unverifiedImages] = useAtom(unverifiedImageAtom);
  // The mutation returns the updated content_card_image_url, so the
  // app_metadata entity in the Apollo cache stays current without a refetch.
  const [updateContentCardImageMutation, { loading }] = useMutation(
    UpdateContentCardImageDocument,
  );
  const imageInputRef = useRef<HTMLInputElement>(null);
  const {
    upload,
    isUploading,
    pendingPreviewUrl,
    patchImagesCache,
    readImagesCache,
  } = useAppImageUpload({ appId, teamId });
  const handleUpload = () => {
    imageInputRef.current?.click();
  };

  const uploadContentCardImage = (file: File): Promise<boolean> =>
    upload({
      file,
      imageType: "content_card_image",
      persist: (fileName) =>
        updateContentCardImageMutation({
          variables: { id: appMetadataId, fileName },
        }),
      commit: ({ signedUrl }) =>
        patchImagesCache(() => ({ content_card_image_url: signedUrl })),
      onError: () => toast.error("Error uploading image"),
    });

  const { cropCandidate, clearCropCandidate, handleFileSelected } =
    useCroppedImageUpload({
      targetWidth: TARGET_WIDTH_PX,
      targetHeight: TARGET_HEIGHT_PX,
      upload: uploadContentCardImage,
    });

  const handleFileInput = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await handleFileSelected(file);
  };

  const removeImage = async () => {
    const previous = readImagesCache()?.content_card_image_url ?? null;
    patchImagesCache(() => ({ content_card_image_url: null }));

    try {
      await updateContentCardImageMutation({
        variables: {
          id: appMetadataId,
          fileName: "",
        },
      });
    } catch {
      patchImagesCache(() => ({ content_card_image_url: previous }));
      toast.error("Failed to remove image");
    }
  };

  const verifiedImageURL = useMemo(() => {
    if (viewMode === "unverified" || !contentCardImageFile) {
      return "";
    }
    return getCDNImageUrl(appId, contentCardImageFile);
  }, [appId, contentCardImageFile, viewMode]);

  if (
    viewMode === "unverified" &&
    unverifiedImages?.content_card_image_url === "loading"
  ) {
    return (
      <div
        className="animate-pulse rounded-xl bg-grey-100"
        style={previewStyle}
      />
    );
  }

  return (
    <div className="grid w-full gap-y-1">
      <input
        ref={imageInputRef}
        type="file"
        accept=".png,.jpg,.jpeg"
        disabled={disabled}
        onChange={handleFileInput}
        style={{ display: "none" }}
      />

      <ImageCropDialog
        file={cropCandidate}
        title="Crop content card image"
        targetWidth={TARGET_WIDTH_PX}
        targetHeight={TARGET_HEIGHT_PX}
        isApplying={isUploading}
        onApply={uploadContentCardImage}
        onClosed={clearCropCandidate}
        previewAlt="Content card image crop preview"
      />

      {/* Verified: thumbnail */}
      {viewMode === "verified" &&
        (verifiedImageError ? (
          <div
            className="flex items-center justify-center rounded-xl bg-blue-100"
            style={previewStyle}
          >
            <WorldIcon className="size-10 text-blue-500" />
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl" style={previewStyle}>
            <button
              type="button"
              onClick={() => setLightboxUrl(verifiedImageURL)}
              className="block size-full cursor-zoom-in"
              aria-label="View full resolution"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={verifiedImageURL}
                alt="content card image"
                className="size-full rounded-xl object-contain drop-shadow-xs"
                onError={() => setVerifiedImageError(true)}
              />
            </button>
          </div>
        ))}

      {/* Unverified: uploading preview — the local blob shows immediately */}
      {viewMode === "unverified" && isUploading && (
        <div
          className="relative overflow-hidden rounded-xl"
          style={previewStyle}
        >
          {pendingPreviewUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pendingPreviewUrl}
                alt="content card image upload preview"
                className="size-full rounded-xl object-contain"
              />
              <div className="absolute inset-0 animate-pulse rounded-xl bg-white/40" />
            </>
          ) : (
            <ImageLoader name="content_card_image" className="size-full" />
          )}
        </div>
      )}

      {/* Unverified: uploaded image or drop zone */}
      {viewMode === "unverified" &&
        !isUploading &&
        (unverifiedImages?.content_card_image_url ? (
          <div
            className="relative overflow-hidden rounded-xl"
            style={previewStyle}
          >
            <button
              type="button"
              onClick={() =>
                setLightboxUrl(unverifiedImages?.content_card_image_url ?? null)
              }
              className="block size-full cursor-zoom-in"
              aria-label="View full resolution"
            >
              <Image
                alt="content card image"
                src={unverifiedImages?.content_card_image_url}
                className="size-full rounded-xl object-contain"
                width={345}
                height={240}
              />
            </button>
            <Button
              type="button"
              onClick={removeImage}
              disabled={loading || !isEditable}
              className={clsx(
                "absolute top-4 right-4 flex size-8 items-center justify-center rounded-full border border-grey-200 bg-white shadow-xs transition-colors hover:bg-grey-100 disabled:cursor-not-allowed disabled:opacity-50",
                { hidden: !isEditable },
              )}
            >
              <TrashIcon className="text-grey-500" />
            </Button>
          </div>
        ) : (
          <label
            className={clsx(
              "flex h-[168px] w-full cursor-pointer flex-col items-center justify-center gap-y-3 rounded-[10px] border border-dashed bg-grey-50 p-6 hover:bg-grey-100",
              isError
                ? "border-system-error-500 bg-system-error-50"
                : "border-grey-200",
            )}
            onClick={handleUpload}
          >
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
                or{" "}
                <span className="font-semibold text-grey-700">
                  browse files
                </span>
              </Typography>
              {isError && (
                <Typography
                  variant={TYPOGRAPHY.R5}
                  className="text-center text-system-error-500"
                >
                  Content card image is required. Required aspect ratio is
                  345:240.
                </Typography>
              )}
            </div>
          </label>
        ))}

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
