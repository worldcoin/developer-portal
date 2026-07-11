import { Button } from "@/components/Button";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import { EditIcon } from "@/components/Icons/EditIcon";
import { WorldIcon } from "@/components/Icons/WorldIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { getCDNImageUrl } from "@/lib/utils";
import clsx from "clsx";
import { useAtom } from "jotai";
import Image from "next/image";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { toast } from "react-toastify";
import { FetchAppMetadataDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";
import { useCroppedImageUpload, useImage } from "../../hook/use-image";
import ImageLoader from "../../AppStore/ImageForm/ImageLoader";
import { ImageCropper } from "../../AppStore/ImageForm/ImageCropper";
import { unverifiedImageAtom, viewModeAtom } from "../../layout/ImagesProvider";
import { useUpdateLogoMutation } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppTopBar/LogoImageUpload/graphql/client/update-logo.generated";

type LogoImageUploadProps = {
  appId: string;
  appMetadataId: string;
  teamId: string;
  editable: boolean;
  isError: boolean;
  logoFile?: string;
  open?: boolean;
  onClose?: () => void;
  dialogOnly?: boolean;
};

export const LogoImageUpload = (props: LogoImageUploadProps) => {
  const {
    appId,
    appMetadataId,
    teamId,
    editable,
    isError,
    logoFile,
    open,
    onClose,
    dialogOnly,
  } = props;
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    if (open) setShowDialog(true);
  }, [open]);
  const [verifiedImageError, setVerifiedImageError] = useState(false);
  const [isSecondUpload, setIsSecondUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [disabled] = useState(false);
  const [viewMode] = useAtom(viewModeAtom);
  const [unverifiedImages, setUnverifiedImages] = useAtom(unverifiedImageAtom);
  const [updateLogoMutation, { loading }] = useUpdateLogoMutation();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { getImage, uploadViaPresignedPost } = useImage();
  const handleUpload = () => {
    imageInputRef.current?.click();
  };

  const handleClose = () => {
    setShowDialog(false);
    onClose?.();
  };

  const uploadLogo = async (file: File): Promise<boolean> => {
    const imageType = "logo_img";
    const fileTypeEnding = file.type.split("/")[1];

    try {
      setIsUploading(true);
      await uploadViaPresignedPost(file, appId, teamId, imageType);

      const imageUrl = await getImage(fileTypeEnding, appId, teamId, imageType);

      setUnverifiedImages({
        ...unverifiedImages,
        logo_img_url: imageUrl,
      });

      const saveFileType = fileTypeEnding === "jpeg" ? "jpg" : fileTypeEnding;

      await updateLogoMutation({
        variables: {
          id: appMetadataId,
          fileName: `${imageType}.${saveFileType}`,
        },

        refetchQueries: [FetchAppMetadataDocument],
      });

      // TODO: This is a hotfix since the path names are fixed the browser caches the image and doesn't update it.
      // Will be fixed after the dev-portal update is done to avoid large backend changes for now.
      if (isSecondUpload) {
        window.location.reload();
      } else {
        setIsSecondUpload(true);
      }
      handleClose();
      return true;
    } catch (error) {
      console.error("Logo Upload Failed: ", error);
      toast.error("Error uploading image");
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const { cropCandidate, clearCropCandidate, handleFileSelected } =
    useCroppedImageUpload({
      targetWidth: 512,
      targetHeight: 512,
      upload: uploadLogo,
    });

  const handleFileInput = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await handleFileSelected(file);
  };

  const removeImage = async () => {
    const previous = unverifiedImages;
    setUnverifiedImages({
      ...unverifiedImages,
      logo_img_url: "",
    });

    try {
      await updateLogoMutation({
        variables: {
          id: appMetadataId,
          fileName: "",
        },

        refetchQueries: [FetchAppMetadataDocument],
      });
    } catch {
      setUnverifiedImages(previous);
      toast.error("Failed to remove image");
    }

    handleClose();
  };

  const verifiedImageURL = useMemo(() => {
    if (viewMode === "unverified" || !logoFile) {
      return "";
    }
    return getCDNImageUrl(appId, logoFile);
  }, [appId, logoFile, viewMode]);

  return (
    <div
      className={clsx(
        "relative flex w-20 flex-col items-center justify-center",
        dialogOnly && "contents",
      )}
    >
      <Dialog
        open={showDialog}
        onClose={handleClose}
        afterLeave={clearCropCandidate}
      >
        <DialogOverlay />
        <DialogPanel
          className={clsx(
            "grid gap-y-10",
            cropCandidate ? "md:max-w-[36rem]" : "md:max-w-[28rem]",
          )}
        >
          <div className="grid w-full grid-cols-1fr/auto justify-between">
            <Typography variant={TYPOGRAPHY.H6}>
              {cropCandidate ? "Crop app image" : "Edit app image"}
            </Typography>
            <Button
              type="button"
              aria-label="Close image editor"
              onClick={handleClose}
              className="flex size-7 items-center justify-center rounded-full bg-grey-100 hover:bg-grey-200"
            >
              <CloseIcon className="size-4" />
            </Button>
          </div>
          {cropCandidate ? (
            <ImageCropper
              file={cropCandidate}
              targetWidth={512}
              targetHeight={512}
              isApplying={isUploading}
              onCancel={handleClose}
              onApply={async (croppedFile) => {
                await uploadLogo(croppedFile);
              }}
              previewAlt="Logo crop preview"
            />
          ) : (
            <>
              <div className="grid gap-y-6 rounded-xl border border-grey-200 p-6">
                {isUploading ? (
                  <ImageLoader name="App icon" className="h-28 w-full" />
                ) : unverifiedImages?.logo_img_url &&
                  unverifiedImages.logo_img_url !== "loading" ? (
                  <div>
                    <Image
                      src={unverifiedImages.logo_img_url}
                      alt="Uploaded"
                      className="size-28 rounded-2xl object-contain drop-shadow-lg"
                      width={512}
                      height={512}
                    />
                  </div>
                ) : (
                  <div className="flex size-24 items-center justify-center rounded-2xl bg-blue-100">
                    <WorldIcon className="size-10 text-blue-500" />
                  </div>
                )}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  disabled={disabled}
                  onChange={handleFileInput}
                  style={{ display: "none" }}
                />
                <Typography variant={TYPOGRAPHY.R3} className="text-grey-900">
                  Image requirements
                </Typography>
                <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
                  Upload a PNG or JPG under 500 kB. Square images upload
                  directly; other aspect ratios can be cropped to 1:1.
                </Typography>
              </div>
              <div className="grid w-full grid-cols-2 gap-x-4">
                <DecoratedButton
                  type="button"
                  variant="secondary"
                  disabled={
                    loading ||
                    isUploading ||
                    !unverifiedImages?.logo_img_url ||
                    unverifiedImages.logo_img_url === "loading"
                  }
                  onClick={removeImage}
                  className="w-full bg-grey-100 hover:bg-grey-200"
                >
                  Remove
                </DecoratedButton>
                <DecoratedButton
                  type="button"
                  disabled={loading || isUploading}
                  className="w-full"
                  onClick={handleUpload}
                >
                  Upload
                </DecoratedButton>
              </div>
            </>
          )}
        </DialogPanel>
      </Dialog>
      {/* Using img here since CDN caches for us and measured load time, Next/Image is actually slower */}
      {!dialogOnly &&
        viewMode === "verified" &&
        (verifiedImageError ? (
          <div className="flex size-full items-center justify-center rounded-2xl bg-blue-100">
            <WorldIcon className="size-10  text-blue-500" />
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={verifiedImageURL}
            alt="logo"
            className="rounded-2xl drop-shadow-lg"
            onError={() => setVerifiedImageError(true)}
          />
        ))}
      {!dialogOnly &&
        viewMode === "unverified" &&
        (unverifiedImages?.logo_img_url ? (
          unverifiedImages?.logo_img_url === "loading" ? (
            <Skeleton className="size-20" />
          ) : (
            <Image
              alt="logo"
              src={unverifiedImages?.logo_img_url}
              className="size-20 rounded-2xl drop-shadow-lg"
              width={512}
              height={512}
            />
          )
        ) : (
          <div
            className={clsx(
              "flex size-20 items-center justify-center rounded-2xl bg-blue-100",
              {
                "border-2 border-system-error-500 bg-system-error-50 p-2":
                  isError,
              },
            )}
          >
            <div className="flex flex-col items-center gap-1">
              <WorldIcon className="size-6 text-blue-500" />
              {isError && (
                <Typography
                  variant={TYPOGRAPHY.R5}
                  className="text-center text-system-error-500"
                >
                  Logo is required.
                </Typography>
              )}
            </div>
          </div>
        ))}
      {!dialogOnly && (
        <>
          <Button
            type="button"
            onClick={() => setShowDialog(true)}
            className={clsx(
              "absolute -bottom-2 -right-2 rounded-full border-2 border-grey-200 bg-white p-2 text-grey-500 hover:bg-grey-50",
              { hidden: !editable || viewMode === "verified" },
            )}
          >
            <EditIcon className="size-3" />
          </Button>
        </>
      )}
    </div>
  );
};
