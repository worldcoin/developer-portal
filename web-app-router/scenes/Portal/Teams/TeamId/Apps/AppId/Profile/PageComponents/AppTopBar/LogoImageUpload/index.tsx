import { useAtom } from "jotai";
import {
  unverifiedImageAtom,
  verifiedImagesAtom,
  viewModeAtom,
} from "../../../layout";
import Image from "next/image";
import { useRef } from "react";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { WorldcoinIcon } from "@/components/Icons/WorldcoinIcon";
import clsx from "clsx";
import { EditIcon } from "@/components/Icons/EditIcon";
import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { DialogPanel } from "@/components/DialogPanel";
import { ChangeEvent, useState } from "react";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DecoratedButton } from "@/components/DecoratedButton";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import { toast } from "react-toastify";
import { useImage } from "../../../hook/use-image";
import { useUpdateLogoMutation } from "./graphql/client/update-logo.generated";

type LogoImageUploadProps = {
  appId: string;
  appMetadataId: string;
  teamId: string;
  editable: boolean;
};
export const LogoImageUpload = (props: LogoImageUploadProps) => {
  const { appId, appMetadataId, teamId, editable } = props;
  const [showDialog, setShowDialog] = useState(false);
  const [mode] = useAtom(viewModeAtom);
  const [unverifiedImages, setUnverifiedImages] = useAtom(unverifiedImageAtom);
  const [verifiedImages] = useAtom(verifiedImagesAtom);
  const [disabled] = useState(false);
  const { getImage, uploadViaPresignedPost, validateImageDimensions } =
    useImage();
  const [updateLogoMutation, { loading }] = useUpdateLogoMutation();
  const imageInputRef = useRef<HTMLInputElement>(null);

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
        console.log(`${imageType}.${fileTypeEnding}`);
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

  return (
    <div
      className={clsx(
        "bg-blue-100 rounded-2xl h-20 w-20 items-center flex justify-center relative",
      )}
    >
      <Dialog open={showDialog} onClose={() => setShowDialog(false)}>
        <DialogOverlay />
        <DialogPanel className="bg-white max-w-[440px] grid gap-y-10">
          <div className="grid grid-cols-1fr/auto justify-between w-full">
            <Typography variant={TYPOGRAPHY.H6}>Edit app image</Typography>
            <Button
              type="button"
              onClick={() => setShowDialog(false)}
              className="rounded-full bg-grey-100 hover:bg-grey-200 h-7 w-7 flex items-center justify-center"
            >
              <CloseIcon className="w-4 h-4" />
            </Button>
          </div>
          <div className="border rounded-xl p-6 border-grey-200 grid gap-y-6">
            {unverifiedImages?.logo_img_url ? (
              <div>
                <Image
                  src={unverifiedImages?.logo_img_url}
                  alt="Uploaded"
                  className="rounded-lg w-28 h-28 object-contain"
                  width={500}
                  height={500}
                />
              </div>
            ) : (
              <div className="bg-blue-100 h-24 w-24 flex items-center justify-center rounded-2xl">
                <WorldcoinIcon className="w-10 h-10 text-blue-500" />
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
            <Typography variant={TYPOGRAPHY.R3} className="text-grey-90">
              Image requirements
            </Typography>
            <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
              Upload a PNG or JPG image smaller than 250 kb. The preview box
              shows the logo’s final display size.
            </Typography>
          </div>
          <div className="grid grid-cols-2 gap-x-4 w-full">
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
      {mode === "verified" && (
        <img src={verifiedImages?.logo_img_url} alt="logo" />
      )}
      {mode === "unverified" &&
        (unverifiedImages?.logo_img_url ? (
          <Image
            alt="logo"
            src={unverifiedImages?.logo_img_url}
            className="h-20 w-20"
            width={500}
            height={500}
          />
        ) : (
          <WorldcoinIcon className="w-10 h-10 text-blue-500" />
        ))}
      <Button
        type="button"
        onClick={() => setShowDialog(true)}
        className={clsx(
          "absolute -bottom-2 -right-2 p-2 bg-white rounded-full border-2 border-grey-200 text-grey-500 hover:bg-grey-50",
          { hidden: !editable },
        )}
      >
        <EditIcon className="w-3 h-3 " />
      </Button>
    </div>
  );
};
