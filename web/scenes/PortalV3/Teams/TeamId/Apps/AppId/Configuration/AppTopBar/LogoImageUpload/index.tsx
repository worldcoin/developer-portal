import { ChangeEvent, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { useAppImageUpload } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/hook/use-app-image-upload";
import { useCroppedImageUpload } from "../../hook/use-image";
import { ImageCropDialog } from "../../AppStore/ImageForm/ImageCropDialog";
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
 * Owns the logo upload pipeline: the shared upload transaction (blob preview
 * → presigned S3 POST → UpdateLogo mutation → local cache commit) plus the
 * square-crop gate. Shared between the headless component below and the
 * configuration wizard's designed drop zone so both surfaces persist through
 * the exact same path. Previews flow from the FetchImages cache entry through
 * ImagesProvider's atom to every logo renderer — the blob preview lands there
 * immediately, and the signed URL replaces it on commit.
 */
export const useLogoUpload = ({
  appId,
  appMetadataId,
  teamId,
}: Pick<LogoImageUploadProps, "appId" | "appMetadataId" | "teamId">) => {
  const [updateLogoMutation] = useMutation(UpdateLogoDocument);
  const { upload, isUploading, patchImagesCache, readImagesCache } =
    useAppImageUpload({ appId, teamId });

  const uploadLogo = (file: File): Promise<boolean> =>
    upload({
      file,
      imageType: "logo_img",
      applyOptimisticPreview: (blobUrl) => {
        const previous = readImagesCache()?.logo_img_url ?? null;
        patchImagesCache(() => ({ logo_img_url: blobUrl }));
        return () => patchImagesCache(() => ({ logo_img_url: previous }));
      },
      persist: (fileName) =>
        // The mutation returns the updated logo_img_url, so the app_metadata
        // entity in the Apollo cache stays current without a refetch.
        updateLogoMutation({
          variables: { id: appMetadataId, fileName },
        }),
      commit: ({ signedUrl }) =>
        patchImagesCache(() => ({ logo_img_url: signedUrl })),
      onError: () => toast.error("Error uploading image"),
    });

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
