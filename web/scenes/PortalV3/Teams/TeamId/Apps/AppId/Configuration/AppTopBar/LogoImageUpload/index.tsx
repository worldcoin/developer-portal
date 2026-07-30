import { useAtom } from "jotai";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { FetchAppMetadataDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";
import { useCroppedImageUpload, useImage } from "../../hook/use-image";
import { ImageCropDialog } from "../../AppStore/ImageForm/ImageCropDialog";
import { unverifiedImageAtom } from "../../layout/ImagesProvider";
import { useMutation } from "@apollo/client/react";
import { UpdateLogoDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppTopBar/LogoImageUpload/graphql/client/update-logo.generated";

type LogoImageUploadProps = {
  appId: string;
  appMetadataId: string;
  teamId: string;
  /**
   * Rising edge forwards the caller's click straight to the native file
   * picker (no intermediate dialog); onClose resets the trigger so the next
   * click fires again.
   */
  open?: boolean;
  onClose?: () => void;
};

/**
 * Owns the logo upload pipeline: presigned S3 POST, unverified-image atom
 * update, the UpdateLogo mutation, and the square-crop gate. Shared between
 * the headless component below and the configuration wizard's designed drop
 * zone so both surfaces persist through the exact same path.
 */
export const useLogoUpload = ({
  appId,
  appMetadataId,
  teamId,
  open,
  onClose,
}: LogoImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [unverifiedImages, setUnverifiedImages] = useAtom(unverifiedImageAtom);
  const [updateLogoMutation] = useMutation(UpdateLogoDocument);
  const { getImage, uploadViaPresignedPost } = useImage();

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

  return {
    isUploading,
    uploadLogo,
    cropCandidate,
    clearCropCandidate,
    handleFileSelected,
  };
};

/**
 * Headless logo upload: a hidden file input plus the shared crop dialog.
 * Selecting a square file uploads immediately; other aspect ratios open the
 * cropper first.
 */
export const LogoImageUpload = ({
  appId,
  appMetadataId,
  teamId,
  open,
  onClose,
}: LogoImageUploadProps) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const {
    isUploading,
    uploadLogo,
    cropCandidate,
    clearCropCandidate,
    handleFileSelected,
  } = useLogoUpload({ appId, appMetadataId, teamId });

  useEffect(() => {
    if (!open) return;
    // Still within the caller's click activation, so the picker may open.
    imageInputRef.current?.click();
    onClose?.();
  }, [open, onClose]);

  const handleFileInput = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await handleFileSelected(file);
  };

  return (
    <>
      <input
        ref={imageInputRef}
        type="file"
        accept=".png,.jpg,.jpeg"
        onChange={handleFileInput}
        style={{ display: "none" }}
      />

      <ImageCropDialog
        file={cropCandidate}
        title="Crop app image"
        targetWidth={512}
        targetHeight={512}
        isApplying={isUploading}
        onApply={uploadLogo}
        onClosed={clearCropCandidate}
        previewAlt="Logo crop preview"
      />
    </>
  );
};
