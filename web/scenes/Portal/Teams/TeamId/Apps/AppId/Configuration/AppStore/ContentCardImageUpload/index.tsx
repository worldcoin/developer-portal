import { Button } from "@/components/Button";
import { TrashIcon } from "@/components/Icons/TrashIcon";
import { WorldIcon } from "@/components/Icons/WorldIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { getCDNImageUrl } from "@/lib/utils";
import clsx from "clsx";
import { useAtom } from "jotai";
import Image from "next/image";
import { ChangeEvent, useMemo, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { toast } from "react-toastify";
import { FetchAppMetadataDocument } from "../../graphql/client/fetch-app-metadata.generated";
import { ImageValidationError, useImage } from "../../hook/use-image";
import ImageLoader from "../ImageForm/ImageLoader";
import { unverifiedImageAtom, viewModeAtom } from "../../layout/ImagesProvider";
import { cleanupRemovedImage } from "../server/cleanup-removed-image";
import { useUpdateContentCardImageMutation } from "./graphql/client/update-content-card-image.generated";

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
  const [isSecondUpload, setIsSecondUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [disabled] = useState(false);
  const [viewMode] = useAtom(viewModeAtom);
  const [unverifiedImages, setUnverifiedImages] = useAtom(unverifiedImageAtom);
  const [updateContentCardImageMutation, { loading }] =
    useUpdateContentCardImageMutation();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { getImage, uploadViaPresignedPost, validateImageAspectRatio } =
    useImage();
  const handleUpload = () => {
    imageInputRef.current?.click();
  };

  const handleFileInput = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    const imageType = "content_card_image";

    if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
      const fileTypeEnding = file.type.split("/")[1];

      try {
        const currentImagePath = contentCardImageFile || null;

        // Aspect ratio of 345px width and 240px height
        await validateImageAspectRatio(file, 345, 240);

        setIsUploading(true);
        toast.dismiss(ImageValidationError.prototype.toastId);
        await uploadViaPresignedPost(file, appId, teamId, imageType);

        const imageUrl = await getImage(
          fileTypeEnding,
          appId,
          teamId,
          imageType,
        );

        setUnverifiedImages({
          ...unverifiedImages,
          content_card_image_url: imageUrl,
        });

        const saveFileType = fileTypeEnding === "jpeg" ? "jpg" : fileTypeEnding;
        const newFileName = `${imageType}.${saveFileType}`;

        await updateContentCardImageMutation({
          variables: {
            id: appMetadataId,
            fileName: newFileName,
          },

          refetchQueries: [FetchAppMetadataDocument],
        });

        // Fire-and-forget: expire the old image if the extension changed
        if (currentImagePath && currentImagePath !== newFileName) {
          cleanupRemovedImage(appId, appMetadataId, "content_card_image", currentImagePath);
        }

        // TODO: This is a hotfix since the path names are fixed the browser caches the image and doesn't update it.
        // Will be fixed after the dev-portal update is done to avoid large backend changes for now.
        if (isSecondUpload) {
          window.location.reload();
        } else {
          setIsSecondUpload(true);
        }
      } catch (error) {
        console.error("Content Card Image Upload Failed: ", error);

        if (!(error instanceof ImageValidationError)) {
          toast.error("Error uploading image");
        }
      } finally {
        setIsUploading(false);
      }
    }
  };

  const removeImage = async () => {
    const currentImagePath = contentCardImageFile || null;
    const previous = unverifiedImages;
    setUnverifiedImages({
      ...unverifiedImages,
      content_card_image_url: "",
    });

    try {
      await updateContentCardImageMutation({
        variables: {
          id: appMetadataId,
          fileName: "",
        },

        refetchQueries: [FetchAppMetadataDocument],
      });

      // Fire-and-forget: expire the old image in S3
      if (currentImagePath) {
        cleanupRemovedImage(appId, appMetadataId, "content_card_image", currentImagePath);
      }
    } catch {
      setUnverifiedImages(previous);
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
    return <Skeleton className="h-[200px] w-full rounded-xl" />;
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

      {/* Verified: full-width image */}
      {viewMode === "verified" &&
        (verifiedImageError ? (
          <div className="flex h-[200px] w-full items-center justify-center rounded-xl bg-blue-100">
            <WorldIcon className="size-10 text-blue-500" />
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={verifiedImageURL}
            alt="content card image"
            className="h-[200px] w-full rounded-xl object-cover drop-shadow-sm"
            onError={() => setVerifiedImageError(true)}
          />
        ))}

      {/* Unverified: uploading loader */}
      {viewMode === "unverified" && isUploading && (
        <ImageLoader name="content_card_image" className="h-[200px] w-full" />
      )}

      {/* Unverified: uploaded image or drop zone */}
      {viewMode === "unverified" &&
        !isUploading &&
        (unverifiedImages?.content_card_image_url ? (
          <div className="relative overflow-hidden rounded-xl">
            <Image
              alt="content card image"
              src={unverifiedImages?.content_card_image_url}
              className="h-[200px] w-full rounded-xl object-cover"
              width={1200}
              height={600}
            />
            <Button
              type="button"
              onClick={removeImage}
              disabled={loading || !isEditable}
              className={clsx(
                "absolute right-4 top-4 flex size-8 items-center justify-center rounded-full border border-grey-200 bg-white shadow-sm transition-colors hover:bg-grey-100 disabled:cursor-not-allowed disabled:opacity-50",
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
                  345x240px.
                </Typography>
              )}
            </div>
          </label>
        ))}
    </div>
  );
};
