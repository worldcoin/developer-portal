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
import { useAppImageUpload } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/hook/use-app-image-upload";
import { useImage } from "../../hook/use-image";
import ImageLoader from "../../AppStore/ImageForm/ImageLoader";
import { unverifiedImageAtom, viewModeAtom } from "../../layout/ImagesProvider";
import { useMutation } from "@apollo/client/react";
import { UpdateLogoDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppTopBar/LogoImageUpload/graphql/client/update-logo.generated";

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
  const [disabled] = useState(false);
  const [viewMode] = useAtom(viewModeAtom);
  const [unverifiedImages] = useAtom(unverifiedImageAtom);
  // The mutation returns the updated logo_img_url, so the app_metadata entity
  // in the Apollo cache stays current without a refetch.
  const [updateLogoMutation, { loading }] = useMutation(UpdateLogoDocument);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { validateImageAspectRatio } = useImage();
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

  const uploadLogo = (file: File): Promise<boolean> =>
    upload({
      file,
      imageType: "logo_img",
      persist: (fileName) =>
        updateLogoMutation({ variables: { id: appMetadataId, fileName } }),
      commit: ({ signedUrl }) =>
        patchImagesCache(() => ({ logo_img_url: signedUrl })),
      onError: () => toast.error("Error uploading image"),
    });

  const handleFileInput = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;

    if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
      try {
        // Aspect ratio of 1:1 — validation surfaces its own toast
        await validateImageAspectRatio(file, 1, 1);
      } catch {
        return;
      }

      if (await uploadLogo(file)) {
        handleClose();
      }
    }
  };

  const removeImage = async () => {
    const previous = readImagesCache()?.logo_img_url ?? null;
    patchImagesCache(() => ({ logo_img_url: null }));

    try {
      await updateLogoMutation({
        variables: {
          id: appMetadataId,
          fileName: "",
        },
      });
    } catch {
      patchImagesCache(() => ({ logo_img_url: previous }));
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

  const handleClose = () => {
    setShowDialog(false);
    onClose?.();
  };

  return (
    <div
      className={clsx(
        "relative flex w-20 flex-col items-center justify-center",
        dialogOnly && "contents",
      )}
    >
      <Dialog open={showDialog} onClose={handleClose}>
        <DialogOverlay />
        <DialogPanel className="grid gap-y-10 md:max-w-md">
          <div className="grid w-full grid-cols-1fr/auto justify-between">
            <Typography variant={TYPOGRAPHY.H6}>Edit app image</Typography>
            <Button
              type="button"
              onClick={handleClose}
              className="flex size-7 items-center justify-center rounded-full bg-grey-100 hover:bg-grey-200"
            >
              <CloseIcon className="size-4" />
            </Button>
          </div>
          <div className="grid gap-y-6 rounded-xl border border-grey-200 p-6">
            {isUploading ? (
              pendingPreviewUrl ? (
                <div className="relative size-28">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pendingPreviewUrl}
                    alt="Logo upload preview"
                    className="size-28 rounded-2xl object-contain drop-shadow-lg"
                  />
                  <div className="absolute inset-0 animate-pulse rounded-2xl bg-white/40" />
                </div>
              ) : (
                <ImageLoader name="App icon" className="h-28 w-full" />
              )
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
              Upload a PNG or JPG image smaller than 500 kb. Required aspect
              ratio 1:1. The preview box shows the logo’s final display size.
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
        </DialogPanel>
      </Dialog>
      {/* Using img here since CDN caches for us and measured load time, Next/Image is actually slower */}
      {!dialogOnly &&
        viewMode === "verified" &&
        (verifiedImageError ? (
          <div className="flex size-full items-center justify-center rounded-2xl bg-blue-100">
            <WorldIcon className="size-10 text-blue-500" />
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
              "absolute -right-2 -bottom-2 rounded-full border-2 border-grey-200 bg-white p-2 text-grey-500 hover:bg-grey-50",
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
