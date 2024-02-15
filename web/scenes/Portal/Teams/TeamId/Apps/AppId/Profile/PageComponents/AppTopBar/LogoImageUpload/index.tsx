import { Button } from "@/components/Button";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import { EditIcon } from "@/components/Icons/EditIcon";
import { WorldcoinIcon } from "@/components/Icons/WorldcoinIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { getCDNImageUrl } from "@/lib/utils";
import clsx from "clsx";
import { useAtom } from "jotai";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChangeEvent, useMemo, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { toast } from "react-toastify";
import { useImage } from "../../../hook/use-image";
import {
  unverifiedImageAtom,
  viewModeAtom,
} from "../../../layout/ImagesProvider";
import { useUpdateLogoMutation } from "./graphql/client/update-logo.generated";

type LogoImageUploadProps = {
  appId: string;
  appMetadataId: string;
  teamId: string;
  editable: boolean;
  logoFile?: string;
};
export const LogoImageUpload = (props: LogoImageUploadProps) => {
  const { appId, appMetadataId, teamId, editable, logoFile } = props;
  const [showDialog, setShowDialog] = useState(false);
  const [verifiedImageError, setVerifiedImageError] = useState(false);
  const [isSecondUpload, setIsSecondUpload] = useState(false);
  const [disabled] = useState(false);
  const [viewMode] = useAtom(viewModeAtom);
  const [unverifiedImages, setUnverifiedImages] = useAtom(unverifiedImageAtom);
  const [updateLogoMutation, { loading }] = useUpdateLogoMutation();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { getImage, uploadViaPresignedPost, validateImageDimensions } =
    useImage();
  const router = useRouter();
  const handleUpload = () => {
    imageInputRef.current?.click();
  };

  const handleFileInput = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    const imageType = "logo_img";

    if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
      const fileTypeEnding = file.type.split("/")[1];
      toast.info("Uploading image", {
        toastId: "upload_toast",
        autoClose: false,
      });
      try {
        await validateImageDimensions(file, 500, 500);
        await uploadViaPresignedPost(file, appId, teamId, imageType);

        const imageUrl = await getImage(
          fileTypeEnding,
          appId,
          teamId,
          imageType,
        );

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
          context: { headers: { team_id: teamId } },
        });

        toast.update("upload_toast", {
          type: "success",
          render: "Image uploaded successfully",
          autoClose: 5000,
        });
        // TODO: This is a hotfix since the path names are fixed the browser caches the image and doesn't update it.
        // Will be fixed after the dev-portal update is done to avoid large backend changes for now.
        if (isSecondUpload) {
          window.location.reload();
        } else {
          setIsSecondUpload(true);
        }
        setShowDialog(false);
      } catch (error) {
        console.error(error);
        toast.update("upload_toast", {
          type: "error",
          render: "Error uploading image",
          autoClose: 5000,
        });
      }
    }
  };

  const removeImage = async () => {
    setUnverifiedImages({
      ...unverifiedImages,
      logo_img_url: "",
    });
    await updateLogoMutation({
      variables: {
        id: appMetadataId,
        fileName: "",
      },
      context: { headers: { team_id: teamId } },
    });
  };

  const verifiedImageURL = useMemo(() => {
    if (viewMode === "unverified" || !logoFile) {
      return "";
    }
    return getCDNImageUrl(appId, logoFile);
  }, [appId, logoFile, viewMode]);

  return (
    <div className={clsx("relative flex size-20 items-center justify-center")}>
      <Dialog open={showDialog} onClose={() => setShowDialog(false)}>
        <DialogOverlay />
        <DialogPanel className="grid max-w-[440px] gap-y-10 bg-white">
          <div className="grid w-full grid-cols-1fr/auto justify-between">
            <Typography variant={TYPOGRAPHY.H6}>Edit app image</Typography>
            <Button
              type="button"
              onClick={() => setShowDialog(false)}
              className="flex size-7 items-center justify-center rounded-full bg-grey-100 hover:bg-grey-200"
            >
              <CloseIcon className="size-4" />
            </Button>
          </div>
          <div className="grid gap-y-6 rounded-xl border border-grey-200 p-6">
            {unverifiedImages?.logo_img_url ? (
              <div>
                <Image
                  src={unverifiedImages?.logo_img_url}
                  alt="Uploaded"
                  className="size-28 rounded-2xl object-contain drop-shadow-lg"
                  width={500}
                  height={500}
                />
              </div>
            ) : (
              <div className="flex size-24 items-center justify-center rounded-2xl bg-blue-100">
                <WorldcoinIcon className="size-10 text-blue-500" />
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
              Upload a PNG or JPG image smaller than 250 kb. The preview box
              shows the logo’s final display size.
            </Typography>
          </div>
          <div className="grid w-full grid-cols-2 gap-x-4">
            <DecoratedButton
              type="button"
              variant="secondary"
              disabled={loading}
              onClick={removeImage}
              className="w-full bg-grey-100 hover:bg-grey-200"
            >
              Remove
            </DecoratedButton>
            <DecoratedButton
              type="button"
              variant="secondary"
              disabled={loading}
              className="w-full"
              onClick={handleUpload}
            >
              Upload
            </DecoratedButton>
          </div>
        </DialogPanel>
      </Dialog>
      {/* Using img here since CDN caches for us and measured load time, Next/Image is actually slower */}
      {viewMode === "verified" &&
        (verifiedImageError ? (
          <div className="flex size-full items-center justify-center rounded-2xl bg-blue-100">
            <WorldcoinIcon className="size-10  text-blue-500" />
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={verifiedImageURL}
            alt="logo"
            className="drop-shadow-lg"
            onError={() => setVerifiedImageError(true)}
          />
        ))}
      {viewMode === "unverified" &&
        (unverifiedImages?.logo_img_url ? (
          unverifiedImages?.logo_img_url === "loading" ? (
            <Skeleton className="size-20" />
          ) : (
            <Image
              alt="logo"
              src={unverifiedImages?.logo_img_url}
              className="size-20 rounded-2xl drop-shadow-lg"
              width={500}
              height={500}
            />
          )
        ) : (
          <div className="flex size-full items-center justify-center rounded-2xl bg-blue-100">
            <WorldcoinIcon className="size-10  text-blue-500" />
          </div>
        ))}
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
    </div>
  );
};
